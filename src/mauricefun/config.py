"""Application configuration loaded from environment variables.

All filesystem paths, ports and credentials used by the backend are centralised here so
that nothing is hardcoded in individual modules. Values fall back to the production
defaults used on the VPS but can be overridden through the environment (see
``.env.example``).
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from mauricefun.exceptions import ConfigurationError

__all__ = ["Settings", "get_settings"]

_DEFAULT_WEB_ROOT = "/var/www/mauricefun.lol/html"


def _env(name: str, default: str) -> str:
    """Return the environment variable ``name`` or ``default`` when unset/empty."""
    value = os.environ.get(name)
    return value if value else default


def _env_int(name: str, default: int) -> int:
    """Return ``name`` parsed as an int, raising :class:`ConfigurationError` on bad input."""
    raw = os.environ.get(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as exc:  # pragma: no cover - defensive
        raise ConfigurationError(
            f"Environment variable {name!r} must be an integer, got {raw!r}"
        ) from exc


@dataclass(frozen=True, slots=True)
class Settings:
    """Immutable snapshot of the runtime configuration."""

    # Filesystem
    web_root: Path
    data_dir: Path
    results_dir: Path
    static_roots: tuple[Path, ...]

    # Monitoring web server
    stats_host: str
    stats_port: int
    streamlit_url: str
    history_maxlen: int

    # Credentials
    telegram_bot_token: str
    openrouter_api_key: str
    foxess_api_key: str
    foxess_device_sn: str

    # Service-specific paths
    remontees_scraper_path: Path
    remontees_data_file: Path
    untappd_scraper_path: Path
    untappd_stats_file: Path
    balloon_flight_log_file: Path
    balloon_data_dir: Path

    @property
    def solar_output_file(self) -> Path:
        """Where the solar dashboard reads its cached data from."""
        return self.web_root / "solar" / "data.json"

    @property
    def server_stats_file(self) -> Path:
        """Where the cron job writes the aggregated host statistics."""
        return self.data_dir / "server_stats.json"

    @classmethod
    def from_env(cls) -> Settings:
        """Build a :class:`Settings` instance from the current environment."""
        web_root = Path(_env("WEB_ROOT", _DEFAULT_WEB_ROOT))
        data_dir = Path(_env("DATA_DIR", str(web_root / "data")))
        results_dir = Path(_env("RESULTS_DIR", "/home/ubuntu/VPS_Coding_full/results"))

        static_roots = (Path.cwd().resolve(), Path("/home/ubuntu/VPS_Coding_full").resolve())

        return cls(
            web_root=web_root,
            data_dir=data_dir,
            results_dir=results_dir,
            static_roots=static_roots,
            stats_host=_env("STATS_HOST", "0.0.0.0"),
            stats_port=_env_int("STATS_PORT", 8080),
            streamlit_url=_env("STREAMLIT_URL", "http://127.0.0.1:8501"),
            history_maxlen=_env_int("HISTORY_MAXLEN", 17280),
            telegram_bot_token=_env("TELEGRAM_BOT_TOKEN", ""),
            openrouter_api_key=_env("OPENROUTER_API_KEY", ""),
            foxess_api_key=_env("FOXESS_API_KEY", ""),
            foxess_device_sn=_env("FOXESS_DEVICE_SN", ""),
            remontees_scraper_path=Path(
                _env(
                    "REMONTEES_SCRAPER_PATH",
                    "/home/ubuntu/projects/mauricefun.lol/scripts/scrape_remontees.py",
                )
            ),
            remontees_data_file=Path(
                _env(
                    "REMONTEES_DATA_FILE",
                    "/home/ubuntu/projects/mauricefun.lol/html/data/remontees_data.json",
                )
            ),
            untappd_scraper_path=Path(
                _env(
                    "UNTAPPD_SCRAPER_PATH",
                    "/home/ubuntu/projects/VPS_Coding/untappd/scripts/auto_scraper.py",
                )
            ),
            untappd_stats_file=Path(
                _env(
                    "UNTAPPD_STATS_FILE",
                    "/home/ubuntu/projects/mauricefun.lol/html/untappd/data/stats.json",
                )
            ),
            balloon_flight_log_file=Path(
                _env(
                    "BALLOON_FLIGHT_LOG_FILE",
                    "/home/ubuntu/VPS_Coding_full/ballons/balloon_flights.json",
                )
            ),
            balloon_data_dir=Path(_env("BALLOON_DATA_DIR", "ballon_notifier")),
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide :class:`Settings` singleton."""
    return Settings.from_env()
