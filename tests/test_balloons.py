"""Tests for balloon geo, detection, statistics and storage helpers."""

from __future__ import annotations

from datetime import date
from typing import Any

from mauricefun.balloons.detector import is_balloon
from mauricefun.balloons.geo import compass_direction, distance_km, get_distance_and_direction
from mauricefun.balloons.stats import aggregate_distance_counts, day_keys
from mauricefun.balloons.storage import load_json, save_json


class _Flight:
    def __init__(self, **kwargs: Any) -> None:
        self.__dict__.update(kwargs)


def test_distance_same_point_is_zero() -> None:
    assert distance_km(50.0, 6.0, 50.0, 6.0) == 0.0


def test_distance_one_degree_latitude() -> None:
    assert 110 < distance_km(0.0, 0.0, 1.0, 0.0) < 112


def test_compass_direction() -> None:
    assert compass_direction(0) == "N"
    assert compass_direction(45) == "NO"
    assert compass_direction(90) == "O"
    assert compass_direction(180) == "S"
    assert compass_direction(270) == "W"
    assert compass_direction(359) == "N"


def test_get_distance_and_direction_returns_tuple() -> None:
    distance, direction = get_distance_and_direction(50.0, 6.0, 51.0, 6.0)

    assert distance > 100
    assert direction == "N"


def test_is_balloon_by_aircraft_code() -> None:
    assert is_balloon(
        _Flight(ground_speed=20, aircraft_code="BALL", registration=None, callsign=None)
    )


def test_is_balloon_rejected_when_fast() -> None:
    assert not is_balloon(
        _Flight(ground_speed=120, aircraft_code="BALL", registration=None, callsign=None)
    )


def test_is_balloon_by_registration_prefix() -> None:
    assert is_balloon(
        _Flight(ground_speed=10, aircraft_code="B738", registration="HB-QAB", callsign=None)
    )


def test_is_balloon_false_for_airliner() -> None:
    assert not is_balloon(
        _Flight(ground_speed=400, aircraft_code="B738", registration="D-AIX", callsign="DLH1")
    )


def test_day_keys() -> None:
    keys = day_keys(date(2026, 3, 15), 7)

    assert len(keys) == 7
    assert keys[0] == "2026-03-09"
    assert keys[-1] == "2026-03-15"


def test_aggregate_distance_counts() -> None:
    stats = {
        "2026-03-15": {"10": ["a", "b"], "50": ["a"]},
        "2026-03-14": {"10": ["b", "c"]},
    }

    counts = aggregate_distance_counts(stats, day_keys(date(2026, 3, 15), 2))

    assert counts["10"] == 3
    assert counts["50"] == 1
    assert counts["1000"] == 0


def test_storage_roundtrip(tmp_path) -> None:
    path = tmp_path / "data.json"
    save_json(path, {"a": 1})

    assert load_json(path, {}) == {"a": 1}


def test_storage_missing_returns_default(tmp_path) -> None:
    assert load_json(tmp_path / "nope.json", {"default": True}) == {"default": True}


def test_storage_corrupt_returns_default(tmp_path) -> None:
    path = tmp_path / "bad.json"
    path.write_text("{not json", encoding="utf-8")

    assert load_json(path, []) == []
