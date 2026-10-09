"""Application service tying the metrics collector and history buffer together."""

from __future__ import annotations

from typing import Any

from mauricefun.config import Settings, get_settings
from mauricefun.monitoring.history import HistoryBuffer
from mauricefun.monitoring.metrics import MetricsCollector

__all__ = ["MonitoringService"]


class MonitoringService:
    """Serves live snapshots and historical series for the dashboard API."""

    def __init__(
        self,
        settings: Settings | None = None,
        history: HistoryBuffer | None = None,
        collector: MetricsCollector | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.history_buffer = history or HistoryBuffer(self.settings.history_maxlen)
        self.collector = collector or MetricsCollector()

    def snapshot(self) -> dict[str, Any]:
        """Sample the host, record it in history and return the API payload."""
        sample = self.collector.sample()
        self.history_buffer.record(sample)
        return sample.to_api()

    def history(self, period: str) -> list[dict[str, Any]]:
        """Return historical samples for ``period``.

        Raises:
            ValueError: If ``period`` is unsupported.
        """
        return self.history_buffer.query(period)
