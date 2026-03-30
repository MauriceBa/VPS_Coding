#!/bin/bash
# ============================================================
# Beer Style Explorer — OpenClaw VPS Hosting Script
# Serves the beer-style-explorer as a static site via Python
# ============================================================

PORT=${1:-8099}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "====================================="
echo " 🍺 Beer Style Explorer"
echo " Serving at http://0.0.0.0:$PORT"
echo " Directory: $DIR"
echo "====================================="

# Check if Python 3 is available
if command -v python3 &>/dev/null; then
    cd "$DIR"
    python3 -m http.server "$PORT" --bind 0.0.0.0
elif command -v python &>/dev/null; then
    cd "$DIR"
    python -m SimpleHTTPServer "$PORT"
elif command -v npx &>/dev/null; then
    cd "$DIR"
    npx serve -l "$PORT" -s .
else
    echo "ERROR: No suitable server found (python3/python/npx required)"
    exit 1
fi
