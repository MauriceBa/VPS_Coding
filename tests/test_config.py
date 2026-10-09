"""Tests for environment-driven configuration."""

from __future__ import annotations

from pathlib import Path

from mauricefun.config import Settings


def test_defaults_when_env_empty(monkeypatch) -> None:
    for key in ("WEB_ROOT", "DATA_DIR", "RESULTS_DIR", "STATS_PORT", "HISTORY_MAXLEN"):
        monkeypatch.delenv(key, raising=False)

    settings = Settings.from_env()

    assert settings.web_root == Path("/var/www/mauricefun.lol/html")
    assert settings.data_dir == Path("/var/www/mauricefun.lol/html/data")
    assert settings.stats_port == 8080
    assert settings.history_maxlen == 17280


def test_env_overrides(monkeypatch) -> None:
    monkeypatch.setenv("WEB_ROOT", "/srv/site")
    monkeypatch.setenv("STATS_PORT", "9000")
    monkeypatch.setenv("HISTORY_MAXLEN", "10")

    settings = Settings.from_env()

    assert settings.web_root == Path("/srv/site")
    assert settings.data_dir == Path("/srv/site/data")
    assert settings.stats_port == 9000
    assert settings.history_maxlen == 10


def test_derived_paths(monkeypatch) -> None:
    monkeypatch.setenv("WEB_ROOT", "/srv/site")
    monkeypatch.setenv("DATA_DIR", "/srv/data")

    settings = Settings.from_env()

    assert settings.solar_output_file == Path("/srv/site/solar/data.json")
    assert settings.server_stats_file == Path("/srv/data/server_stats.json")
