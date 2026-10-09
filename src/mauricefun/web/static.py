"""Safe static-file resolution shared by the HTTP servers."""

from __future__ import annotations

import logging
from collections.abc import Sequence
from pathlib import Path

logger = logging.getLogger(__name__)

__all__ = ["DEFAULT_CONTENT_TYPE", "guess_content_type", "resolve_static_path"]

#: Minimal MIME table covering the file types the site actually serves.
MIME_TYPES: dict[str, str] = {
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".map": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".xml": "application/xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
}

DEFAULT_CONTENT_TYPE = "application/octet-stream"


def guess_content_type(path: Path) -> str:
    """Return a MIME type for ``path`` based on its extension."""
    return MIME_TYPES.get(path.suffix.lower(), DEFAULT_CONTENT_TYPE)


def resolve_static_path(roots: Sequence[Path], url_path: str) -> Path:
    """Resolve ``url_path`` to a file inside one of ``roots``.

    Directory requests fall back to an ``index.html`` inside the directory.

    Args:
        roots: Directories that may be served from.
        url_path: The request path (query string already stripped).

    Returns:
        The absolute path of the file to serve.

    Raises:
        FileNotFoundError: If no matching file exists inside an allowed root.
    """
    relative = url_path.lstrip("/")
    for root in roots:
        resolved_root = root.resolve()
        candidate = (resolved_root / relative).resolve()
        if not _is_within(candidate, resolved_root):
            logger.warning("Blocked path traversal attempt: %s", url_path)
            continue
        if candidate.is_dir():
            index = candidate / "index.html"
            if index.is_file():
                return index
            continue
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(url_path)


def _is_within(path: Path, root: Path) -> bool:
    """Return ``True`` when ``path`` is inside ``root``."""
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True
