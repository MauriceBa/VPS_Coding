#!/usr/bin/env python3
"""Backward-compatible entrypoint for the Untappd ML recommender.

Implementation lives in :mod:`mauricefun.untappd.recommender`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

from mauricefun.untappd.recommender import main

if __name__ == "__main__":
    main()
