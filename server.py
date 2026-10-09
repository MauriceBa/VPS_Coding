#!/usr/bin/env python3
"""Backward-compatible entrypoint for the combined HTTP server.

Implementation lives in :mod:`mauricefun.web.combined`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from mauricefun.web.combined import main

if __name__ == "__main__":
    main()
