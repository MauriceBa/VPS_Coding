#!/usr/bin/env python3
import os
import time
import hashlib
import json
import urllib.request
import urllib.error
import ssl

# Konfiguration
API_KEY = os.environ.get("FOXESS_API_KEY", "")
DEVICE_SN = os.environ.get("FOXESS_DEVICE_SN", "")
OUTPUT_FILE = "/var/www/mauricefun.lol/html/solar/data.json"

if not API_KEY or not DEVICE_SN:
    print("FEHLER: FOXESS_API_KEY und FOXESS_DEVICE_SN muessen gesetzt sein!")
    exit(1)

# FoxESS API
BASE_URL = "https://www.foxesscloud.com"
API_PATH = "/op/v0/device/real/query"
URL = f"{BASE_URL}{API_PATH}"

# Signatur generieren (FoxESS Standard)
timestamp = str(int(time.time() * 1000))
signature_string = f"{API_PATH}\\r\\n{API_KEY}\\r\\n{timestamp}"
signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()

headers = {
    'token': API_KEY,
    'timestamp': timestamp,
    'signature': signature,
    'Content-Type': 'application/json',
    'lang': 'en',
    'User-Agent': 'Mozilla/5.0'
}

# Variablen die wir holen wollen
variables = [
    "generationPower",
    "feedinPower", 
    "batChargePower",
    "batDischargePower",
    "gridConsumptionPower",
    "loadsPower",
    "SoC",
    "pv1Power",
    "pv2Power",
    "pv3Power",
    "pv4Power",
    "invPower"
]

payload = {
    "sn": DEVICE_SN,
    "variables": variables
}

data = json.dumps(payload).encode('utf-8')

# SSL Context (für ältere Python-Versionen)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

try:
    req = urllib.request.Request(URL, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
        res_data = response.read().decode('utf-8')
        
        # Parse JSON um Fehler zu checken
        json_data = json.loads(res_data)
        if json_data.get('errno') != 0:
            print(f"API Fehler: {json_data.get('errno')} - {json_data.get('msg', 'Unbekannter Fehler')}")
            exit(1)
        
        # Stelle sicher dass der Ordner existiert
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        # Daten speichern
        with open(OUTPUT_FILE, 'w') as f:
            f.write(res_data)
        
        # Berechtigungen setzen
        try:
            os.chmod(OUTPUT_FILE, 0o644)
        except Exception:
            pass
        
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Solar-Daten erfolgreich aktualisiert!")
        print(f"Erhaltene Variablen: {len(json_data.get('result', []))}")
        
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    print(f"HTTP Fehler {e.code}: {error_body}")
except urllib.error.URLError as e:
    print(f"URL Fehler: {e.reason}")
except json.JSONDecodeError as e:
    print(f"JSON Fehler: {e}")
except Exception as e:
    print(f"Fehler: {e}")
