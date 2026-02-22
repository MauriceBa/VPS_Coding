import requests
import json
import os
import sys
import re
from bs4 import BeautifulSoup
from datetime import datetime

# Füge Pfad hinzu, damit cron Importe findet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    import ml_recommender
    from parse_untappd import infer_style, guess_brewery_country
    from parse_locations import geocode_address, load_cache, save_cache
except ImportError:
    ml_recommender = None
    infer_style = lambda n, b: "Other"
    guess_brewery_country = lambda b: "Unknown"
    geocode_address = None

# URLs deines Profils
UNTAPPD_URL = "https://untappd.com/user/MauriceDE"
VENUES_URL = "https://untappd.com/user/MauriceDE/venues?sort=recent"

STATS_JSON_PATH = "/var/www/mauricefun.lol/html/untappd/data/stats.json"

if not os.path.exists(STATS_JSON_PATH):
    # Fallback für lokale Ausführung
    STATS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/stats.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
}

def update_venues_from_web(stats):
    try:
        print(f"[{datetime.now()}] Fetching Venues from {VENUES_URL}...")
        response = requests.get(VENUES_URL, headers=HEADERS, timeout=10)
        
        if response.status_code != 200:
            print("Failed to fetch venues.")
            return False
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        existing_heatmap = stats.get("heatmap", [])
        existing_venues_map = {v["venue"]: v for v in existing_heatmap}
        
        cache = {}
        if geocode_address:
            cache = load_cache()
            
        changed = False
        
        # Untappd Listen-Elemente durchsuchen
        for item in soup.select(".item"):
            try:
                name_el = item.select_one(".name a") or item.select_one(".venue-details h2 a")
                if not name_el:
                    # Fallback: Suche ersten Link der zu einem Venue zeigt
                    for a in item.find_all("a"):
                        if "/v/" in a.get("href", "") or "/venue/" in a.get("href", ""):
                            name_el = a
                            break
                            
                if not name_el:
                    continue
                    
                venue_name = name_el.text.strip()
                
                # Checkins (Visits) extrahieren
                visits = 1
                m = re.search(r'(\d+)\s+Check-in', item.text, re.IGNORECASE)
                if m:
                    visits = int(m.group(1))
                    
                # Prüfen ob Venue bekannt und up-to-date ist
                if venue_name in existing_venues_map:
                    if existing_venues_map[venue_name].get("visits", 0) >= visits:
                        continue # Schon aktuell
                    else:
                        existing_venues_map[venue_name]["visits"] = visits
                        changed = True
                        print(f"Update Venue: {venue_name} (jetzt {visits} Besuche)")
                        continue
                        
                # Neues Venue entdeckt!
                print(f"-> NEUES VENUE ENTDECKT: {venue_name}")
                changed = True
                
                # Adresse extrahieren (falls vorhanden, sonst Name als Fallback)
                addr_el = item.select_one(".address")
                address = addr_el.text.strip() if addr_el else venue_name
                
                lat, lon, city, country = None, None, "Unknown", "Unknown"
                
                # Geocoding mit Nominatim API ausführen
                if geocode_address:
                    cache_key = f"{venue_name}::{address}"
                    if cache_key not in cache:
                        print(f"Geocoding neues Venue: {address}")
                        geo = geocode_address(address)
                        if not geo and "," in address:
                            # Fallback: Nur die Stadt probieren
                            geo = geocode_address(address.split(",")[-1].strip())
                        
                        if geo:
                            cache[cache_key] = geo
                        else:
                            cache[cache_key] = {"lat": None, "lon": None, "city": address.split(",")[0], "country": "Unknown"}
                            
                    geo_data = cache.get(cache_key, {})
                    lat = geo_data.get("lat")
                    lon = geo_data.get("lon")
                    city = geo_data.get("city", "Unknown")
                    country = geo_data.get("country", "Unknown")
                
                new_v = {
                    "venue": venue_name,
                    "city": city,
                    "country": country,
                    "visits": visits,
                    "lat": lat,
                    "lon": lon
                }
                existing_heatmap.append(new_v)
                existing_venues_map[venue_name] = new_v
            except Exception as e:
                print(f"Fehler beim Verarbeiten eines Venues: {e}")
            
        if changed:
            if geocode_address:
                save_cache(cache)
                
            # Heatmap nach Besuchen sortieren
            stats["heatmap"] = sorted(existing_heatmap, key=lambda x: x.get("visits", 0), reverse=True)
            
            # Top Venues (Top 6) updaten
            valid_venues = [v for v in stats["heatmap"] if v.get("lat") is not None]
            stats["top_venues"] = valid_venues[:6]
            
            # Länder-Statistik updaten
            country_map = {}
            for v in stats["heatmap"]:
                c = v.get("country", "Unknown")
                if c in ['Deutschland', 'Germany']: c = 'Deutschland'
                elif c == 'France': c = 'Frankreich'
                elif c in ['Nederland', 'The Netherlands']: c = 'Niederlande'
                elif c in ['España', 'Spain']: c = 'Spanien'
                country_map[c] = country_map.get(c, 0) + v.get("visits", 0)
                
            c_list = [{"country": k, "count": v} for k, v in country_map.items() if k != "Unknown"]
            stats["checkin_countries"] = sorted(c_list, key=lambda x: x["count"], reverse=True)
            
            return True
            
        return False
        
    except Exception as e:
        print(f"Error fetching venues: {e}")
        return False

