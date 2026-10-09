"""Central logging configuration.

Library modules only obtain loggers via :func:`logging.getLogger`; the executable
entrypoints call :func:`configure_logging` once to install handlers.
"""

from __future__ import annotations

import logging
import sys

__all__ = ["configure_logging"]

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging(level: int = logging.INFO, log_file: str | None = None) -> None:
    """Configure the root logger.

    Args:
        level: Logging level, e.g. ``logging.DEBUG``.
        log_file: Optional path to also write logs to a file.
    """
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    if log_file:
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))

    logging.basicConfig(level=level, format=_LOG_FORMAT, datefmt=_DATE_FORMAT, handlers=handlers)
