"""Parse a raw Untappd profile export into the aggregated ``stats.json`` shape.

Run as a script::

    python -m mauricefun.untappd.parser [untappd_export.txt]
"""

from __future__ import annotations

import json
import logging
import os
import random
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = [
    "BuildResult",
    "build_rated_beers",
    "guess_brewery_country",
    "infer_style",
    "parse_date",
    "parse_export",
]

MONTH_MAP = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "Jun": 6,
    "Jul": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12,
}

_RATING_RE = re.compile(r"(?:Rating:)?\s*([0-5][\.,](?:0|25|5|75|\d{1,2}))\b", re.IGNORECASE)
_ABV_RE = re.compile(r"([0-9.]+)\s*%\s*ABV", re.IGNORECASE)

_STYLE_PATTERNS: tuple[tuple[str, str], ...] = (
    (r"0[,.]0|Alkoholfrei|Alcohol Free|Non-Alcoholic", "Non-Alcoholic"),
    (r"Radler|Fassbrause|Shandy", "Radler/Malt"),
    (r"Cider", "Cider"),
    (r"TIPA|Triple.*IPA|Quadruple.*IPA", "TIPA/QIPA"),
    (r"DIPA|Double.*IPA|Imperial.*IPA|DDH DIPA", "DIPA"),
    (r"NEIPA|New England|Hazy", "NEIPA/Hazy IPA"),
    (r"I\.?P\.?A\.?|India Pale Ale", "IPA"),
    (r"Stout|Porter", "Stout/Porter"),
    (r"Weizen|Weisse|Weißbier|Wit\b|Wheat|Hefe", "Wheat Beer"),
    (r"Gose|Berliner|Sour\b|Lambic|Kriek", "Sour/Wild"),
    (r"Tripel|Triple", "Tripel"),
    (r"Quad|Quadrupel", "Quadrupel"),
    (r"Dubbel|Brune|Dunkel|Schwarz|Noir\b", "Dark/Dubbel"),
    (r"Kölsch|Kolsch", "Kölsch"),
    (r"Alt\b|Altbier", "Altbier"),
    (r"Bock\b|Märzen|Oktoberfest", "Bock/Märzen"),
    (r"Lager|Pils|Pilsner|Hell\b|Helles|Export", "Lager/Pils"),
    (r"Pale Ale|\bPA\b", "Pale Ale"),
    (r"Blonde|Blond\b|Blanche|Golden", "Blonde/Golden"),
    (r"Amber|Ambrée|Red\b|Rouge\b", "Amber/Red"),
)

_COUNTRY_KEYWORDS: tuple[tuple[tuple[str, ...], str], ...] = (
    (
        (
            "brauerei",
            "bräu",
            "krombacher",
            "paulaner",
            "bitburger",
            "diebels",
            "schlenkerla",
            "radeberger",
            "veltins",
            "meckatzer",
            "schanzenbräu",
            "eremita",
            "störtebeker",
            "insel-brauerei",
            "hopfen+malz",
            "yankee & kraut",
            "totenhopfen",
            "blech.brut",
            "atelier vrai",
            "gmbh",
            "karlsberg",
            "riegele",
            "kundmüller",
            "bayreuther",
            "simon",
            "lammsbräu",
            "hohenthanner",
        ),
        "Deutschland",
    ),
    (
        (
            "brouwerij",
            "vrouwen",
            "swinkels",
            "uiltje",
            "frontaal",
            "vande",
            "jopen",
            "kees",
            "stadshaven",
            "moersleutel",
            "hoop",
            "t ij",
            "lindeboom",
            "two chefs",
            "heineken",
            "bavaria",
        ),
        "Niederlande",
    ),
    (
        (
            "mont blanc",
            "licorne",
            "galibier",
            "pélican",
            "champigneulles",
            "sainte cru",
            "sapaudia",
            "gallia",
            "popihn",
            "fauve",
            "gwape",
            "la cahute",
            "brasserie du",
        ),
        "Frankreich",
    ),
    (
        (
            "brasserie",
            "stella",
            "leroy",
            "delirium",
            "rochehaut",
            "bertinchamps",
            "haacht",
            "dubbel",
            "dupont",
            "palm",
            "achouffe",
            "caulier",
            "rodenbach",
            "alken-maes",
            "belgium",
            "huyghe",
            "grain d'orge",
        ),
        "Belgien",
    ),
    (("brewdog", "northern monk", "vocation", "hawkes", "lhg", "beak", "beavertown"), "UK"),
    (("sierra nevada", "other half", "rogue", "two brothers", "mackinac"), "USA"),
)
_COUNTRY_EXACT: tuple[tuple[str, str], ...] = (
    ("pivovar", "Tschechien"),
    ("staropramen", "Tschechien"),
    ("kozel", "Tschechien"),
    ("guinness", "Irland"),
    ("rye river", "Irland"),
    ("lervig", "Norwegen"),
    ("põhjala", "Estland"),
    ("ārpus", "Lettland"),
    ("bevog", "Österreich"),
    ("stiegl", "Österreich"),
    ("ottakringer", "Österreich"),
    ("maryensztadt", "Polen"),
    ("browar", "Polen"),
    ("mikkeller", "Dänemark"),
    ("carlsberg", "Dänemark"),
    ("garage", "Spanien"),
)


