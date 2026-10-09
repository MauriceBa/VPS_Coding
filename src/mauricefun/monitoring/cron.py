"""Cron entrypoint that writes aggregated host statistics to a JSON file.

Run periodically (e.g. every minute) on the VPS::

    python -m mauricefun.monitoring.cron
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

from mauricefun.config import get_settings
from mauricefun.logging_config import configure_logging
from mauricefun.monitoring.metrics import collect_stats

logger = logging.getLogger(__name__)

__all__ = ["main", "write_stats_once"]


def _atomic_write_json(path: Path, payload: dict[str, object]) -> None:
    """Write ``payload`` as JSON to ``path`` atomically via a temp file + rename."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=4)
    os.replace(tmp_path, path)


def write_stats_once(stats_file: Path | None = None) -> Path:
    """Collect a stats snapshot and persist it, returning the written path."""
    target = stats_file or get_settings().server_stats_file
    _atomic_write_json(target, collect_stats())
    logger.info("Updated %s", target)
    return target


def main() -> None:
    """Entrypoint used by cron and the ``mauricefun-stats`` console script."""
    configure_logging()
    write_stats_once()


if __name__ == "__main__":  # pragma: no cover
    main()
