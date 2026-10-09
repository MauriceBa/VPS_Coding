"""Aggregation of daily balloon sighting statistics."""

from __future__ import annotations

from datetime import date, timedelta

__all__ = ["DISTANCE_BUCKETS", "aggregate_distance_counts", "day_keys"]

#: Distance thresholds (km) the bot reports on.
DISTANCE_BUCKETS: tuple[str, ...] = ("10", "50", "100", "500", "1000")


def day_keys(end: date, days: int) -> list[str]:
    """Return the ``days`` ISO date strings ending at ``end`` (inclusive)."""
    start = end - timedelta(days=days - 1)
    return [(start + timedelta(days=offset)).isoformat() for offset in range(days)]


def aggregate_distance_counts(
    stats: dict[str, dict[str, list[str]]], days: list[str]
) -> dict[str, int]:
    """Count distinct balloon IDs per distance bucket across ``days``."""
    ids: dict[str, set[str]] = {bucket: set() for bucket in DISTANCE_BUCKETS}
    for day in days:
        day_stats = stats.get(day, {})
        for bucket in DISTANCE_BUCKETS:
            ids[bucket].update(day_stats.get(bucket, []))
    return {bucket: len(values) for bucket, values in ids.items()}
