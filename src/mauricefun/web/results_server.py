"""Static HTTP server dedicated to the results site (port 8082)."""

from __future__ import annotations

import logging
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = ["build_handler", "main", "run_server"]

_HOST = "127.0.0.1"
_PORT = 8082


def build_handler(directory: str) -> type[SimpleHTTPRequestHandler]:
    """Return a request handler that serves files from ``directory``."""

    class ResultsHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, directory=directory, **kwargs)

        def log_message(self, fmt: str, *args: object) -> None:
            logger.debug("%s - %s", self.address_string(), fmt % args)

    return ResultsHandler


def run_server(settings: Settings | None = None) -> None:
    """Start the results static server and block forever."""
    settings = settings or get_settings()
    handler = build_handler(str(settings.results_dir))
    server = ThreadingHTTPServer((_HOST, _PORT), handler)
    logger.info(
        "Results server listening on http://%s:%s (serving %s)", _HOST, _PORT, settings.results_dir
    )
    server.serve_forever()


def main() -> None:
    """Entrypoint for the results server."""
    configure_logging()
    run_server()


if __name__ == "__main__":  # pragma: no cover
    main()
