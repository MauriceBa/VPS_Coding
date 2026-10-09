"""Scrape recent Untappd activity and merge it into ``stats.json``.

Run as a script (typically from cron)::

    python -m mauricefun.untappd.scraper
"""

from __future__ import annotations

import json
import logging
import os
import re
from contextlib import suppress
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup, Tag

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging
from mauricefun.untappd.countries import normalize_country
from mauricefun.untappd.locations import UntappdLocations
from mauricefun.untappd.parser import infer_style
from mauricefun.untappd.recommender import run_ml_pipeline

logger = logging.getLogger(__name__)

__all__ = ["UntappdScraper", "extract_brewery"]

UNTAPPD_URL = "https://untappd.com/user/MauriceDE"
VENUES_URL = "https://untappd.com/user/MauriceDE/venues?sort=recent"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}

_TOP_VENUES = 6
_DEFAULT_RATING = 3.0
_RECENT_CHECKINS_KEPT = 10
_HTTP_TIMEOUT_SECONDS = 10
_VENUE_CHECKIN_RE = re.compile(r"(\d+)\s+Check-in", re.IGNORECASE)


def extract_brewery(full_text: str, beer_name: str) -> str:
    """Extract the brewery name from a check-in's free text, or ``"Unknown"``."""
    if " by " not in full_text:
        return "Unknown"
    try:
        after_beer = full_text.split(beer_name, 1)[1]
    except IndexError:
        return "Unknown"
    if " by " not in after_beer:
        return "Unknown"
    after_by = after_beer.split(" by ", 1)[1]
    if " at " in after_by:
        brewery = after_by.split(" at ")[0]
    elif " @ " in after_by:
        brewery = after_by.split(" @ ")[0]
    else:
        brewery = after_by
    return brewery.replace(" at ", "").replace(" in ", "").strip()


