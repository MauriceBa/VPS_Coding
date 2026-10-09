"""Reverse proxy to a Streamlit app, including WebSocket tunnelling.

Streamlit is served under ``/thesis/`` on the public site. Plain HTTP requests are
forwarded with :mod:`urllib`; WebSocket upgrades are tunnelled byte-for-byte over a raw
socket so that Streamlit's live session protocol keeps working.
"""

from __future__ import annotations

import logging
import socket
import threading
import urllib.error
import urllib.request
from collections.abc import Iterable
from contextlib import suppress
from urllib.parse import urlparse

from mauricefun.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)

__all__ = ["StreamlitProxy"]

_SOCKET_TIMEOUT_SECONDS = 10
_TUNNEL_BUFFER = 4096
_HTTP_TIMEOUT_SECONDS = 10


class StreamlitProxy:
    """Forwards HTTP and WebSocket traffic to an upstream Streamlit server."""

    def __init__(self, upstream_url: str) -> None:
        parsed = urlparse(upstream_url)
        self.host: str = parsed.hostname or "127.0.0.1"
        self.port: int = parsed.port or 8501

    def forward_http(
        self, path: str, headers: Iterable[tuple[str, str]]
    ) -> tuple[int, list[tuple[str, str]], bytes]:
        """Forward an HTTP request and return ``(status, headers, body)``."""
        url = f"http://{self.host}:{self.port}{path}"
        request = urllib.request.Request(url, headers=dict(headers))
        request.add_header("Host", f"{self.host}:{self.port}")
        try:
            with urllib.request.urlopen(request, timeout=_HTTP_TIMEOUT_SECONDS) as response:
                body = response.read()
                response_headers = [
                    (name, value)
                    for name, value in response.headers.items()
                    if name.lower() not in {"transfer-encoding", "connection"}
                ]
                return response.status, response_headers, body
        except urllib.error.HTTPError as exc:
            return exc.code, [], exc.read()
        except urllib.error.URLError as exc:
            raise ExternalServiceError(f"Streamlit upstream unreachable: {exc.reason}") from exc

    def open_websocket(
        self, path: str, headers: Iterable[tuple[str, str]]
    ) -> tuple[socket.socket, bytes]:
        """Open a WebSocket upgrade against the upstream and return ``(socket, response)``."""
        try:
            upstream = socket.create_connection(
                (self.host, self.port), timeout=_SOCKET_TIMEOUT_SECONDS
            )
        except OSError as exc:
            raise ExternalServiceError(f"Could not connect to Streamlit: {exc}") from exc

        request = self._build_upgrade_request(path, headers)
        upstream.sendall(request.encode())

        response = b""
        try:
            while b"\r\n\r\n" not in response:
                chunk = upstream.recv(_TUNNEL_BUFFER)
                if not chunk:
                    break
                response += chunk
        except OSError as exc:
            upstream.close()
            raise ExternalServiceError(f"Streamlit handshake failed: {exc}") from exc
        return upstream, response

    def tunnel(self, client: socket.socket, upstream: socket.socket) -> None:
        """Pump bytes in both directions until either side closes."""
        thread_out = threading.Thread(target=self._forward, args=(client, upstream), daemon=True)
        thread_back = threading.Thread(target=self._forward, args=(upstream, client), daemon=True)
        thread_out.start()
        thread_back.start()
        thread_out.join()
        thread_back.join()

    def _build_upgrade_request(self, path: str, headers: Iterable[tuple[str, str]]) -> str:
        lines = [f"GET {path} HTTP/1.1", f"Host: {self.host}:{self.port}"]
        for name, value in headers:
            if name.lower() not in {"host", "connection"}:
                lines.append(f"{name}: {value}")
        lines.extend(["Connection: Upgrade", "", ""])
        return "\r\n".join(lines)

    @staticmethod
    def _forward(source: socket.socket, destination: socket.socket) -> None:
        try:
            while True:
                data = source.recv(_TUNNEL_BUFFER)
                if not data:
                    break
                destination.sendall(data)
        except OSError:
            pass
        finally:
            for sock in (source, destination):
                with suppress(OSError):
                    sock.close()
