#!/usr/bin/env python3
"""
Mini-API für Untappd Scraper Trigger
Läuft auf Port 5000 und führt den Scraper aus
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import json
import os

SCRIPT_PATH = "/home/ubuntu/projects/VPS_Coding/untappd/scripts/auto_scraper.py"
LOG_FILE = "/tmp/untappd_scraper_web.log"

class ScraperHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/trigger":
            try:
                # Scraper ausführen
                result = subprocess.run(
                    ["python3", SCRIPT_PATH],
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                
                # Log schreiben
                with open(LOG_FILE, "a") as f:
                    f.write(f"[{os.path.getmtime(__file__)}] Web trigger executed\n")
                    f.write(result.stdout)
                    f.write(result.stderr)
                    f.write("\n---\n")
                
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                
                response = {
                    "status": "success",
                    "message": "Scraper wurde gestartet",
                    "output": result.stdout[-1000:] if result.stdout else "OK"  # Letzte 1000 Zeichen
                }
                self.wfile.write(json.dumps(response).encode())
                
            except subprocess.TimeoutExpired:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                response = {"status": "running", "message": "Scraper läuft im Hintergrund..."}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                response = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Logs unterdrücken
        pass

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 5000), ScraperHandler)
    print("Scraper-API läuft auf http://127.0.0.1:5000/trigger")
    server.serve_forever()
