"""Custom exception hierarchy for mauricefun services.

Using explicit exception types instead of broad ``except Exception`` handlers keeps
error handling predictable and lets callers distinguish configuration mistakes from
upstream service failures.
"""

from __future__ import annotations

__all__ = [
    "BalloonTrackerError",
    "ConfigurationError",
    "ExternalServiceError",
    "MauriceFunError",
    "RemonteesError",
    "ScraperError",
    "SolarApiError",
    "UntappdError",
]


class MauriceFunError(Exception):
    """Base class for every error raised by mauricefun code."""


class ConfigurationError(MauriceFunError):
    """Raised when required configuration is missing or invalid."""


class ExternalServiceError(MauriceFunError):
    """Raised when a third-party service fails or returns an unexpected response."""


class SolarApiError(ExternalServiceError):
    """Raised for FoxESS solar API failures."""


class ScraperError(MauriceFunError):
    """Base class for scraping failures."""


class RemonteesError(ScraperError):
    """Raised when scraping the Remontées Mécaniques forum fails."""


class UntappdError(ScraperError):
    """Raised when scraping or parsing Untappd data fails."""


class BalloonTrackerError(MauriceFunError):
    """Raised for hot-air-balloon tracker failures."""
