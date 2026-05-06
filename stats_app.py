#!/usr/bin/env python3
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import psutil
import time
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Speicher für Netzwerk-Geschwindigkeitsberechnung
last_net_bytes = {"sent": 0, "recv": 0, "time": 0}

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/stats')
def get_stats():
    global last_net_bytes
    
    # CPU Auslastung (1 Sekunde messen)
    cpu_total = psutil.cpu_percent(interval=1)
    cpu_per_core = psutil.cpu_percent(interval=0.5, percpu=True)
    
    # RAM Auslastung
    ram = psutil.virtual_memory()
    
    # Netzwerk Statistiken (Geschwindigkeit berechnen)
    net = psutil.net_io_counters()
    current_time = time.time()
    
    dl_speed = 0
    ul_speed = 0
    
    if last_net_bytes["time"] > 0:
        time_diff = current_time - last_net_bytes["time"]
        if time_diff > 0:
            dl_speed = (net.bytes_recv - last_net_bytes["recv"]) / time_diff / 1024  # KB/s
            ul_speed = (net.bytes_sent - last_net_bytes["sent"]) / time_diff / 1024  # KB/s
    
    last_net_bytes = {
        "sent": net.bytes_sent,
        "recv": net.bytes_recv,
        "time": current_time
    }
    
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, threaded=True)
