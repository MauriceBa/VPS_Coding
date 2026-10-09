#!/usr/bin/env python3
"""Backward-compatible entrypoint for the Untappd export parser.

Implementation lives in :mod:`mauricefun.untappd.parser`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

from mauricefun.untappd.parser import main

if __name__ == "__main__":
    main()
