#!/usr/bin/env python3
"""
Kombinierter Server für mauricefun.lol:
- Bedient statische Dateien (inkl. Unterordner wie /ballons/, /plan-des-pistes/ etc.)
- API-Endpunkte: /api/stats und /api/history/<period>
- Reverse Proxy für /thesis/ -> Streamlit (Port 8501) MIT Websocket-Support
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import psutil
import time
import collections
from urllib.parse import urlparse
import re
import urllib.request
import urllib.error
import socket
import threading
import select

# === Stats-Historie ===
MAX_HISTORY = 17280  # 24h bei 5s Intervall
cpu_history = collections.deque(maxlen=MAX_HISTORY)
ram_history = collections.deque(maxlen=MAX_HISTORY)
net_history = collections.deque(maxlen=MAX_HISTORY)
timestamps = collections.deque(maxlen=MAX_HISTORY)

last_net = psutil.net_io_counters()
last_net_time = time.time()

class CombinedHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Reverse Proxy für /thesis/ -> Streamlit Port 8501
        if path.startswith('/thesis/') or path == '/thesis':
            self._proxy_to_streamlit()
            return
        
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
        
        # Ansonsten normale Datei ausliefern (statische Dateien)
        self._serve_static_file(path)
    
    def _proxy_to_streamlit(self):
        """Proxy zu Streamlit mit Websocket-Support"""
        # Prüfen, ob Websocket-Upgrade
        if self.headers.get('Upgrade', '').lower() == 'websocket':
            self._proxy_websocket()
        else:
            self._proxy_http()
    
    def _proxy_http(self):
        """HTTP-Proxy zu Streamlit"""
        try:
            streamlit_url = f"http://127.0.0.1:8501{self.path}"
            
            req = urllib.request.Request(streamlit_url, headers=dict(self.headers))
            req.headers['Host'] = '127.0.0.1:8501'
            
            response = urllib.request.urlopen(req, timeout=10)
            
            self.send_response(response.status)
            for header, value in response.headers.items():
                if header.lower() not in ['transfer-encoding', 'connection']:
                    self.send_header(header, value)
            self.end_headers()
            
            self.wfile.write(response.read())
            
        except urllib.error.HTTPError as e:
            self.send_error(e.code, e.reason)
        except Exception as e:
            self.send_error(502, f"Proxy Error: {str(e)}")
    
    def _proxy_websocket(self):
        """Websocket-Proxy zu Streamlit"""
        try:
            # Verbindung zu Streamlit herstellen
            streamlit_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            streamlit_sock.connect(('127.0.0.1', 8501))
            
            # HTTP-Upgrade-Request an Streamlit senden
            upgrade_request = f"GET {self.path} HTTP/1.1\r\n"
            upgrade_request += f"Host: 127.0.0.1:8501\r\n"
            
            # Alle relevanten Header kopieren
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'connection']:
                    upgrade_request += f"{header}: {value}\r\n"
            upgrade_request += "Connection: Upgrade\r\n"
            upgrade_request += "\r\n"
            
            streamlit_sock.sendall(upgrade_request.encode())
            
            # Antwort von Streamlit lesen (Upgrade bestätigen)
            response = b""
            while b"\r\n\r\n" not in response:
                response += streamlit_sock.recv(4096)
            
            # Antwort an Client weiterleiten
            self.wfile.write(response)
            self.wfile.flush()
            
            # Jetzt bidirektionalen Websocket-Tunnel aufbauen
            self._tunnel_websocket(streamlit_sock)
            
        except Exception as e:
            self.send_error(502, f"Websocket Proxy Error: {str(e)}")
    
    def _tunnel_websocket(self, streamlit_sock):
        """Bidirektionaler Tunnel für Websocket-Daten"""
        client_sock = self.connection
        
        def forward(source, destination):
            try:
                while True:
                    data = source.recv(4096)
                    if not data:
                        break
                    destination.sendall(data)
            except:
                pass
            finally:
                try:
                    source.close()
                except:
                    pass
                try:
                    destination.close()
                except:
                    pass
        
        # Zwei Threads für bidirektionale Kommunikation
        t1 = threading.Thread(target=forward, args=(client_sock, streamlit_sock))
        t2 = threading.Thread(target=forward, args=(streamlit_sock, client_sock))
        
        t1.daemon = True
        t2.daemon = True
        t1.start()
        t2.start()
        
        # Warten bis Verbindung beendet
        t1.join()
        t2.join()
    
    def _serve_static_file(self, path):
        """Statische Dateien ausliefern"""
        try:
            from os.path import realpath, join, isfile
            from os import getcwd
            
            allowed_dirs = [realpath(getcwd()), realpath('/home/ubuntu/VPS_Coding_full')]
            
            full_path = realpath(join(getcwd(), path.lstrip('/')))
            
            if not any(full_path.startswith(d) for d in allowed_dirs):
                self.send_error(403, "Forbidden")
                return
            
            if not isfile(full_path):
                self.send_error(404, "File not found")
                return
            
            with open(full_path, 'rb') as f:
                content = f.read()
            
            content_type = 'text/html'
            if full_path.endswith('.css'):
                content_type = 'text/css'
            elif full_path.endswith('.js'):
                content_type = 'application/javascript'
            elif full_path.endswith('.json'):
                content_type = 'application/json'
            elif full_path.endswith('.png'):
                content_type = 'image/png'
            elif full_path.endswith('.jpg') or full_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), CombinedHandler)
    print('Kombinierter Server läuft auf Port 8080...')
    print('Statische Dateien + API (/api/stats, /api/history/*)')
    print('Reverse Proxy für /thesis/ -> Streamlit Port 8501 (mit Websocket-Support)')
    server.serve_forever()
