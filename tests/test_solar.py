"""Tests for the FoxESS solar client."""

from __future__ import annotations

import hashlib
import urllib.error
import urllib.request

import pytest

from mauricefun.exceptions import ConfigurationError, SolarApiError
from mauricefun.solar.client import FoxEssClient, build_signature, write_solar_data


def test_build_signature_uses_literal_backslash_escapes() -> None:
    # FoxESS expects the literal characters backslash-r backslash-n in the signature.
    source = r"/op/v0/device/real/query\r\nabc\r\n123"
    expected = hashlib.md5(source.encode("utf-8")).hexdigest()

    assert build_signature("/op/v0/device/real/query", "abc", "123") == expected


def test_client_requires_credentials() -> None:
    with pytest.raises(ConfigurationError):
        FoxEssClient("", "")


def test_fetch_wraps_connection_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*args: object, **kwargs: object) -> None:
        raise urllib.error.URLError("unreachable")

    monkeypatch.setattr(urllib.request, "urlopen", boom)
    client = FoxEssClient("key", "sn")

    with pytest.raises(SolarApiError, match="Connection failed"):
        client.fetch_real_data()


def test_fetch_raises_on_api_error(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeResponse:
        def __enter__(self) -> FakeResponse:
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def read(self) -> bytes:
            return b'{"errno": 4002, "msg": "bad token"}'

    monkeypatch.setattr(urllib.request, "urlopen", lambda *a, **k: FakeResponse())
    client = FoxEssClient("key", "sn")

    with pytest.raises(SolarApiError, match="4002"):
        client.fetch_real_data()


def test_write_solar_data_creates_file(tmp_path) -> None:
    output = tmp_path / "nested" / "data.json"

    write_solar_data({"errno": 0, "result": []}, str(output))

    assert output.exists()
    assert '"errno": 0' in output.read_text()
