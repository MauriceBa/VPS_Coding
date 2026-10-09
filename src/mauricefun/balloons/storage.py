"""Small JSON persistence helpers used by the balloon tracker."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

__all__ = ["load_json", "save_json"]


def load_json(path: Path, default: Any) -> Any:
    """Load JSON from ``path``; return ``default`` when missing or corrupt."""
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not read %s: %s", path, exc)
        return default


def save_json(path: Path, data: Any) -> None:
    """Write ``data`` as JSON to ``path`` atomically."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)
