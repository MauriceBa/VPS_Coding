"""Mini HTTP API that triggers the Untappd scraper (port 5000)."""

from __future__ import annotations

import json
import logging
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = ["build_handler", "main", "run_server"]

_HOST = "127.0.0.1"
_PORT = 5000
_SCRAPE_TIMEOUT_SECONDS = 120
_LOG_FILE = Path("/tmp/untappd_scraper_web.log")


def build_handler(settings: Settings) -> type[BaseHTTPRequestHandler]:
    """Return a request handler that triggers the configured scraper."""
    scraper_path = str(settings.untappd_scraper_path)

    class ScraperHandler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            if self.path != "/trigger":
                self.send_response(404)
                self.end_headers()
                return

            try:
                result = subprocess.run(
                    ["python3", scraper_path],
                    capture_output=True,
                    text=True,
                    timeout=_SCRAPE_TIMEOUT_SECONDS,
                    check=False,
                )
            except subprocess.TimeoutExpired:
                self._json_response(
                    {"status": "running", "message": "Scraper läuft im Hintergrund..."}
                )
                return
            except OSError as exc:
                self._json_response({"status": "error", "message": str(exc)}, status=500)
                return

            self._append_log(result.stdout, result.stderr)
            output = result.stdout[-1000:] if result.stdout else "OK"
            self._json_response(
                {"status": "success", "message": "Scraper wurde gestartet", "output": output}
            )

        def _json_response(self, payload: dict[str, Any], status: int = 200) -> None:
            body = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        @staticmethod
        def _append_log(stdout: str, stderr: str) -> None:
            try:
                with open(_LOG_FILE, "a", encoding="utf-8") as handle:
                    handle.write("Web trigger executed\n")
                    handle.write(stdout)
                    handle.write(stderr)
                    handle.write("\n---\n")
            except OSError as exc:
                logger.warning("Could not write scraper log: %s", exc)

        def log_message(self, fmt: str, *args: object) -> None:
            logger.debug("%s - %s", self.address_string(), fmt % args)

    return ScraperHandler


def run_server(settings: Settings | None = None) -> None:
    """Start the scraper trigger API and block forever."""
    settings = settings or get_settings()
    server = ThreadingHTTPServer((_HOST, _PORT), build_handler(settings))
    logger.info("Scraper API listening on http://%s:%s/trigger", _HOST, _PORT)
    server.serve_forever()


def main() -> None:
    """Entrypoint for the ``mauricefun-untappd-api`` console script."""
    configure_logging()
    run_server()


if __name__ == "__main__":  # pragma: no cover
    main()
