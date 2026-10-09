"""Country-name normalisation shared by the Untappd scripts."""

from __future__ import annotations

__all__ = ["normalize_country"]

#: Maps the various spellings returned by Nominatim/Untappd to one canonical German name.
_COUNTRY_ALIASES: dict[str, str] = {
    "Germany": "Deutschland",
    "Deutschland": "Deutschland",
    "France": "Frankreich",
    "Frankreich": "Frankreich",
    "Nederland": "Niederlande",
    "The Netherlands": "Niederlande",
    "Netherlands": "Niederlande",
    "España": "Spanien",
    "Spain": "Spanien",
    "Österreich": "Österreich",
    "Austria": "Österreich",
    "België / Belgique / Belgien": "Belgien",
    "Belgium": "Belgien",
}


def normalize_country(name: str) -> str:
    """Return the canonical German country name for ``name`` (unchanged if unknown)."""
    return _COUNTRY_ALIASES.get(name, name)
