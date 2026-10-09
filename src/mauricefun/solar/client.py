"""FoxESS solar inverter client.

Fetches real-time inverter values and caches them as JSON for the solar dashboard.

Run once (typically from cron)::

    python -m mauricefun.solar.client
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import ssl
import time
import urllib.error
import urllib.request
from typing import Any

from mauricefun.config import Settings, get_settings
from mauricefun.exceptions import ConfigurationError, SolarApiError
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = ["FoxEssClient", "build_signature", "main", "write_solar_data"]

_BASE_URL = "https://www.foxesscloud.com"
_API_PATH = "/op/v0/device/real/query"
_TIMEOUT_SECONDS = 30

#: Inverter variables the dashboard consumes.
VARIABLES: tuple[str, ...] = (
    "generationPower",
    "feedinPower",
    "batChargePower",
    "batDischargePower",
    "gridConsumptionPower",
    "loadsPower",
    "SoC",
    "pv1Power",
    "pv2Power",
    "pv3Power",
    "pv4Power",
    "invPower",
)


def build_signature(api_path: str, api_key: str, timestamp: str) -> str:
    """Build the FoxESS MD5 request signature for ``api_path`` and ``timestamp``."""
    signature_source = f"{api_path}\\r\\n{api_key}\\r\\n{timestamp}"
    return hashlib.md5(signature_source.encode("utf-8")).hexdigest()


class FoxEssClient:
    """Minimal client for the FoxESS "real-time query" endpoint."""

    def __init__(self, api_key: str, device_sn: str, base_url: str = _BASE_URL) -> None:
        if not api_key or not device_sn:
            raise ConfigurationError("FoxESS api_key and device_sn must both be set")
        self.api_key = api_key
        self.device_sn = device_sn
        self.base_url = base_url

    def fetch_real_data(self, variables: tuple[str, ...] = VARIABLES) -> dict[str, Any]:
        """Fetch the requested real-time variables.

        Raises:
            SolarApiError: On transport failure or a non-zero FoxESS error code.
        """
        timestamp = str(int(time.time() * 1000))
        headers = {
            "token": self.api_key,
            "timestamp": timestamp,
            "signature": build_signature(_API_PATH, self.api_key, timestamp),
            "Content-Type": "application/json",
            "lang": "en",
            "User-Agent": "Mozilla/5.0",
        }
        payload = json.dumps({"sn": self.device_sn, "variables": list(variables)}).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}{_API_PATH}", data=payload, headers=headers, method="POST"
        )

        try:
            with urllib.request.urlopen(
                request, context=self._ssl_context(), timeout=_TIMEOUT_SECONDS
            ) as response:
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raise SolarApiError(
                f"HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')}"
            ) from exc
        except urllib.error.URLError as exc:
            raise SolarApiError(f"Connection failed: {exc.reason}") from exc

        try:
            data: dict[str, Any] = json.loads(body)
        except json.JSONDecodeError as exc:
            raise SolarApiError(f"Invalid JSON response: {exc}") from exc

        if data.get("errno") != 0:
            raise SolarApiError(f"API error {data.get('errno')}: {data.get('msg', 'unknown')}")
        return data

    @staticmethod
    def _ssl_context() -> ssl.SSLContext:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        return context


def write_solar_data(payload: dict[str, Any], output_file: str) -> None:
    """Persist ``payload`` as JSON to ``output_file`` with world-readable permissions."""
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    try:
        os.chmod(output_file, 0o644)
    except OSError:
        logger.warning("Could not chmod %s", output_file)


def main(settings: Settings | None = None) -> None:
    """Fetch solar data and write it to the configured output file."""
    configure_logging()
    settings = settings or get_settings()

    if not settings.foxess_api_key or not settings.foxess_device_sn:
        raise ConfigurationError("FOXESS_API_KEY and FOXESS_DEVICE_SN must be set")

    client = FoxEssClient(settings.foxess_api_key, settings.foxess_device_sn)
    data = client.fetch_real_data()
    write_solar_data(data, str(settings.solar_output_file))
    logger.info("Solar data updated (%s variables)", len(data.get("result", [])))


if __name__ == "__main__":  # pragma: no cover
    main()
