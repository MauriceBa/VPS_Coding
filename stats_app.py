#!/usr/bin/env python3
"""Backward-compatible entrypoint for the Flask monitoring API.

Implementation lives in :mod:`mauricefun.web.flask_stats`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from mauricefun.web.flask_stats import main

if __name__ == "__main__":
    main()