@dataclass
class BuildResult:
    """Aggregated statistics produced by :func:`build_rated_beers`."""

    rated_beers: list[dict[str, Any]]
    used_fallback_ratings: bool
    top_breweries: list[dict[str, Any]]
    styles: list[dict[str, Any]]
    abv_distribution: list[dict[str, Any]]
    brewery_countries: list[dict[str, Any]] = field(default_factory=list)


def parse_date(value: str, ref_date: datetime | None = None) -> str | None:
    """Parse a relative or short Untappd date string into ``YYYY-MM-DD``."""
    ref = ref_date or datetime.today()
    text = value.strip()
    if not text:
        return None
    if "hours ago" in text or "mins ago" in text or "just now" in text.lower():
        return ref.strftime("%Y-%m-%d")
    match = re.match(r"(\d+) days? ago", text)
    if match:
        return (ref - timedelta(days=int(match.group(1)))).strftime("%Y-%m-%d")
    if "a day ago" in text:
        return (ref - timedelta(days=1)).strftime("%Y-%m-%d")
    match = re.match(r"(\d{1,2}) ([A-Za-z]{3}) (\d{2})$", text)
    if match:
        day, mon, year = int(match.group(1)), match.group(2).capitalize(), int(match.group(3))
        month = MONTH_MAP.get(mon)
        if month:
            return f"{2000 + year}-{month:02d}-{day:02d}"
    return None


def infer_style(name: str, badges: list[str] | None = None) -> str:
    """Infer a beer style from its name using ordered regex patterns."""
    del badges  # reserved for future badge-based hints
    for pattern, style in _STYLE_PATTERNS:
        if re.search(pattern, name, re.IGNORECASE):
            return style
    return "Other"


def guess_brewery_country(brewery: str) -> str:
    """Best-effort country guess for a brewery name."""
    lowered = brewery.lower()
    for keywords, country in _COUNTRY_KEYWORDS:
        if any(keyword in lowered for keyword in keywords):
            return country
    for keyword, country in _COUNTRY_EXACT:
        if keyword in lowered:
            return country
    return "Unknown"


def _empty_checkin(beer_name: str, brewery: str = "", venue: str | None = None) -> dict[str, Any]:
    return {
        "beer_name": beer_name,
        "brewery": brewery,
        "venue": venue,
        "serving_type": None,
        "date": None,
        "rating": None,
        "abv": None,
        "badges": [],
        "tagged_friends": [],
    }


def parse_export(filepath: str | Path) -> list[dict[str, Any]]:
    """Parse a raw Untappd export file into a list of check-in dicts."""
    path = Path(filepath)
    if not path.exists():
        logger.error("File not found: %s", path)
        return []

    lines = (
        path.read_text(encoding="utf-8", errors="replace")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .split("\n")
    )
    is_new_format = any(line.strip().endswith(" label") for line in lines[:200])
    checkins = _parse_new_format(lines) if is_new_format else _parse_legacy_format(lines)
    for checkin in checkins:
        checkin["style"] = infer_style(checkin["beer_name"], checkin["badges"])
    return checkins


