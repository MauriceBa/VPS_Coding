"""Flask variant of the monitoring API (served on a separate port from the combined server)."""

from __future__ import annotations

from typing import Any

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging
from mauricefun.monitoring.service import MonitoringService

__all__ = ["create_app", "main"]

_STATIC_FALLBACK_PORT = 8081


def create_app(settings: Settings | None = None, service: MonitoringService | None = None) -> Flask:
    """Create and configure the Flask monitoring application."""
    settings = settings or get_settings()
    service = service or MonitoringService(settings)

    app = Flask(__name__, static_folder=".", static_url_path="")
    CORS(app)

    @app.route("/")
    def index() -> Any:
        return send_from_directory(".", "index.html")

    @app.route("/<path:path>")
    def static_files(path: str) -> Any:
        return send_from_directory(".", path)

    @app.get("/api/stats")
    def stats() -> Any:
        return jsonify(service.snapshot())

    @app.get("/api/history/<period>")
    def history(period: str) -> Any:
        try:
            data = service.history(period)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        return jsonify({"period": period, "data": data})

    return app


def main() -> None:
    """Entrypoint for running the Flask monitoring API standalone."""
    configure_logging()
    settings = get_settings()
    create_app(settings).run(host="0.0.0.0", port=_STATIC_FALLBACK_PORT, threaded=True)


if __name__ == "__main__":  # pragma: no cover
    main()
