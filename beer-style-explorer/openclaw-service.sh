#!/bin/bash
# ============================================================
# OpenClaw Bot — Beer Style Explorer Auto-Deploy Service
# Place this in your OpenClaw scripts directory
# Usage: ./openclaw-service.sh [start|stop|restart|status]
# ============================================================

SERVICE_NAME="beer-style-explorer"
PORT=8099
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="/tmp/${SERVICE_NAME}.pid"
LOG_FILE="/tmp/${SERVICE_NAME}.log"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "[INFO] $SERVICE_NAME is already running (PID $(cat $PID_FILE))"
        return 0
    fi
    echo "[INFO] Starting $SERVICE_NAME on port $PORT..."
    cd "$SCRIPT_DIR"
    nohup python3 -m http.server $PORT --bind 0.0.0.0 > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 1
    if kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "[OK] $SERVICE_NAME started (PID $(cat $PID_FILE))"
        echo "[OK] Access at http://$(hostname -I | awk '{print $1}'):$PORT"
    else
        echo "[ERROR] Failed to start $SERVICE_NAME"
        rm -f "$PID_FILE"
        exit 1
    fi
}

stop() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        kill "$(cat $PID_FILE)"
        rm -f "$PID_FILE"
        echo "[OK] $SERVICE_NAME stopped."
    else
        echo "[INFO] $SERVICE_NAME is not running."
    fi
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "[OK] $SERVICE_NAME is running (PID $(cat $PID_FILE)) on port $PORT"
    else
        echo "[INFO] $SERVICE_NAME is NOT running."
    fi
}

case "${1:-start}" in
    start)   start   ;;
    stop)    stop    ;;
    restart) restart ;;
    status)  status  ;;
    *) echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
