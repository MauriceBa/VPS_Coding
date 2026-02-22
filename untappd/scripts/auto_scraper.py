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
    from parse_untappd import infer_style, guess_brewery_country
except ImportError:
    ml_recommender = None
    infer_style = lambda n, b: "Other"
    guess_brewery_country = lambda b: "Unknown"

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
        
        # 1. Globale Stats parsen
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
            
        current_total = stats.get("overview", {}).get("total_checkins", 0)
        last_checkin_id = stats.get("overview", {}).get("last_checkin_id", 0)
        
        # 2. Neue Biere aus dem Activity Feed (Recent Check-ins) auslesen
        highest_id_seen = last_checkin_id
        new_checkins_processed = 0
        
        # Finde alle Check-in Items auf der Seite
        for item in soup.select(".item[data-checkin-id]"):
            try:
                cid = int(item["data-checkin-id"])
                if cid <= last_checkin_id:
                    continue # Check-in haben wir schon verarbeitet
                    
                if cid > highest_id_seen:
                    highest_id_seen = cid
                    
                text_p = item.select_one("p.text")
                if not text_p:
                    continue
                    
                links = text_p.find_all("a")
                beer_name = None
                brewery_name = "Unknown"
                
                for link in links:
                    href = link.get("href", "")
                    if "/beer/" in href or "/b/" in href:
                        beer_name = link.text.strip()
                    elif "/brewery/" in href:
                        brewery_name = link.text.strip()
                
                if not beer_name:
                    continue
                    
                # Rating auslesen
                rating = 3.0 # Fallback
                caps = item.select_one(".caps")
                if caps and caps.has_attr("data-rating"):
                    try:
                        rating = float(caps["data-rating"])
                    except ValueError:
                        pass
                
                # Checken, ob wir das Bier schon in der Datenbank haben
                rated_beers = stats.get("rated_beers", [])
                found_beer = False
                for b in rated_beers:
                    if b["beer"] == beer_name:
                        found_beer = True
                        # Update rating average & count
                        old_count = b.get("rated_count", 1)
                        old_avg = b.get("avg_rating", rating)
                        # Neues gewichtetes Mittel
                        new_avg = ((old_avg * old_count) + rating) / (old_count + 1)
                        b["avg_rating"] = round(new_avg * 4) / 4 # Runden auf Untappd 0.25er Schritte
                        b["rated_count"] = old_count + 1
                        break
                
                if not found_beer:
                    print(f"-> NEUES BIER ENTDECKT: {beer_name} von {brewery_name} ({rating} Sterne)")
                    style = infer_style(beer_name, [])
                    new_beer_entry = {
                        "beer": beer_name,
                        "brewery": brewery_name,
                        "style": style,
                        "avg_rating": rating,
                        "rated_count": 1
                    }
                    rated_beers.append(new_beer_entry)
                    
                    # Optional: Auch Top Breweries und Styles updaten, damit die Diagramme stimmen
                    top_breweries = stats.get("top_breweries", [])
                    found_brewery = False
                    for br in top_breweries:
                        if br["brewery"] == brewery_name:
                            br["count"] += 1
                            found_brewery = True
                            break
                    if not found_brewery:
                        top_breweries.append({"brewery": brewery_name, "count": 1})
                    stats["top_breweries"] = sorted(top_breweries, key=lambda x: x["count"], reverse=True)

                new_checkins_processed += 1
                
            except Exception as e:
                print(f"Fehler beim Verarbeiten eines Checkins: {e}")

        # Update JSON wenn es etwas Neues gab
        if new_checkins_processed > 0 or (total_checkins_web and total_checkins_web > current_total):
            print(f"Speichere Updates: {new_checkins_processed} neue Checkins verarbeitet.")
            
            stats.setdefault("overview", {})
            if total_checkins_web:
                stats["overview"]["total_checkins"] = total_checkins_web
            if unique_beers_web:
                stats["overview"]["unique_beers"] = unique_beers_web
                
            stats["overview"]["date_to"] = datetime.now().strftime("%Y-%m-%d")
            stats["overview"]["last_checkin_id"] = highest_id_seen
            
            # Rated Beers neu sortieren
            stats["rated_beers"] = sorted(stats.get("rated_beers", []), key=lambda x: (x.get('avg_rating', 0), x.get('rated_count', 0)), reverse=True)
            
            # Speichern
            tmp = STATS_JSON_PATH + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=4, ensure_ascii=False)
            os.replace(tmp, STATS_JSON_PATH)
            
            print("Successfully updated stats.json!")
            
            # Immer die ML-Pipeline anwerfen, damit das neue Bier in die Listen/Suche rutscht!
            if ml_recommender:
                print("Running Data Science / ML Recommendation pipeline...")
                ml_recommender.run_ml_pipeline()
        else:
            print("Keine neuen Check-ins gefunden.")

    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    update_stats_with_new_beers()