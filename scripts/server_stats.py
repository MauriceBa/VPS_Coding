#!/usr/bin/env python3
import json
import os
import shutil
import time
from datetime import datetime

# Zielpfad für die Stats-Datei
WEB_ROOT = "/var/www/mauricefun.lol/html"
DATA_DIR = os.path.join(WEB_ROOT, "data")
STATS_FILE = os.path.join(DATA_DIR, "server_stats.json")

# Fallback für lokale Tests im Repo
if not os.path.isdir(WEB_ROOT):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "../data")
    STATS_FILE = os.path.join(DATA_DIR, "server_stats.json")

os.makedirs(DATA_DIR, exist_ok=True)


def read_loadavg():
    try:
        with open("/proc/loadavg", "r", encoding="utf-8") as f:
            parts = f.read().split()
            return float(parts[0]), float(parts[1]), float(parts[2])
    except Exception:
        return 0.0, 0.0, 0.0


def read_meminfo():
    info = {}
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as f:
            for line in f:
                key, value = line.split(":", 1)
                parts = value.strip().split()
                if parts:
                    info[key] = int(parts[0])  # kB
    except Exception:
        return None

    mem_total = info.get("MemTotal", 0)
    mem_free = info.get("MemFree", 0) + info.get("Buffers", 0) + info.get("Cached", 0)
    mem_used = max(mem_total - mem_free, 0)
    if mem_total > 0:
        mem_percent = round(mem_used / mem_total * 100, 1)
    else:
        mem_percent = 0.0

    # kB -> GB
    kb_to_gb = 1024 * 1024
    return {
        "total_gb": round(mem_total / kb_to_gb, 2),
        "used_gb": round(mem_used / kb_to_gb, 2),
        "free_gb": round(mem_free / kb_to_gb, 2),
        "percent": mem_percent,
    }


def read_disk_usage(path="/"):
    try:
        total, used, free = shutil.disk_usage(path)
        gb = 1024 ** 3
        used_gb = round(used / gb, 2)
        total_gb = round(total / gb, 2)
        free_gb = round(free / gb, 2)
        percent = round(used / total * 100, 1) if total > 0 else 0.0
        return {
            "total_gb": total_gb,
            "used_gb": used_gb,
            "free_gb": free_gb,
            "percent": percent,
        }
    except Exception:
        return None


def collect_stats():
    load1, load5, load15 = read_loadavg()
    mem = read_meminfo() or {}
    disk = read_disk_usage("/") or {}

    return {
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "load": {
            "1m": round(load1, 2),
            "5m": round(load5, 2),
            "15m": round(load15, 2),
        },
        "memory": mem,
        "disk_root": disk,
        "hostname": os.uname().nodename,
    }


def write_stats_once():
    stats = collect_stats()
    tmp_file = STATS_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=4)
    os.replace(tmp_file, STATS_FILE)
    print(f"[{datetime.now()}] Updated {STATS_FILE}")


if __name__ == "__main__":
    # Script ist so ausgelegt, dass es von cron alle X Sekunden/Minuten aufgerufen wird
    write_stats_once()
