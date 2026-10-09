"""Combined HTTP server for mauricefun.lol.

Serves static files, exposes ``/api/stats`` and ``/api/history/<period>``, and reverse
proxies ``/thesis/`` to a Streamlit instance (including WebSockets).
"""

from __future__ import annotations

import json
import logging
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging
from mauricefun.monitoring.service import MonitoringService
from mauricefun.web.proxy import StreamlitProxy
from mauricefun.web.static import guess_content_type, resolve_static_path

logger = logging.getLogger(__name__)

__all__ = ["build_request_handler", "main", "run_server"]

_HISTORY_PATTERN = re.compile(r"^/api/history/(?P<period>[^/]+)$")


def build_request_handler(
    service: MonitoringService, settings: Settings
) -> type[BaseHTTPRequestHandler]:
    """Create a request handler class bound to ``service`` and ``settings``."""
    proxy = StreamlitProxy(settings.streamlit_url)

    class CombinedRequestHandler(BaseHTTPRequestHandler):
        server_version = "MauriceFun/1.0"
        protocol_version = "HTTP/1.1"

        def do_GET(self) -> None:
            path = urlparse(self.path).path

            if path == "/thesis" or path.startswith("/thesis/"):
                self._proxy_to_streamlit(proxy)
                return

            if path == "/api/stats":
                self._send_json(service.snapshot())
                return

            match = _HISTORY_PATTERN.match(path)
            if match:
                period = match.group("period")
                try:
                    data = service.history(period)
                except ValueError as exc:
                    self._send_json({"error": str(exc)}, status=400)
                    return
                self._send_json({"period": period, "data": data})
                return

            self._serve_static(path)

        def _send_json(self, payload: dict[str, Any], status: int = 200) -> None:
            body = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _serve_static(self, path: str) -> None:
            try:
                file_path = resolve_static_path(settings.static_roots, path)
            except FileNotFoundError:
                self.send_error(404, "File not found")
                return

            try:
                content = file_path.read_bytes()
            except OSError as exc:
                logger.error("Failed to read %s: %s", file_path, exc)
                self.send_error(500, "Internal Server Error")
                return

            self.send_response(200)
            self.send_header("Content-Type", guess_content_type(file_path))
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)

        def _proxy_to_streamlit(self, proxy: StreamlitProxy) -> None:
            if self.headers.get("Upgrade", "").lower() == "websocket":
                self._proxy_websocket(proxy)
            else:
                self._proxy_http(proxy)

        def _proxy_http(self, proxy: StreamlitProxy) -> None:
            try:
                status, headers, body = proxy.forward_http(self.path, self.headers.items())
            except Exception as exc:
                logger.error("Streamlit HTTP proxy error: %s", exc)
                self.send_error(502, "Proxy Error")
                return

            self.send_response(status)
            for name, value in headers:
                self.send_header(name, value)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _proxy_websocket(self, proxy: StreamlitProxy) -> None:
            try:
                upstream, response = proxy.open_websocket(self.path, self.headers.items())
            except Exception as exc:
                logger.error("Streamlit WebSocket proxy error: %s", exc)
                self.send_error(502, "WebSocket Proxy Error")
                return

            self.wfile.write(response)
            self.wfile.flush()
            proxy.tunnel(self.connection, upstream)

        def log_message(self, fmt: str, *args: Any) -> None:
            logger.debug("%s - %s", self.address_string(), fmt % args)

    return CombinedRequestHandler


def run_server(settings: Settings | None = None) -> None:
    """Start the combined HTTP server and block forever."""
    settings = settings or get_settings()
    service = MonitoringService(settings)
    handler = build_request_handler(service, settings)
    server = ThreadingHTTPServer((settings.stats_host, settings.stats_port), handler)
    logger.info("Combined server listening on %s:%s", settings.stats_host, settings.stats_port)
    server.serve_forever()


def main() -> None:
    """Entrypoint for the ``mauricefun-monitoring`` console script."""
    configure_logging()
    run_server()


if __name__ == "__main__":  # pragma: no cover
    main()
