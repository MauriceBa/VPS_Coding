#!/usr/bin/env python3
"""Backward-compatible entrypoint for the Untappd location parser.

Implementation lives in :mod:`mauricefun.untappd.locations`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

from mauricefun.untappd.locations import main

if __name__ == "__main__":
    main()
