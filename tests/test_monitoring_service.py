"""Tests for host metric collection and the monitoring service."""

from __future__ import annotations

import time

from mauricefun.monitoring.metrics import Snapshot, collect_stats, read_disk_usage, read_loadavg
from mauricefun.monitoring.service import MonitoringService


def test_snapshot_to_api_rounds_values() -> None:
    snapshot = Snapshot(
        timestamp=0.0,
        cpu_total=12.345,
        cpu_per_core=[1.11, 2.22],
        ram_total_gb=15.999,
        ram_used_gb=4.444,
        ram_percent=27.77,
        dl_kbs=3.333,
        ul_kbs=1.111,
    )

    payload = snapshot.to_api()

    assert payload["cpu"] == {"total": 12.3, "per_core": [1.1, 2.2]}
    assert payload["ram"] == {"total_gb": 16.0, "used_gb": 4.44, "percent": 27.8}
    assert payload["network"] == {"dl_speed_kbs": 3.33, "ul_speed_kbs": 1.11}


def test_collect_stats_has_expected_keys() -> None:
    stats = collect_stats()

    assert set(stats) >= {"timestamp", "load", "memory", "disk_root", "hostname"}
    assert set(stats["load"]) == {"1m", "5m", "15m"}


def test_read_loadavg_returns_three_floats() -> None:
    values = read_loadavg()

    assert len(values) == 3
    assert all(isinstance(value, float) for value in values)


def test_read_disk_usage_root() -> None:
    usage = read_disk_usage("/")

    assert usage is not None
    assert usage["total_gb"] > 0


class _StubCollector:
    def __init__(self) -> None:
        self.sampled = 0

    def sample(self) -> Snapshot:
        self.sampled += 1
        return Snapshot(timestamp=time.time(), cpu_total=5.0, ram_percent=40.0)


def test_service_snapshot_records_history(settings) -> None:
    collector = _StubCollector()
    service = MonitoringService(settings, collector=collector)  # type: ignore[arg-type]

    payload = service.snapshot()
    history = service.history("1h")

    assert payload["cpu"]["total"] == 5.0
    assert collector.sampled == 1
    assert len(history) == 1
