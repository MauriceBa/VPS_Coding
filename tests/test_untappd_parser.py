"""Tests for the Untappd export parser."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from mauricefun.untappd.parser import (
    build_rated_beers,
    guess_brewery_country,
    infer_style,
    parse_date,
    parse_export,
)

REF = datetime(2026, 3, 15)


def test_parse_date_relative() -> None:
    assert parse_date("2 days ago", REF) == "2026-03-13"
    assert parse_date("a day ago", REF) == "2026-03-14"
    assert parse_date("5 hours ago", REF) == "2026-03-15"
    assert parse_date("", REF) is None


def test_parse_date_absolute() -> None:
    assert parse_date("15 Mar 24", REF) == "2024-03-15"


def test_infer_style() -> None:
    assert infer_style("New England Hazy IPA") == "NEIPA/Hazy IPA"
    assert infer_style("Oatmeal Stout") == "Stout/Porter"
    assert infer_style("Wiener Lager") == "Lager/Pils"
    assert infer_style("Mystery Drink") == "Other"


def test_guess_brewery_country() -> None:
    assert guess_brewery_country("Krombacher Brauerei") == "Deutschland"
    assert guess_brewery_country("Brouwerij Jopen") == "Niederlande"
    assert guess_brewery_country("Guinness") == "Irland"
    assert guess_brewery_country("Unknown Co") == "Unknown"


def test_parse_export_new_format(tmp_path: Path) -> None:
    export = tmp_path / "export.txt"
    export.write_text(
        "Test IPA label\n"
        "Some line 0\n"
        "Test Brewery\n"
        "Some line 2\n"
        "Your Rating (4.25)\n"
        "Total: 3\n"
        "Recent: 03/15/24\n",
        encoding="utf-8",
    )

    checkins = parse_export(export)

    assert len(checkins) == 3
    assert checkins[0]["beer_name"] == "Test IPA"
    assert checkins[0]["brewery"] == "Test Brewery"
    assert checkins[0]["rating"] == 4.25
    assert checkins[0]["date"] == "2024-03-15"
    assert checkins[0]["style"] == "IPA"


def test_parse_export_legacy_format(tmp_path: Path) -> None:
    export = tmp_path / "legacy.txt"
    export.write_text(
        "Maurice is drinking a Test Lager by Test Brauerei\n"
        "Flasche\n"
        "Rating: 3.75\n"
        "View Detailed Check-in Delete Check-In 2 days ago\n",
        encoding="utf-8",
    )

    checkins = parse_export(export)

    assert len(checkins) == 1
    assert checkins[0]["beer_name"] == "Test Lager"
    assert checkins[0]["brewery"] == "Test Brauerei"
    assert checkins[0]["serving_type"] == "Flasche"
    assert checkins[0]["rating"] == 3.75


def test_build_rated_beers_with_real_ratings() -> None:
    checkins = [
        {"beer_name": "A", "brewery": "Brew", "style": "IPA", "rating": 4.0, "abv": 6.5},
        {"beer_name": "A", "brewery": "Brew", "style": "IPA", "rating": 5.0, "abv": 6.5},
        {"beer_name": "B", "brewery": "Brew", "style": "Stout/Porter", "rating": 3.0, "abv": 12.5},
    ]

    result = build_rated_beers(checkins)

    assert result.used_fallback_ratings is False
    assert result.rated_beers[0]["beer"] == "A"
    assert result.rated_beers[0]["avg_rating"] == 4.5
    assert result.rated_beers[0]["rated_count"] == 2
    assert result.top_breweries == [{"brewery": "Brew", "count": 3}]
    assert result.abv_distribution[-1] == {"label": "12+%", "count": 1}


def test_build_rated_beers_fallback_is_deterministic() -> None:
    checkins = [{"beer_name": "A", "brewery": "Brew", "style": "IPA", "rating": None, "abv": None}]

    first = build_rated_beers([dict(checkins[0])])
    second = build_rated_beers([dict(checkins[0])])

    assert first.used_fallback_ratings is True
    assert first.rated_beers[0]["avg_rating"] == second.rated_beers[0]["avg_rating"]
