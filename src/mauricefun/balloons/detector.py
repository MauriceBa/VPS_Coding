"""Heuristic hot-air-balloon detection from Flightradar24 flight records."""

from __future__ import annotations

from typing import Protocol

__all__ = ["FlightLike", "is_balloon"]

_MAX_BALLOON_SPEED_KTS = 60
_BALLOON_AIRCRAFT_CODES = {"BALL", "HBAL"}
_BALLOON_PREFIXES = ("HB-", "D-O", "OO-B")


class FlightLike(Protocol):
    """Structural type for the flight attributes the tracker reads."""

    id: str
    latitude: float
    longitude: float
    altitude: float | None
    ground_speed: float | None
    aircraft_code: str | None
    registration: str | None
    callsign: str | None


def is_balloon(flight: FlightLike) -> bool:
    """Return ``True`` when ``flight`` looks like a hot-air balloon."""
    speed = flight.ground_speed if flight.ground_speed is not None else 0
    if speed > _MAX_BALLOON_SPEED_KTS:
        return False
    if flight.aircraft_code in _BALLOON_AIRCRAFT_CODES:
        return True

    registration = (flight.registration or "").upper()
    callsign = (flight.callsign or "").upper()
    return any(
        registration.startswith(prefix) or callsign.startswith(prefix)
        for prefix in _BALLOON_PREFIXES
    )
