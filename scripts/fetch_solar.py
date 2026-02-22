import os
import time
import hashlib
import json
import urllib.request
import urllib.error

# Konfiguration: Lese API-Key aus Umgebungsvariablen
API_KEY = os.environ.get("FOXESS_API_KEY", "")
DEVICE_SN = os.environ.get("FOXESS_DEVICE_SN", "")
OUTPUT_FILE = "/var/www/mauricefun.lol/html/solar/data.json"

if not API_KEY or not DEVICE_SN:
    print("FEHLER: FOXESS_API_KEY und FOXESS_DEVICE_SN muessen als Umgebungsvariablen gesetzt sein!")
    exit(1)

# FoxESS API Endpoint
API_PATH = '/op/v0/device/real/query'
URL = f'https://www.foxesscloud.com{API_PATH}'

# Signatur generieren (MD5)
timestamp = str(int(time.time() * 1000))
signature_string = f"{API_PATH}\r\n{API_KEY}\r\n{timestamp}"
signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()

headers = {
    'token': API_KEY,
    'timestamp': timestamp,
    'signature': signature,
    'Content-Type': 'application/json'
}

# Payload mit den wichtigsten Variablen
payload = {
    "sn": DEVICE_SN, 
    "variables": [
        "generationPower", 
        "feedinPower", 
        "batChargePower", 
        "batDischargePower", 
        "gridConsumptionPower", 
        "loadsPower", 
        "SoC"
    ]
}
data = json.dumps(payload).encode('utf-8')

try:
    req = urllib.request.Request(URL, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        res_data = response.read()
        
        # Stelle sicher, dass der Ordner existiert
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        # Daten in JSON speichern
        with open(OUTPUT_FILE, 'wb') as f:
            f.write(res_data)
            
        # Berechtigungen fuer Nginx anpassen (optional, falls via Root/Cron ausgeführt)
        try:
            os.chmod(OUTPUT_FILE, 0o644)
        except Exception:
            pass
            
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Solar-Daten erfolgreich aktualisiert!")
except urllib.error.HTTPError as e:
    print(f"HTTP Fehler: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Fehler beim Abrufen der Solar-Daten: {e}")
