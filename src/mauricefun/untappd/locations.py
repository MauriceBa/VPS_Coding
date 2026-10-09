"""Update ``stats.json`` with precise venue locations and heatmap data.

Reads the copy-pasted Untappd venue list, geocodes new venues via Nominatim (with a
disk cache) and rewrites the heatmap/top-venue/country sections of ``stats.json``.

Run as a script::

    python -m mauricefun.untappd.locations [untapped_locations.txt]
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any, cast

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging
from mauricefun.untappd.countries import normalize_country

logger = logging.getLogger(__name__)

__all__ = ["UntappdLocations", "parse_venue_lines"]

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_USER_AGENT = "MauriceUntappdHeatmapBot/1.0"
_RATE_LIMIT_SECONDS = 1.2
_TOP_VENUES = 6

#: Lines copied from the Untappd web page that carry no venue information.
NOISE_LINES: frozenset[str] = frozenset(
    {
        "Untappd",
        "Blog Top Rated Insiders Help Shop",
        "Find a beer, brewery or bar...",
        "Venue History",
        "Sort & Filter",
        "Filter Category",
        "All",
        "Sort menu by",
        "Check-Ins (viel bis wenig)",
        "Check-Ins (wenig bis viel)",
        "Veranstaltungsort Namen (absteigend)",
        "Veranstaltungsort Namen (aufsteigend)",
        "Datum (alt bis neu)",
        "Letzte Check-Ins",
        "Datum (neu bis alt)",
        "Clear All Sorting & Filters",
        "Maurice",
        "MauriceDE",
        "Aachen",
        "Total",
        "Unique",
        "Badges",
        "Friends",
        "See All Badges",
        "Top Beers",
        "See All Beers",
        "Untappd for Business",
        "Untappd for Business Blog",
        "Breweries",
        "Shop",
        "Support",
        "Careers",
        "API",
        "Terms",
        "Privacy",
        "Cookie Policy",
        "Do Not Sell My Personal Information",
        "Icon twitter Icon facebook Icon instagram",
    }
)


def _is_noise(line: str) -> bool:
    return (
        line in NOISE_LINES
        or "avatar" in line
        or line.startswith("Recappd")
        or "badge logo" in line
    )


def parse_venue_lines(lines: list[str]) -> list[dict[str, Any]]:
    """Parse filtered venue lines into ``{name, type, address, checkins}`` blocks."""
    venues: list[dict[str, Any]] = []
    block: list[str] = []
    for line in lines:
        block.append(line)
        if not line.startswith("Check-ins:"):
            continue
        try:
            checkins = int(line.replace("Check-ins:", "").strip())
        except ValueError:
            checkins = 1

        address = ""
        for candidate in block[2:]:
            if candidate.startswith(("First Visit:", "Last Visit:", "Check-ins:")):
                continue
            address = candidate
            break

        venues.append(
            {
                "name": block[0].replace(" Verified", "").strip(),
                "type": block[1] if len(block) > 1 else "",
                "address": address,
                "checkins": checkins,
            }
        )
        block = []
    return venues


class UntappdLocations:
    """Geocodes venue addresses and updates the heatmap sections of ``stats.json``."""

    def __init__(self, settings: Settings | None = None, cache_file: Path | None = None) -> None:
        self.settings = settings or get_settings()
        self.cache_file = cache_file or Path("untappd/data/location_cache.json")
        self.cache: dict[str, dict[str, Any]] = self.load_cache()

    def load_cache(self) -> dict[str, dict[str, Any]]:
        """Load the geocoding cache from disk (empty when absent/corrupt)."""
        if self.cache_file.exists():
            try:
                return cast(
                    "dict[str, dict[str, Any]]",
                    json.loads(self.cache_file.read_text(encoding="utf-8")),
                )
            except (OSError, json.JSONDecodeError):
                return {}
        return {}

    def save_cache(self) -> None:
        """Persist the geocoding cache to disk."""
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self.cache_file.write_text(
            json.dumps(self.cache, indent=4, ensure_ascii=False), encoding="utf-8"
        )

    def geocode(self, address: str) -> dict[str, Any] | None:
        """Geocode ``address`` via Nominatim, respecting its rate limit."""
        if address in {"NC", "Deutschland", "España", "Unknown"}:
            return None
        time.sleep(_RATE_LIMIT_SECONDS)
        url = (
            f"{_NOMINATIM_URL}?q={urllib.parse.quote(address)}&format=json&addressdetails=1&limit=1"
        )
        request = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                data = json.loads(response.read().decode())
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("Error geocoding %s: %s", address, exc)
            return None

        if not data:
            return None
        result = data[0]
        address_details = result.get("address", {})
        city = address_details.get(
            "city",
            address_details.get(
                "town", address_details.get("village", address_details.get("state", "Unknown"))
            ),
        )
        return {
            "lat": float(result["lat"]),
            "lon": float(result["lon"]),
            "city": city,
            "country": address_details.get("country", "Unknown"),
        }

    def _resolve_geo(self, name: str, address: str) -> dict[str, Any]:
        cache_key = f"{name}::{address}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        logger.info("Geocoding: %s -> %s", name, address)
        geo = self.geocode(address)
        if not geo and "," in address:
            geo = self.geocode(address.split(",")[-1].strip())
        if not geo:
            city = address.split(",")[0] if address else "Unknown"
            geo = {"lat": None, "lon": None, "city": city, "country": "Unknown"}
        self.cache[cache_key] = geo
        return geo

    def run(self, input_file: Path | None = None) -> None:
        """Parse ``input_file`` and update the heatmap in ``stats.json``."""
        source = input_file or Path("untappd/data/untapped_locations.txt")
        if not source.exists():
            logger.error("File not found: %s", source)
            return

        raw_lines = [
            line.strip()
            for line in source.read_text(encoding="utf-8", errors="replace").split("\n")
            if line.strip()
        ]
        venues = parse_venue_lines([line for line in raw_lines if not _is_noise(line)])
        if not venues:
            logger.warning("No venues found in %s", source)
            return
        venues.sort(key=lambda venue: venue["checkins"], reverse=True)
        logger.info("Found %d venues.", len(venues))

        heatmap: list[dict[str, Any]] = []
        country_map: dict[str, int] = defaultdict(int)
        for venue in venues:
            name = venue["name"]
            address = venue["address"]
            if "Untappd at Home" in name or "Zuhause" in name:
                address = "Lothringerstraße 59, Aachen"
            if not address or address == "NC":
                address = "Aachen, Nordrhein-Westfalen"

            geo = self._resolve_geo(name, address)
            item = {
                "venue": name,
                "city": geo.get("city", "Unknown"),
                "country": geo.get("country", "Unknown"),
                "visits": venue["checkins"],
                "lat": geo.get("lat"),
                "lon": geo.get("lon"),
            }
            heatmap.append(item)
            country_map[normalize_country(item["country"])] += venue["checkins"]

        self.save_cache()

        valid_venues = [entry for entry in heatmap if entry["lat"] is not None]
        countries: list[dict[str, Any]] = [
            {"country": country, "count": count} for country, count in country_map.items()
        ]
        countries.sort(key=lambda item: item["count"], reverse=True)

        stats_path = self.settings.untappd_stats_file
        if not stats_path.exists():
            logger.warning("stats.json not found at %s", stats_path)
            return

        stats = json.loads(stats_path.read_text(encoding="utf-8"))
        stats["heatmap"] = heatmap
        stats["top_venues"] = valid_venues[:_TOP_VENUES]
        stats["checkin_countries"] = countries
        tmp_path = stats_path.with_suffix(stats_path.suffix + ".tmp")
        tmp_path.write_text(json.dumps(stats, indent=4, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp_path, stats_path)
        logger.info("stats.json updated with %d heatmap locations.", len(heatmap))


def main(settings: Settings | None = None) -> None:
    """Entrypoint for the ``mauricefun-untappd-locations`` console script."""
    configure_logging()
    input_file = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    UntappdLocations(settings).run(input_file)


if __name__ == "__main__":  # pragma: no cover
    main()
