"""Shared pytest fixtures."""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from mauricefun.config import Settings, get_settings


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    """A Settings instance whose paths all live inside ``tmp_path``."""
    return replace(
        get_settings(),
        web_root=tmp_path,
        data_dir=tmp_path / "data",
        results_dir=tmp_path / "results",
        untappd_stats_file=tmp_path / "untappd" / "stats.json",
        remontees_data_file=tmp_path / "data" / "remontees_data.json",
        balloon_data_dir=tmp_path / "balloon_notifier",
        balloon_flight_log_file=tmp_path / "balloons" / "flights.json",
    )
