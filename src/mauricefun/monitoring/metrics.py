"""Host metric collection.

Two sources are provided:

* :func:`collect_stats` reads ``/proc`` and is used by the lightweight cron job that
  writes ``server_stats.json``.
* :class:`MetricsCollector` uses :mod:`psutil` and is used by the live web server,
  which needs per-core CPU and instantaneous network throughput.
"""

from __future__ import annotations

import logging
import platform
import shutil
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import psutil

logger = logging.getLogger(__name__)

__all__ = [
    "MetricsCollector",
    "Snapshot",
    "collect_stats",
    "read_disk_usage",
    "read_loadavg",
    "read_meminfo",
]

_KB_PER_GB = 1024 * 1024
_BYTES_PER_GB = 1024**3
_BYTES_PER_KB = 1024


def read_loadavg() -> tuple[float, float, float]:
    """Return the 1/5/15-minute load averages, or zeros when unavailable (non-Linux)."""
    try:
        with open("/proc/loadavg", encoding="utf-8") as handle:
            parts = handle.read().split()
        return float(parts[0]), float(parts[1]), float(parts[2])
    except (OSError, IndexError, ValueError):
        return 0.0, 0.0, 0.0


def read_meminfo() -> dict[str, float] | None:
    """Return memory usage derived from ``/proc/meminfo`` in gigabytes."""
    info: dict[str, int] = {}
    try:
        with open("/proc/meminfo", encoding="utf-8") as handle:
            for line in handle:
                key, _, value = line.partition(":")
                parts = value.strip().split()
                if parts:
                    info[key] = int(parts[0])  # kB
    except (OSError, ValueError):
        return None

    mem_total = info.get("MemTotal", 0)
    mem_free = info.get("MemFree", 0) + info.get("Buffers", 0) + info.get("Cached", 0)
    mem_used = max(mem_total - mem_free, 0)
    mem_percent = round(mem_used / mem_total * 100, 1) if mem_total > 0 else 0.0

    return {
        "total_gb": round(mem_total / _KB_PER_GB, 2),
        "used_gb": round(mem_used / _KB_PER_GB, 2),
        "free_gb": round(mem_free / _KB_PER_GB, 2),
        "percent": mem_percent,
    }


def read_disk_usage(path: str = "/") -> dict[str, float] | None:
    """Return disk usage for ``path`` in gigabytes, or ``None`` on failure."""
    try:
        total, used, free = shutil.disk_usage(path)
    except OSError:
        return None

    percent = round(used / total * 100, 1) if total > 0 else 0.0
    return {
        "total_gb": round(total / _BYTES_PER_GB, 2),
        "used_gb": round(used / _BYTES_PER_GB, 2),
        "free_gb": round(free / _BYTES_PER_GB, 2),
        "percent": percent,
    }


def collect_stats() -> dict[str, Any]:
    """Collect a point-in-time host statistics snapshot for the cron job."""
    load1, load5, load15 = read_loadavg()
    return {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "load": {"1m": round(load1, 2), "5m": round(load5, 2), "15m": round(load15, 2)},
        "memory": read_meminfo() or {},
        "disk_root": read_disk_usage("/") or {},
        "hostname": platform.node(),
    }


@dataclass
class Snapshot:
    """A single live system sample, including instantaneous network throughput."""

    timestamp: float
    cpu_total: float
    cpu_per_core: list[float] = field(default_factory=list)
    ram_total_gb: float = 0.0
    ram_used_gb: float = 0.0
    ram_percent: float = 0.0
    dl_kbs: float = 0.0
    ul_kbs: float = 0.0

    def to_api(self) -> dict[str, Any]:
        """Render the snapshot using the shape expected by the dashboard frontend."""
        return {
            "cpu": {
                "total": round(self.cpu_total, 1),
                "per_core": [round(core, 1) for core in self.cpu_per_core],
            },
            "ram": {
                "total_gb": round(self.ram_total_gb, 2),
                "used_gb": round(self.ram_used_gb, 2),
                "percent": round(self.ram_percent, 1),
            },
            "network": {
                "dl_speed_kbs": round(self.dl_kbs, 2),
                "ul_speed_kbs": round(self.ul_kbs, 2),
            },
        }


class MetricsCollector:
    """Stateful collector that computes network throughput between consecutive samples."""

    def __init__(self) -> None:
        self._last_net = psutil.net_io_counters()
        self._last_time = time.time()

    def sample(self) -> Snapshot:
        """Take a live sample and return it as a :class:`Snapshot`."""
        now = time.time()
        cpu_total = psutil.cpu_percent(interval=0.3)
        cpu_per_core = psutil.cpu_percent(interval=0.2, percpu=True)
        ram = psutil.virtual_memory()
        net = psutil.net_io_counters()

        elapsed = now - self._last_time
        dl_kbs = ul_kbs = 0.0
        if elapsed > 0:
            dl_kbs = (net.bytes_recv - self._last_net.bytes_recv) / elapsed / _BYTES_PER_KB
            ul_kbs = (net.bytes_sent - self._last_net.bytes_sent) / elapsed / _BYTES_PER_KB

        self._last_net = net
        self._last_time = now

        return Snapshot(
            timestamp=now,
            cpu_total=cpu_total,
            cpu_per_core=list(cpu_per_core),
            ram_total_gb=ram.total / _BYTES_PER_GB,
            ram_used_gb=ram.used / _BYTES_PER_GB,
            ram_percent=ram.percent,
            dl_kbs=dl_kbs,
            ul_kbs=ul_kbs,
        )