def _parse_new_format(lines: list[str]) -> list[dict[str, Any]]:
    checkins: list[dict[str, Any]] = []
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        if not line.endswith(" label"):
            index += 1
            continue

        beer_name = line[:-6].strip()
        current = _empty_checkin(beer_name)
        non_empty: list[str] = []
        cursor = index + 1
        while cursor < len(lines) and not lines[cursor].strip().endswith(" label"):
            stripped = lines[cursor].strip()
            if stripped:
                non_empty.append(stripped)
            cursor += 1

        if len(non_empty) >= 4:
            current["brewery"] = non_empty[1]
            for entry in non_empty[3:]:
                rating_match = re.search(
                    r"You?(?:r)?\s+Rating\s*\(([0-9.]+)\)", entry, re.IGNORECASE
                )
                if rating_match:
                    current["rating"] = float(rating_match.group(1))
                abv_match = _ABV_RE.search(entry)
                if abv_match:
                    current["abv"] = float(abv_match.group(1))

            total_count = 1
            for entry in reversed(non_empty):
                total_match = re.search(r"Total:\s*(\d+)", entry)
                if total_match:
                    total_count = int(total_match.group(1))
                date_match = re.search(r"Recent:\s*(\d{2})/(\d{2})/(\d{2})", entry)
                if date_match:
                    month, day, year = date_match.groups()
                    current["date"] = f"20{year}-{month}-{day}"
            checkins.extend(current.copy() for _ in range(total_count))
        index = cursor
    return checkins


def _parse_legacy_format(lines: list[str]) -> list[dict[str, Any]]:
    checkins: list[dict[str, Any]] = []
    current: dict[str, Any] = {}
    tagged = False

    for raw in lines:
        line = raw.strip()
        match = re.match(r"Maurice is drinking an? (.+?) by (.+?)(?:\s+at (.+?))?$", line)
        if match:
            if current.get("beer_name"):
                checkins.append(current)
            current = _empty_checkin(
                match.group(1).strip(),
                match.group(2).strip(),
                match.group(3).strip() if match.group(3) else None,
            )
            tagged = False
            continue

        if not current:
            continue

        if (
            line in ("Gezapft", "Flasche", "Dose", "Probierglas")
            and current["serving_type"] is None
        ):
            current["serving_type"] = line
        elif line.startswith("Purchased at ") and current["venue"] is None:
            current["venue"] = line.replace("Purchased at ", "").strip()
        elif line == "Tagged Friends":
            tagged = True
        elif tagged and line.endswith("avatar"):
            friend = line.replace("avatar", "").strip()
            if friend:
                current["tagged_friends"].append(friend)
        elif line in ("Comment", "Toast", "Check-in Photo"):
            tagged = False
        elif "Earned the" in line:
            badge_match = re.search(r"Earned the (.+?) badge!", line)
            if badge_match:
                current["badges"].append(badge_match.group(1))

        if current["rating"] is None:
            rating_match = _RATING_RE.search(line)
            if rating_match:
                try:
                    value = float(rating_match.group(1).replace(",", "."))
                    if 0.25 <= value <= 5.0:
                        current["rating"] = value
                except ValueError:
                    pass
            elif line in ("1", "2", "3", "4", "5"):
                current["rating"] = float(line)

        if current["abv"] is None:
            abv_match = _ABV_RE.search(line)
            if abv_match:
                current["abv"] = float(abv_match.group(1))

        if "View Detailed Check-in Delete Check-In" in line:
            date_source = line.replace("View Detailed Check-in Delete Check-In", "").strip()
            current["date"] = parse_date(date_source)
            checkins.append(current)
            current = {}
            tagged = False

    if current.get("beer_name"):
        checkins.append(current)
    return checkins


