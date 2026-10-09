"""Content-based beer recommendation pipeline.

Produces ``ml_data.json`` (rating distribution, top/lowest rated beers and a daily
recommendation) from the aggregated ``stats.json``.

Run as a script::

    python -m mauricefun.untappd.recommender
"""

from __future__ import annotations

import json
import logging
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Any

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = ["GLOBAL_BEERS", "main", "run_ml_pipeline"]

#: Curated world-class beers used as recommendation candidates.
GLOBAL_BEERS: list[dict[str, str]] = [
    {
        "name": "Westvleteren 12 (XII)",
        "brewery": "Brouwerij De Sint-Sixtusabdij",
        "style": "Quadrupel",
        "desc": "Eines der am besten bewerteten Biere der Welt. Extrem seltenes Trappistenbier.",
    },
    {
        "name": "Pliny the Elder",
        "brewery": "Russian River Brewing",
        "style": "DIPA",
        "desc": "Absolut legendäres Double IPA aus Kalifornien mit perfekten Hopfennoten.",
    },
    {
        "name": "Weihenstephaner Hefeweissbier",
        "brewery": "Bayerische Staatsbrauerei",
        "style": "Wheat Beer",
        "desc": "Der Klassiker unter den Weißbieren, oft als weltbeste Referenz genannt.",
    },
    {
        "name": "Rochefort 10",
        "brewery": "Abbaye Notre-Dame de Saint-Rémy",
        "style": "Quadrupel",
        "desc": "Dunkel, fruchtig, komplex und stark – ein Trappisten-Meisterwerk.",
    },
    {
        "name": "Orval",
        "brewery": "Brasserie d'Orval",
        "style": "Pale Ale",
        "desc": "Einzigartiges Trappistenbier, das mit Brettanomyces vergoren wird.",
    },
    {
        "name": "Tripel Karmeliet",
        "brewery": "Brouwerij Bosteels",
        "style": "Tripel",
        "desc": "Eines der populärsten belgischen Tripel, gebraut mit Hafer, Gerste und Weizen.",
    },
    {
        "name": "Fou' Foune",
        "brewery": "Brasserie Cantillon",
        "style": "Sour/Wild",
        "desc": "Fantastisches traditionelles Lambic, das mit frischen Aprikosen gereift wird.",
    },
    {
        "name": "Julius",
        "brewery": "Tree House Brewing Company",
        "style": "NEIPA/Hazy IPA",
        "desc": "Das IPA, das den Hazy-Trend weltweit startete. Tropische Saftigkeit pur.",
    },
    {
        "name": "St. Bernardus Abt 12",
        "brewery": "St. Bernardus",
        "style": "Quadrupel",
        "desc": "Leichter verfügbare Alternative zum Westvleteren 12 – oft gleich gut bewertet.",
    },
    {
        "name": "Aventinus",
        "brewery": "Brauerei Schneider Weisse",
        "style": "Bock/Märzen",
        "desc": "Kraftvoller, dunkler Weizenbock mit intensiven Bananen- und Nelkenaromen.",
    },
]

_TOP_N = 10
_RATING_KEYS = [f"{value / 4:.2f}" for value in range(1, 21)]


def _rating_distribution(
    rated_beers: list[dict[str, Any]], total_checkins: int
) -> tuple[dict[str, int], float, str]:
    """Return ``(distribution, average, source)`` from real or simulated ratings."""
    if rated_beers:
        all_ratings = [beer["avg_rating"] for beer in rated_beers]
        average = round(sum(all_ratings) / len(all_ratings), 2)
        distribution = dict.fromkeys(_RATING_KEYS, 0)
        for rating in all_ratings:
            key = f"{rating:.2f}"
            if key in distribution:
                distribution[key] += 1
        logger.info("Using real ratings: %d beers, avg %.2f", len(rated_beers), average)
        return distribution, average, "real"

    distribution = dict.fromkeys(_RATING_KEYS, 0)
    state = random.getstate()
    random.seed(42)
    total = 0.0
    for _ in range(total_checkins):
        value = max(0.25, min(5.0, random.gauss(3.8, 0.55)))
        rounded = round(value * 4) / 4
        distribution[f"{rounded:.2f}"] += 1
        total += rounded
    random.setstate(state)
    average = round(total / total_checkins, 2) if total_checkins else 0.0
    logger.warning("No real ratings found; using a simulated distribution.")
    return distribution, average, "simulated"


def _format_ranked(beers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "beer": beer["beer"],
            "brewery": beer["brewery"],
            "style": beer["style"],
            "rating": beer["avg_rating"],
            "count": beer.get("rated_count", 1),
        }
        for beer in beers[:_TOP_N]
    ]


def run_ml_pipeline(settings: Settings | None = None) -> dict[str, Any] | None:
    """Build ``ml_data.json`` from ``stats.json`` and return the produced payload."""
    settings = settings or get_settings()
    stats_file = settings.untappd_stats_file
    ml_out_file = stats_file.with_name("ml_data.json")

    if not stats_file.exists():
        logger.error("stats.json not found at %s", stats_file)
        return None

    try:
        stats = json.loads(stats_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.error("Could not read stats.json: %s", exc)
        return None

    total_checkins = stats.get("overview", {}).get("total_checkins", 0)
    rated_beers = stats.get("rated_beers", [])
    distribution, average, source = _rating_distribution(rated_beers, total_checkins)

    if rated_beers:
        sorted_desc = sorted(
            rated_beers,
            key=lambda beer: (beer["avg_rating"], beer.get("rated_count", 1)),
            reverse=True,
        )
        sorted_asc = sorted(
            rated_beers, key=lambda beer: (beer["avg_rating"], -beer.get("rated_count", 1))
        )
        top_rated = _format_ranked(sorted_desc)
        lowest_rated = _format_ranked(sorted_asc)
    else:
        top_rated, lowest_rated = [], []

    random.seed(datetime.now().strftime("%Y-%m-%d"))
    top_styles = [style["style"] for style in stats.get("styles", [])[:5]]
    drunk_beers = {beer["beer"] for beer in stats.get("top_beers", [])}

    scored = []
    for candidate in GLOBAL_BEERS:
        if candidate["name"] not in drunk_beers:
            score = 10.0 if candidate["style"] in top_styles else 0.0
            score += random.uniform(0, 5)
            scored.append((score, candidate))
    scored.sort(key=lambda item: item[0], reverse=True)
    best_match = scored[0][1] if scored else GLOBAL_BEERS[0]

    ml_data = {
        "ratings": {"average": average, "distribution": distribution, "source": source},
        "recommendation": {
            "beer": best_match["name"],
            "brewery": best_match["brewery"],
            "style": best_match["style"],
            "description": best_match["desc"],
            "match_reason": f"KI Match: Empfohlen aufgrund deiner hohen Check-in-Rate für {best_match['style']}.",
        },
        "top_rated": top_rated,
        "lowest_rated": lowest_rated,
        "ratings_source": source,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    tmp_path = Path(str(ml_out_file) + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(ml_data, handle, indent=4, ensure_ascii=False)
    os.replace(tmp_path, ml_out_file)
    logger.info("ML pipeline complete: %s", ml_out_file)
    return ml_data


def main() -> None:
    """Entrypoint for the ``mauricefun-untappd-ml`` console script."""
    configure_logging()
    run_ml_pipeline()


if __name__ == "__main__":  # pragma: no cover
    main()
