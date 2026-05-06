#!/usr/bin/env python3
"""
Kombinierter Server für mauricefun.lol:
- Bedient statische Dateien (inkl. Unterordner wie /ballons/, /plan-des-pistes/ etc.)
- API-Endpunkte: /api/stats und /api/history/<period>
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import psutil
import time
import collections
from urllib.parse import urlparse
import re

# === Stats-Historie ===
MAX_HISTORY = 17280  # 24h bei 5s Intervall
cpu_history = collections.deque(maxlen=MAX_HISTORY)
ram_history = collections.deque(maxlen=MAX_HISTORY)
net_history = collections.deque(maxlen=MAX_HISTORY)
timestamps = collections.deque(maxlen=MAX_HISTORY)

last_net = psutil.net_io_counters()
last_net_time = time.time()

class CombinedHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # API-Routen abfangen
        if path == '/api/stats':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            current_time = time.time()
            
            # CPU
            cpu_total = psutil.cpu_percent(interval=0.3)
            cpu_per_core = psutil.cpu_percent(interval=0.2, percpu=True)
            
            # RAM
            ram = psutil.virtual_memory()
            
            # Netzwerk
            global last_net, last_net_time
            net = psutil.net_io_counters()
            dl_speed = 0
            ul_speed = 0
            
            time_diff = current_time - last_net_time
            if time_diff > 0:
                dl_speed = (net.bytes_recv - last_net.bytes_recv) / time_diff / 1024
                ul_speed = (net.bytes_sent - last_net.bytes_sent) / time_diff / 1024
            
            last_net = net
            last_net_time = current_time
            
            # Historie speichern
            cpu_history.append(cpu_total)
            ram_history.append(ram.percent)
            net_history.append({"dl": dl_speed, "ul": ul_speed})
            timestamps.append(current_time)
            
            data = {
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
            }
            
            self.wfile.write(json.dumps(data).encode())
            return
            
        # History API
        history_match = re.match(r'^/api/history/(.+)$', path)
        if history_match:
            period = history_match.group(1)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            now = time.time()
            if period == '1m':
                seconds = 60
            elif period == '1h':
                seconds = 3600
            elif period == '24h':
                seconds = 86400
            else:
                self.wfile.write(json.dumps({"error": "Invalid period. Use: 1m, 1h, 24h"}).encode())
                return
            
            cutoff = now - seconds
            filtered_data = []
            
            for i, ts in enumerate(timestamps):
                if ts >= cutoff and i < len(cpu_history):
                    filtered_data.append({
                        "timestamp": ts,
                        "cpu": cpu_history[i] if i < len(cpu_history) else None,
                        "ram": ram_history[i] if i < len(ram_history) else None,
                        "net": net_history[i] if i < len(net_history) else None
                    })
            
            self.wfile.write(json.dumps({
                "period": period,
                "data": filtered_data
            }).encode())
            return
        
        # Ansonsten normale Datei ausliefern (inkl. Unterordner)
        # SimpleHTTPRequestHandler kann das korrekt handhaben
        super().do_GET()
    
    def log_message(self, format, *args):
        # Weniger Logging für bessere Performance
        pass

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), CombinedHandler)
    print('Kombinierter Server läuft auf Port 8080...')
    print('Statische Dateien + API (/api/stats, /api/history/*)')
    server.serve_forever()
