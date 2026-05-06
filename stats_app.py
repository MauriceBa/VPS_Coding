#!/usr/bin/env python3
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import psutil
import time
import collections
import json

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Historie für Zeitreihen (max 24h bei 5s Intervall = 17280 Einträge)
MAX_HISTORY = 17280  # 24h * 3600s / 5s
cpu_history = collections.deque(maxlen=MAX_HISTORY)
ram_history = collections.deque(maxlen=MAX_HISTORY)
net_history = collections.deque(maxlen=MAX_HISTORY)
timestamps = collections.deque(maxlen=MAX_HISTORY)

# Netzwerk-Initialisierung
last_net = psutil.net_io_counters()
last_net_time = time.time()

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/stats')
def get_stats():
    global last_net, last_net_time
    
    current_time = time.time()
    
    # CPU
    cpu_total = psutil.cpu_percent(interval=0.5)
    cpu_per_core = psutil.cpu_percent(interval=0.3, percpu=True)
    
    # RAM
    ram = psutil.virtual_memory()
    
    # Netzwerk
    net = psutil.net_io_counters()
    dl_speed = 0
    ul_speed = 0
    
    time_diff = current_time - last_net_time
    if time_diff > 0:
        dl_speed = (net.bytes_recv - last_net.bytes_recv) / time_diff / 1024  # KB/s
        ul_speed = (net.bytes_sent - last_net.bytes_sent) / time_diff / 1024  # KB/s
    
    last_net = net
    last_net_time = current_time
    
    # Historie speichern
    cpu_history.append(cpu_total)
    ram_history.append(ram.percent)
    net_history.append({"dl": dl_speed, "ul": ul_speed})
    timestamps.append(current_time)
    
    return jsonify({
        "cpu": {
            "total": round(cpu_total, 1),
            "per_core": [round(c, 1) for c in cpu_per_core]
        },
        "ram": {
            "total_gb": round(ram.total / (1024**3), 2),
            "used_gb": round(ram.used / (1024**3), 2),
            "percent": round(ram.percent, 1)
        },
        "network": {
            "dl_speed_kbs": round(dl_speed, 2),
            "ul_speed_kbs": round(ul_speed, 2)
        }
    })

@app.route('/api/history/<period>')
def get_history(period):
    """Zeitreihen für verschiedene Zeiträume: '1m', '1h', '24h'"""
    now = time.time()
    
    if period == '1m':
        seconds = 60
    elif period == '1h':
        seconds = 3600
    elif period == '24h':
        seconds = 86400
    else:
        return jsonify({"error": "Invalid period. Use: 1m, 1h, 24h"}), 400
    
    # Daten filtern
    cutoff = now - seconds
    filtered_data = []
    
    for i, ts in enumerate(timestamps):
        if ts >= cutoff:
            filtered_data.append({
                "timestamp": ts,
                "cpu": cpu_history[i] if i < len(cpu_history) else None,
                "ram": ram_history[i] if i < len(ram_history) else None,
                "net": net_history[i] if i < len(net_history) else None
            })
    
    return jsonify({
        "period": period,
        "data": filtered_data
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, threaded=True)
