import requests
import json
import os
import sys
from bs4 import BeautifulSoup
from datetime import datetime

# Füge Pfad hinzu, damit cron den recommender importieren kann
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    import ml_recommender
except ImportError:
    ml_recommender = None

# URL deines Profils
UNTAPPD_URL = "https://untappd.com/user/MauriceDE"
STATS_JSON_PATH = "/var/www/mauricefun.lol/html/untappd/data/stats.json"

if not os.path.exists(STATS_JSON_PATH):
    # Fallback für lokale Ausführung
    STATS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/stats.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}

def update_stats_with_new_beers():
    try:
        print(f"[{datetime.now()}] Fetching {UNTAPPD_URL}...")
        response = requests.get(UNTAPPD_URL, headers=HEADERS, timeout=10)
        
        if response.status_code != 200:
            print(f"Failed to fetch Untappd. Status Code: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, "html.parser")
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

        if not os.path.exists(STATS_JSON_PATH):
            print(f"Error: {STATS_JSON_PATH} not found.")
            return
            
        with open(STATS_JSON_PATH, "r", encoding="utf-8") as f:
            stats = json.load(f)
            
        current_total = stats["overview"]["total_checkins"]
        
        if total_checkins_web and total_checkins_web > current_total:
            diff = total_checkins_web - current_total
            print(f"Found {diff} new check-in(s)!")
            
            stats["overview"]["total_checkins"] = total_checkins_web
            if unique_beers_web:
                stats["overview"]["unique_beers"] = unique_beers_web
            stats["overview"]["date_to"] = datetime.now().strftime("%Y-%m-%d")
            
            with open(STATS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=4)
            print("Successfully updated stats.json!")
        else:
            print("No new check-ins found.")

        # ====================================================
        # Immer die ML-Pipeline anwerfen, damit das "Bier des Tages" erneuert wird!
        # ====================================================
        if ml_recommender:
            print("Running Data Science / ML Recommendation pipeline...")
            ml_recommender.run_ml_pipeline()

    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    update_stats_with_new_beers()
