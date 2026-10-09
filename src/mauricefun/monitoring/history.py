"""A fixed-size ring buffer that stores monitoring samples for the history API."""

from __future__ import annotations

import time
from collections import deque
from typing import Any

from mauricefun.monitoring.metrics import Snapshot

__all__ = ["PERIOD_SECONDS", "HistoryBuffer"]

#: Supported history query periods mapped to their length in seconds.
PERIOD_SECONDS: dict[str, int] = {"1m": 60, "1h": 3600, "24h": 86400}

DEFAULT_MAXLEN = 17280  # 24 h at a 5 s interval


class HistoryBuffer:
    """Stores the latest ``maxlen`` samples and serves time-windowed queries."""

    def __init__(self, maxlen: int = DEFAULT_MAXLEN) -> None:
        self._cpu: deque[float] = deque(maxlen=maxlen)
        self._ram: deque[float] = deque(maxlen=maxlen)
        self._net: deque[dict[str, float]] = deque(maxlen=maxlen)
        self._timestamps: deque[float] = deque(maxlen=maxlen)

    def record(self, snapshot: Snapshot) -> None:
        """Append a sample to the buffer, evicting the oldest when full."""
        self._cpu.append(snapshot.cpu_total)
        self._ram.append(snapshot.ram_percent)
        self._net.append({"dl": snapshot.dl_kbs, "ul": snapshot.ul_kbs})
        self._timestamps.append(snapshot.timestamp)

    def query(self, period: str, now: float | None = None) -> list[dict[str, Any]]:
        """Return the samples within ``period`` (``1m``/``1h``/``24h``).

        Raises:
            ValueError: If ``period`` is not a supported value.
        """
        if period not in PERIOD_SECONDS:
            raise ValueError(f"Invalid period {period!r}. Use one of: {', '.join(PERIOD_SECONDS)}")

        cutoff = (now if now is not None else time.time()) - PERIOD_SECONDS[period]
        samples: list[dict[str, Any]] = []
        for index, timestamp in enumerate(self._timestamps):
            if timestamp >= cutoff:
                samples.append(
                    {
                        "timestamp": timestamp,
                        "cpu": self._cpu[index],
                        "ram": self._ram[index],
                        "net": self._net[index],
                    }
                )
        return samples
