"""FastAPI wrapper that triggers the Remontées scraper on demand."""

from __future__ import annotations

import json
import logging
import os
import subprocess
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from mauricefun.config import Settings, get_settings
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = ["API_VERSION", "create_app", "main"]

API_VERSION = "6.0"
_SCRAPE_TIMEOUT_SECONDS = 120


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create the Remontées scraper API application."""
    settings = settings or get_settings()
    app = FastAPI(title="Remontées Scraper API", version=API_VERSION)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    scraper_path = str(settings.remontees_scraper_path)
    data_file = str(settings.remontees_data_file)

    @app.get("/")
    def read_root() -> dict[str, Any]:
        return {
            "message": "Remontées Scraper API",
            "version": API_VERSION,
            "endpoints": {
                "/api/scrape": "POST - Startet Scraper mit posts Parameter",
                "/api/status": "GET - Gibt aktuelle Daten zurück",
            },
        }

    @app.post("/api/scrape")
    def scrape_posts(
        posts: int = Query(
            default=20, ge=5, le=40, description="Anzahl Beiträge pro Thread (5-40)"
        ),
    ) -> dict[str, Any]:
        """Run the scraper for ``posts`` posts per thread (takes ~20-40 seconds)."""
        try:
            result = subprocess.run(
                ["python3", scraper_path, str(posts)],
                capture_output=True,
                text=True,
                timeout=_SCRAPE_TIMEOUT_SECONDS,
                env=os.environ.copy(),
                cwd=os.path.dirname(scraper_path),
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(status_code=504, detail="Scraper timeout (> 2 Minuten)") from exc

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Scraper Fehler: {result.stderr}")

        if not os.path.exists(data_file):
            raise HTTPException(status_code=500, detail="Ausgabedatei nicht gefunden")

        with open(data_file, encoding="utf-8") as handle:
            data = json.load(handle)
        return {
            "success": True,
            "message": "Scrape erfolgreich",
            "posts_per_thread": posts,
            "data": data,
        }

    @app.get("/api/status")
    def get_status() -> Any:
        """Return the most recently scraped data."""
        if not os.path.exists(data_file):
            return {"last_updated": None, "stations": [], "lifts": []}
        try:
            with open(data_file, encoding="utf-8") as handle:
                return json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get("/api/health")
    def health_check() -> dict[str, Any]:
        """Health probe for monitoring."""
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "scraper_exists": os.path.exists(scraper_path),
            "data_exists": os.path.exists(data_file),
        }

    return app


def main() -> None:
    """Entrypoint for the ``mauricefun-remontees-api`` console script."""
    import uvicorn

    configure_logging()
    uvicorn.run(create_app(), host="127.0.0.1", port=8000)


if __name__ == "__main__":  # pragma: no cover
    main()
