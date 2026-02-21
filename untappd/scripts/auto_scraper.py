import requests
import json
import os
from bs4 import BeautifulSoup
from datetime import datetime

# URL deines Profils
UNTAPPD_URL = "https://untappd.com/user/MauriceDE"
# Pfad zu der JSON Datei, die die Website füttert
STATS_JSON_PATH = "/var/www/mauricefun.lol/html/untappd/data/stats.json"

# Fake Headers, damit Untappd uns nicht direkt blockt
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}

def update_stats_with_new_beers():
    try:
        # 1. Scraping des Public Profiles
        print(f"[{datetime.now()}] Fetching {UNTAPPD_URL}...")
        response = requests.get(UNTAPPD_URL, headers=HEADERS, timeout=10)
        
        if response.status_code != 200:
            print(f"Failed to fetch Untappd. Status Code: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Untappd speichert die aktuellen Activity-Einträge im <div class="item">
        items = soup.select(".item .checkin")
        
        new_checkins = 0
        latest_date = None
        
        # Finde die Stats oben im Profil (Total Checkins, Unique)
        stats_blocks = soup.select(".stats .stat")
        total_checkins_web = None
        unique_beers_web = None
        
        for stat in stats_blocks:
            title = stat.select_one(".title").text.strip().lower()
            val = stat.select_one(".stat-val").text.strip().replace(",", "")
            if "total" in title:
                total_checkins_web = int(val)
            elif "unique" in title:
                unique_beers_web = int(val)

        # 2. Lade aktuelle JSON
        if not os.path.exists(STATS_JSON_PATH):
            print(f"Error: {STATS_JSON_PATH} not found.")
            return
            
        with open(STATS_JSON_PATH, "r", encoding="utf-8") as f:
            stats = json.load(f)
            
        current_total = stats["overview"]["total_checkins"]
        
        if total_checkins_web and total_checkins_web > current_total:
            diff = total_checkins_web - current_total
            print(f"Found {diff} new check-in(s)!")
            
            # Update the JSON
            stats["overview"]["total_checkins"] = total_checkins_web
            if unique_beers_web:
                stats["overview"]["unique_beers"] = unique_beers_web
                
            # Neues "Letztes Check-in Datum" setzen (Heute)
            stats["overview"]["date_to"] = datetime.now().strftime("%Y-%m-%d")
            
            # Neue Biere parsen (nur für "Top Beers" oder "Styles" als Bonus, hier überspringen wir tiefes Parsing um es simpel zu halten)
            # Wir speichern die aktualisierte Datei
            with open(STATS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=4)
                
            print("Successfully updated stats.json!")
        else:
            print("No new check-ins found.")

    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    update_stats_with_new_beers()
