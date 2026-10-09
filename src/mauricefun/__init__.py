"""Backend services, scrapers and tooling for mauricefun.lol.

The package is organised by domain:

``monitoring``
    Host metrics collection, history buffering and the stats cron job.
``web``
    HTTP servers that expose static files and monitoring/API endpoints.
``solar``
    FoxESS solar inverter client.
``remontees``
    Remontées Mécaniques forum scraper and its FastAPI wrapper.
``untappd``
    Personal Untappd export parsers, scrapers and the ML recommender.
``balloons``
    Telegram hot-air-balloon tracker.
"""

from __future__ import annotations

__all__ = ["__version__"]

__version__ = "1.0.0"
