"""Tests for the Remontées scraper's pure helpers."""

from __future__ import annotations

from mauricefun.remontees.scraper import clean_text, parse_summaries


def test_clean_text_collapses_whitespace() -> None:
    assert clean_text("  a \n\t b  ") == "a b"


def test_parse_summaries_basic() -> None:
    text = "THREAD_ID: 123\n- Neue Bahn\n- Eröffnung im Dezember\nTHREAD_ID: 456\n- Abriss"

    assert parse_summaries(text) == {
        "123": ["Neue Bahn", "Eröffnung im Dezember"],
        "456": ["Abriss"],
    }


def test_parse_summaries_caps_bullets_at_five() -> None:
    text = "THREAD_ID: 1\n" + "\n".join(f"- bullet {i}" for i in range(10))

    assert len(parse_summaries(text)["1"]) == 5


def test_parse_summaries_ignores_lines_before_header() -> None:
    assert parse_summaries("- orphan\nTHREAD_ID: 9\n- ok") == {"9": ["ok"]}
