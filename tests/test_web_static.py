"""Tests for safe static-file resolution."""

from __future__ import annotations

from pathlib import Path

import pytest

from mauricefun.web.static import guess_content_type, resolve_static_path


def test_guess_content_type() -> None:
    assert guess_content_type(Path("a.html")) == "text/html"
    assert guess_content_type(Path("a.JS")) == "application/javascript"
    assert guess_content_type(Path("a.unknown")) == "application/octet-stream"


def test_resolve_file(tmp_path: Path) -> None:
    (tmp_path / "style.css").write_text("body{}")

    assert resolve_static_path([tmp_path], "/style.css") == (tmp_path / "style.css").resolve()


def test_resolve_directory_index(tmp_path: Path) -> None:
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "index.html").write_text("<html></html>")

    assert resolve_static_path([tmp_path], "/sub/") == (tmp_path / "sub" / "index.html").resolve()


def test_resolve_missing_raises(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        resolve_static_path([tmp_path], "/nope.html")


def test_path_traversal_is_blocked(tmp_path: Path) -> None:
    root = tmp_path / "root"
    root.mkdir()
    secret = tmp_path / "secret.txt"
    secret.write_text("top secret")

    with pytest.raises(FileNotFoundError):
        resolve_static_path([root], "/../secret.txt")