class UntappdScraper:
    """Fetches new check-ins/venues from the web and merges them into ``stats.json``."""

    def __init__(
        self,
        settings: Settings | None = None,
        session: requests.Session | None = None,
        locations: UntappdLocations | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.session = session or requests.Session()
        self.session.headers.update(HEADERS)
        self.locations = locations or UntappdLocations(self.settings)

    @property
    def stats_path(self) -> Path:
        """Resolve the stats file, falling back to the repo copy for local runs."""
        if self.settings.untappd_stats_file.exists():
            return self.settings.untappd_stats_file
        return Path("untappd/data/stats.json")

    def _fetch(self, url: str) -> BeautifulSoup | None:
        try:
            response = self.session.get(url, headers=HEADERS, timeout=_HTTP_TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            logger.error("Failed to fetch %s: %s", url, exc)
            return None
        if response.status_code != 200:
            logger.error("Failed to fetch %s (status %s)", url, response.status_code)
            return None
        return BeautifulSoup(response.text, "html.parser")

    def _update_venues(self, soup: BeautifulSoup, stats: dict[str, Any]) -> bool:
        heatmap: list[dict[str, Any]] = stats.get("heatmap", [])
        existing = {venue["venue"]: venue for venue in heatmap}
        changed = False

        for item in soup.select(".item"):
            parsed = self._parse_venue_item(item, existing)
            if parsed is None:
                continue
            name, visits = parsed["name"], parsed["visits"]
            if name in existing:
                if existing[name].get("visits", 0) >= visits:
                    continue
                existing[name]["visits"] = visits
                changed = True
                logger.info("Updated venue %s (%d visits)", name, visits)
                continue

            new_venue = self._geocode_venue(parsed["name"], parsed["address"], visits)
            heatmap.append(new_venue)
            existing[name] = new_venue
            changed = True
            logger.info("Discovered new venue: %s", name)

        if changed:
            self.locations.save_cache()
            stats["heatmap"] = sorted(
                heatmap, key=lambda venue: venue.get("visits", 0), reverse=True
            )
            valid = [venue for venue in stats["heatmap"] if venue.get("lat") is not None]
            stats["top_venues"] = valid[:_TOP_VENUES]
            stats["checkin_countries"] = self._country_breakdown(stats["heatmap"])
        return changed

    def _parse_venue_item(
        self, item: Tag, existing: dict[str, dict[str, Any]]
    ) -> dict[str, Any] | None:
        name_el = item.select_one(".name a") or item.select_one(".venue-details h2 a")
        if not name_el:
            for link in item.find_all("a"):
                href = str(link.get("href", ""))
                if "/v/" in href or "/venue/" in href:
                    name_el = link
                    break
        if not name_el:
            return None

        name = name_el.text.strip()
        visits = 1
        match = _VENUE_CHECKIN_RE.search(item.text)
        if match:
            visits = int(match.group(1))
        address_el = item.select_one(".address")
        address = address_el.text.strip() if address_el else name
        return {"name": name, "address": address, "visits": visits}

    def _geocode_venue(self, name: str, address: str, visits: int) -> dict[str, Any]:
        cache_key = f"{name}::{address}"
        if cache_key not in self.locations.cache:
            geo = self.locations.geocode(address)
            if not geo and "," in address:
                geo = self.locations.geocode(address.split(",")[-1].strip())
            self.locations.cache[cache_key] = geo or {
                "lat": None,
                "lon": None,
                "city": address.split(",")[0],
                "country": "Unknown",
            }
        geo = self.locations.cache.get(cache_key, {})
        return {
            "venue": name,
            "city": geo.get("city", "Unknown"),
            "country": geo.get("country", "Unknown"),
            "visits": visits,
            "lat": geo.get("lat"),
            "lon": geo.get("lon"),
        }

    @staticmethod
    def _country_breakdown(heatmap: list[dict[str, Any]]) -> list[dict[str, Any]]:
        counts: dict[str, int] = {}
        for venue in heatmap:
            country = normalize_country(venue.get("country", "Unknown"))
            counts[country] = counts.get(country, 0) + venue.get("visits", 0)
        result: list[dict[str, Any]] = [
            {"country": country, "count": count}
            for country, count in counts.items()
            if country != "Unknown"
        ]
        result.sort(key=lambda item: item["count"], reverse=True)
        return result

    @staticmethod
    def _parse_profile_stats(soup: BeautifulSoup) -> tuple[int | None, int | None]:
        total: int | None = None
        unique: int | None = None
        container = soup.select_one(".stats")
        if not container:
            return total, unique
        for link in container.find_all("a"):
            title_el = link.select_one(".title")
            value_el = link.select_one(".stat")
            if not title_el or not value_el:
                continue
            title = title_el.text.strip().lower()
            try:
                value = int(value_el.text.strip().replace(",", ""))
            except ValueError:
                continue
            if "total" in title:
                total = value
            elif "unique" in title:
                unique = value
        return total, unique

    def _parse_checkin_item(self, item: Tag) -> dict[str, Any] | None:
        cid_str = str(item.get("data-checkin-id", ""))
        if not cid_str:
            return None
        try:
            cid = int(cid_str)
        except (TypeError, ValueError):
            return None

        text_p = item.find(class_="text")
        if not text_p:
            return None

        beer_name: str | None = None
        brewery_name = "Unknown"
        for link in text_p.find_all("a"):
            href = str(link.get("href", ""))
            if "/user/" in href or "/v/" in href or "/at-home" in href:
                continue
            if "/beer/" in href or "/b/" in href:
                beer_name = link.text.strip()
            elif "/brewery/" in href or href.startswith("/brewery"):
                brewery_name = link.text.strip()

        if not beer_name:
            return None
        if brewery_name == "Unknown":
            full_text = text_p.get_text(separator=" ", strip=True)
            brewery_name = extract_brewery(full_text, beer_name)

        rating = _DEFAULT_RATING
        caps = item.find(class_="caps")
        if caps and caps.has_attr("data-rating"):
            with suppress(TypeError, ValueError):
                rating = float(str(caps["data-rating"]))

        time_el = item.find("a", class_="time")
        return {
            "checkin_id": cid,
            "beer": beer_name,
            "brewery": brewery_name,
            "rating": rating,
            "time": time_el.text.strip() if time_el else "Kürzlich",
        }

    def _apply_checkin(self, stats: dict[str, Any], checkin: dict[str, Any], last_id: int) -> bool:
        if checkin["checkin_id"] <= last_id:
            return False
        beer_name, brewery_name, rating = checkin["beer"], checkin["brewery"], checkin["rating"]

        for beer in stats.get("rated_beers", []):
            if beer["beer"] == beer_name:
                old_count = beer.get("rated_count", 1)
                old_avg = beer.get("avg_rating", rating)
                beer["avg_rating"] = (
                    round(((old_avg * old_count) + rating) / (old_count + 1) * 4) / 4
                )
                beer["rated_count"] = old_count + 1
                if beer.get("brewery") == "Unknown" and brewery_name != "Unknown":
                    beer["brewery"] = brewery_name
                return True

        logger.info("Discovered new beer: %s by %s (%s stars)", beer_name, brewery_name, rating)
        stats.setdefault("rated_beers", []).append(
            {
                "beer": beer_name,
                "brewery": brewery_name,
                "style": infer_style(beer_name, []),
                "avg_rating": rating,
                "rated_count": 1,
            }
        )
        top_breweries = stats.setdefault("top_breweries", [])
        for entry in top_breweries:
            if entry["brewery"] == brewery_name:
                entry["count"] += 1
                break
        else:
            top_breweries.append({"brewery": brewery_name, "count": 1})
        stats["top_breweries"] = sorted(top_breweries, key=lambda item: item["count"], reverse=True)
        return True

    def run(self) -> None:
        """Fetch the profile, merge new beers/venues and rewrite ``stats.json``."""
        stats_path = self.stats_path
        if not stats_path.exists():
            logger.error("stats.json not found at %s", stats_path)
            return

        stats: dict[str, Any] = json.loads(stats_path.read_text(encoding="utf-8"))
        profile = self._fetch(UNTAPPD_URL)
        venues_soup = self._fetch(VENUES_URL)
        venues_changed = self._update_venues(venues_soup, stats) if venues_soup else False
        if profile is None:
            return

        total_checkins_web, unique_beers_web = self._parse_profile_stats(profile)
        overview = stats.setdefault("overview", {})
        last_checkin_id = overview.get("last_checkin_id", 0)
        highest_id_seen = last_checkin_id

        recent_checkins: list[dict[str, Any]] = []
        new_checkins = 0
        items = profile.find_all("div", class_="item")
        if not items:
            logger.warning("No 'item' elements found; Untappd layout may have changed.")

        for item in items:
            checkin = self._parse_checkin_item(item)
            if checkin is None:
                continue
            highest_id_seen = max(highest_id_seen, checkin["checkin_id"])
            recent_checkins.append(checkin)
            if self._apply_checkin(stats, checkin, last_checkin_id):
                new_checkins += 1

        should_save = (
            new_checkins > 0
            or venues_changed
            or (
                total_checkins_web is not None
                and total_checkins_web > overview.get("total_checkins", 0)
            )
            or bool(recent_checkins)
        )
        if not should_save:
            logger.info("No new beers or venues; everything is up to date.")
            return

        if total_checkins_web is not None:
            overview["total_checkins"] = total_checkins_web
        if unique_beers_web is not None:
            overview["unique_beers"] = unique_beers_web
        if recent_checkins:
            stats["recent_checkins"] = recent_checkins[:_RECENT_CHECKINS_KEPT]
        overview["date_to"] = datetime.now().strftime("%Y-%m-%d")
        if highest_id_seen > last_checkin_id:
            overview["last_checkin_id"] = highest_id_seen
        stats["rated_beers"] = sorted(
            stats.get("rated_beers", []),
            key=lambda item: (item.get("avg_rating", 0), item.get("rated_count", 0)),
            reverse=True,
        )

        tmp_path = stats_path.with_suffix(stats_path.suffix + ".tmp")
        with open(tmp_path, "w", encoding="utf-8") as handle:
            json.dump(stats, handle, indent=4, ensure_ascii=False)
        os.replace(tmp_path, stats_path)
        logger.info(
            "stats.json updated (%d new beers, %d recent check-ins).",
            new_checkins,
            len(recent_checkins),
        )

        if new_checkins > 0:
            logger.info("Running ML recommendation pipeline...")
            run_ml_pipeline(self.settings)


def main() -> None:
    """Entrypoint for the ``mauricefun-untappd-scrape`` console script."""
    configure_logging()
    UntappdScraper().run()


if __name__ == "__main__":  # pragma: no cover
    main()