def build_rated_beers(checkins: list[dict[str, Any]]) -> BuildResult:
    """Aggregate parsed check-ins into rated beers, breweries, styles and ABV data."""
    beer_data: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"brewery": "", "style": "", "ratings": []}
    )
    brewery_counts: dict[str, int] = defaultdict(int)
    style_counts: dict[str, dict[str, Any]] = defaultdict(lambda: {"count": 0, "unique": set()})
    abv_dist: dict[str, int] = defaultdict(int)
    brewery_countries: dict[str, int] = defaultdict(int)

    found_any_ratings = any(checkin.get("rating") is not None for checkin in checkins)

    for checkin in checkins:
        beer_name = checkin["beer_name"]
        brewery = checkin["brewery"]
        style = checkin["style"]

        style_counts[style]["count"] += 1
        style_counts[style]["unique"].add(beer_name)
        brewery_counts[brewery] += 1
        brewery_countries[guess_brewery_country(brewery)] += 1

        if checkin.get("abv") is not None:
            abv_val = checkin["abv"]
            if abv_val >= 12:
                abv_dist["12+%"] += 1
            else:
                step = int(abv_val)
                abv_dist[f"{step}-{step + 1}%"] += 1

        if not found_any_ratings:
            random.seed(beer_name)
            base = max(0.25, min(5.0, random.uniform(2.5, 4.8)))
            checkin["rating"] = round(base * 4) / 4

        if checkin.get("rating") is not None:
            beer_data[beer_name]["brewery"] = brewery
            beer_data[beer_name]["style"] = style
            beer_data[beer_name]["ratings"].append(checkin["rating"])

    random.seed()

    rated_beers: list[dict[str, Any]] = []
    for beer_name, data in beer_data.items():
        ratings = data["ratings"]
        average = round(sum(ratings) / len(ratings) * 4) / 4
        rated_beers.append(
            {
                "beer": beer_name,
                "brewery": data["brewery"],
                "style": data["style"],
                "avg_rating": average,
                "rated_count": len(ratings),
            }
        )
    rated_beers.sort(key=lambda item: (item["avg_rating"], item["rated_count"]), reverse=True)

    top_breweries: list[dict[str, Any]] = [
        {"brewery": brewery, "count": count} for brewery, count in brewery_counts.items()
    ]
    top_breweries.sort(key=lambda item: item["count"], reverse=True)

    styles_list: list[dict[str, Any]] = [
        {"style": style, "checkins": data["count"], "unique_beers": len(data["unique"])}
        for style, data in style_counts.items()
    ]
    styles_list.sort(key=lambda item: item["checkins"], reverse=True)

    abv_keys = [f"{i}-{i + 1}%" for i in range(12)] + ["12+%"]
    abv_chart: list[dict[str, Any]] = [
        {"label": key, "count": abv_dist.get(key, 0)} for key in abv_keys
    ]

    countries_list: list[dict[str, Any]] = [
        {"country": country, "count": count}
        for country, count in brewery_countries.items()
        if count > 0
    ]
    countries_list.sort(key=lambda item: item["count"], reverse=True)

    return BuildResult(
        rated_beers=rated_beers,
        used_fallback_ratings=not found_any_ratings,
        top_breweries=top_breweries,
        styles=styles_list,
        abv_distribution=abv_chart,
        brewery_countries=countries_list,
    )


def _update_stats_file(
    stats_path: Path, checkins: list[dict[str, Any]], result: BuildResult
) -> None:
    with open(stats_path, encoding="utf-8") as handle:
        stats = json.load(handle)

    stats["rated_beers"] = result.rated_beers
    stats["top_breweries"] = result.top_breweries
    stats["styles"] = result.styles
    stats["abv_distribution"] = result.abv_distribution
    stats["brewery_countries"] = result.brewery_countries

    if checkins:
        dates = [checkin["date"] for checkin in checkins if checkin.get("date")]
        if dates:
            overview = stats.setdefault("overview", {})
            overview["date_from"] = min(dates)
            overview["date_to"] = max(dates)
            overview["unique_beers"] = len({checkin["beer_name"] for checkin in checkins})
            overview["total_checkins"] = len(checkins)
            overview["unique_breweries"] = len({checkin["brewery"] for checkin in checkins})

    tmp_path = stats_path.with_suffix(stats_path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(stats, handle, indent=4, ensure_ascii=False)
    os.replace(tmp_path, stats_path)


def main(settings: Settings | None = None) -> None:
    """Entrypoint for the ``mauricefun-untappd-parse`` console script."""
    configure_logging()
    settings = settings or get_settings()

    input_file = (
        Path(sys.argv[1]) if len(sys.argv) > 1 else Path("untappd/data/untapped_maurice.txt")
    )
    logger.info("Parsing %s...", input_file)
    checkins = parse_export(input_file)
    if not checkins:
        logger.warning("No check-ins found or file empty.")
        return

    result = build_rated_beers(checkins)
    if result.used_fallback_ratings:
        logger.warning("No real ratings found; generated deterministic placeholder ratings.")
    else:
        total_rated = sum(1 for checkin in checkins if checkin.get("rating") is not None)
        logger.info("Parsed %d check-ins (%d rated).", len(checkins), total_rated)

    if settings.untappd_stats_file.exists():
        _update_stats_file(settings.untappd_stats_file, checkins, result)
        logger.info("stats.json updated: %s", settings.untappd_stats_file)
    else:
        logger.warning("stats.json not found at %s", settings.untappd_stats_file)


if __name__ == "__main__":  # pragma: no cover
    main()
