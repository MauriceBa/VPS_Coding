"""Tests for the monitoring history ring buffer."""

from __future__ import annotations

import pytest

from mauricefun.monitoring.history import HistoryBuffer
from mauricefun.monitoring.metrics import Snapshot


def _snapshot(timestamp: float, cpu: float = 10.0) -> Snapshot:
    return Snapshot(timestamp=timestamp, cpu_total=cpu, ram_percent=50.0, dl_kbs=1.0, ul_kbs=2.0)


def test_record_and_query_window() -> None:
    buffer = HistoryBuffer(maxlen=10)
    buffer.record(_snapshot(1000.0, cpu=1.0))
    buffer.record(_snapshot(1030.0, cpu=2.0))
    buffer.record(_snapshot(1100.0, cpu=3.0))

    result = buffer.query("1m", now=1100.0)

    assert [sample["cpu"] for sample in result] == [3.0]


def test_query_returns_all_in_longer_window() -> None:
    buffer = HistoryBuffer(maxlen=10)
    buffer.record(_snapshot(1000.0))
    buffer.record(_snapshot(2000.0))

    assert len(buffer.query("1h", now=2000.0)) == 2


def test_query_rejects_unknown_period() -> None:
    buffer = HistoryBuffer()
    with pytest.raises(ValueError, match="Invalid period"):
        buffer.query("5m", now=0.0)


def test_maxlen_evicts_oldest() -> None:
    buffer = HistoryBuffer(maxlen=2)
    buffer.record(_snapshot(1.0, cpu=1.0))
    buffer.record(_snapshot(2.0, cpu=2.0))
    buffer.record(_snapshot(3.0, cpu=3.0))

    result = buffer.query("24h", now=3.0)

    assert [sample["cpu"] for sample in result] == [2.0, 3.0]