def update_stats_with_new_beers():
    try:
        if not os.path.exists(STATS_JSON_PATH):
            print(f"Error: {STATS_JSON_PATH} not found.")
            return
            
        with open(STATS_JSON_PATH, "r", encoding="utf-8") as f:
            stats = json.load(f)

        print(f"[{datetime.now()}] Fetching {UNTAPPD_URL}...")
        response = requests.get(UNTAPPD_URL, headers=HEADERS, timeout=10)
        
        venues_changed = update_venues_from_web(stats)
        
        if response.status_code != 200:
            print(f"Failed to fetch Untappd. Status Code: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 1. Globale Stats parsen
        stats_blocks = soup.select(".stats .stat")
        total_checkins_web = None
        unique_beers_web = None
        
        for stat in stats_blocks:
            try:
                title_el = stat.select_one(".title")
                val_el = stat.select_one(".stat-val")
                
                if not title_el or not val_el:
                    continue
                    
                title = title_el.text.strip().lower()
                val = val_el.text.strip().replace(",", "")
                
                if "total" in title:
                    total_checkins_web = int(val)
                elif "unique" in title:
                    unique_beers_web = int(val)
            except Exception as e:
                print(f"Fehler beim Parsen der Profil-Statistik: {e}")
            
        current_total = stats.get("overview", {}).get("total_checkins", 0)
        last_checkin_id = stats.get("overview", {}).get("last_checkin_id", 0)
        
        # 2. Neue Biere aus dem Activity Feed (Recent Check-ins) auslesen
        highest_id_seen = last_checkin_id
        new_checkins_processed = 0
        
        for item in soup.select(".item[data-checkin-id]"):
            try:
                cid = int(item["data-checkin-id"])
                if cid <= last_checkin_id:
                    continue
                    
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
                    
                rating = 3.0
                caps = item.select_one(".caps")
                if caps and caps.has_attr("data-rating"):
                    try:
                        rating = float(caps["data-rating"])
                    except ValueError:
                        pass
                
                rated_beers = stats.get("rated_beers", [])
                found_beer = False
                for b in rated_beers:
                    if b["beer"] == beer_name:
                        found_beer = True
                        old_count = b.get("rated_count", 1)
                        old_avg = b.get("avg_rating", rating)
                        new_avg = ((old_avg * old_count) + rating) / (old_count + 1)
                        b["avg_rating"] = round(new_avg * 4) / 4
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

        # Update JSON wenn es neue Biere oder Venues gab
        if new_checkins_processed > 0 or venues_changed or (total_checkins_web and total_checkins_web > current_total):
            print(f"Speichere Updates: {new_checkins_processed} neue Biere/Checkins, Venues changed: {venues_changed}")
            
            stats.setdefault("overview", {})
            if total_checkins_web:
                stats["overview"]["total_checkins"] = total_checkins_web
            if unique_beers_web:
                stats["overview"]["unique_beers"] = unique_beers_web
                
            stats["overview"]["date_to"] = datetime.now().strftime("%Y-%m-%d")
            if highest_id_seen > last_checkin_id:
                stats["overview"]["last_checkin_id"] = highest_id_seen
            
            stats["rated_beers"] = sorted(stats.get("rated_beers", []), key=lambda x: (x.get('avg_rating', 0), x.get('rated_count', 0)), reverse=True)
            
            tmp = STATS_JSON_PATH + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=4, ensure_ascii=False)
            os.replace(tmp, STATS_JSON_PATH)
            
            print("Successfully updated stats.json!")
            
            if ml_recommender:
                print("Running Data Science / ML Recommendation pipeline...")
                ml_recommender.run_ml_pipeline()
        else:
            print("Keine neuen Biere oder Venues gefunden. Alles auf dem neuesten Stand.")

    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    update_stats_with_new_beers()