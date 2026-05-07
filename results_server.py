#!/usr/bin/env python3
"""
Einfacher HTTP-Server nur für die Ergebnisseite.
Läuft auf Port 8082 und liefert nur statische Dateien aus dem Verzeichnis aus,
in dem er gestartet wird.
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class ResultsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='/home/ubuntu/VPS_Coding_full/results', **kwargs)
    
    def log_message(self, format, *args):
        pass  # Keine Log-Ausgaben

if __name__ == '__main__':
    port = 8082
    server = HTTPServer(('127.0.0.1', port), ResultsHandler)
    print(f'Ergebnisse-Server läuft auf http://127.0.0.1:{port}')
    print(f'Bedient Dateien aus: /home/ubuntu/VPS_Coding_full/results')
    server.serve_forever()
