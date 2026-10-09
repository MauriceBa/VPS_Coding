"""Tests for Untappd helpers, locations, scraper and recommender."""

from __future__ import annotations

import json

from mauricefun.untappd.countries import normalize_country
from mauricefun.untappd.locations import parse_venue_lines
from mauricefun.untappd.recommender import run_ml_pipeline
from mauricefun.untappd.scraper import extract_brewery


def test_normalize_country() -> None:
    assert normalize_country("Germany") == "Deutschland"
    assert normalize_country("The Netherlands") == "Niederlande"
    assert normalize_country("Belgium") == "Belgien"
    assert normalize_country("Narnia") == "Narnia"


def test_parse_venue_lines() -> None:
    lines = ["Venue A", "Bar", "Street 1", "Check-ins: 5", "Venue B", "Bar", "Check-ins: 2"]

    venues = parse_venue_lines(lines)

    assert venues[0] == {"name": "Venue A", "type": "Bar", "address": "Street 1", "checkins": 5}
    assert venues[1]["address"] == ""
    assert venues[1]["checkins"] == 2


def test_extract_brewery() -> None:
    assert extract_brewery("drinking a Beer by Brew Co at Venue", "Beer") == "Brew Co"
    assert extract_brewery("drinking a Beer by Brew Co", "Beer") == "Brew Co"
    assert extract_brewery("no brewery mentioned", "Beer") == "Unknown"


def _write_stats(settings, stats: dict) -> None:
    settings.untappd_stats_file.parent.mkdir(parents=True, exist_ok=True)
    settings.untappd_stats_file.write_text(json.dumps(stats), encoding="utf-8")


def test_run_ml_pipeline_with_real_ratings(settings) -> None:
    _write_stats(
        settings,
        {
            "overview": {"total_checkins": 2},
            "rated_beers": [
                {
                    "beer": "A",
                    "brewery": "Brew",
                    "style": "IPA",
                    "avg_rating": 4.0,
                    "rated_count": 1,
                },
                {
                    "beer": "B",
                    "brewery": "Brew",
                    "style": "IPA",
                    "avg_rating": 3.0,
                    "rated_count": 1,
                },
            ],
            "styles": [{"style": "IPA"}],
            "top_beers": [],
        },
    )

    result = run_ml_pipeline(settings)

    assert result is not None
    assert result["ratings"]["source"] == "real"
    assert result["top_rated"][0]["beer"] == "A"
    assert (settings.untappd_stats_file.parent / "ml_data.json").exists()


def test_run_ml_pipeline_simulated_when_no_ratings(settings) -> None:
    _write_stats(
        settings,
        {"overview": {"total_checkins": 5}, "rated_beers": [], "styles": [], "top_beers": []},
    )

    result = run_ml_pipeline(settings)

    assert result is not None
    assert result["ratings"]["source"] == "simulated"
    assert result["top_rated"] == []


def test_run_ml_pipeline_missing_stats(settings) -> None:
    assert run_ml_pipeline(settings) is None
