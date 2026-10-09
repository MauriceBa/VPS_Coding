"""Dependency-free geospatial helpers for the balloon tracker."""

from __future__ import annotations

import math

__all__ = ["bearing_degrees", "compass_direction", "distance_km", "get_distance_and_direction"]

#: 16-point German compass rose, indexed clockwise from north.
_COMPASS_POINTS = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"]

_EARTH_RADIUS_KM = 6371.0088


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in kilometres (haversine)."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def bearing_degrees(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Initial bearing from point 1 to point 2, in degrees ``[0, 360)``."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    x = math.sin(delta_lambda) * math.cos(phi2)
    y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def compass_direction(bearing: float) -> str:
    """Convert a bearing to one of the eight German compass directions."""
    index = round(bearing / 45.0) % 8
    return _COMPASS_POINTS[index]


def get_distance_and_direction(
    user_lat: float, user_lon: float, target_lat: float, target_lon: float
) -> tuple[float, str]:
    """Return ``(distance_km, compass_direction)`` from the user to the target."""
    dist = distance_km(user_lat, user_lon, target_lat, target_lon)
    direction = compass_direction(bearing_degrees(user_lat, user_lon, target_lat, target_lon))
    return round(dist, 1), direction
