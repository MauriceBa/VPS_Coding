#!/usr/bin/env python3
"""Backward-compatible entrypoint for the Telegram balloon tracker.

Implementation lives in :mod:`mauricefun.balloons.bot`. The Telegram token is read from
the ``TELEGRAM_BOT_TOKEN`` environment variable.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from mauricefun.balloons.bot import main

if __name__ == "__main__":
    main()
