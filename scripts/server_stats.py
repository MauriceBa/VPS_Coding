#!/usr/bin/env python3
"""Backward-compatible entrypoint for the host stats cron job.

Implementation lives in :mod:`mauricefun.monitoring.cron`.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from mauricefun.monitoring.cron import main

if __name__ == "__main__":
    main()
