"""parse_locations.py
Updates stats.json with precise locations and heatmap data from untapped_locations.txt
Usage: python parse_locations.py [untapped_locations.txt]
"""
import json
import os
import sys
import time
import re
import urllib.request
import urllib.parse
from collections import defaultdict

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(BASE_DIR, "../data/untapped_locations.txt")
INPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT

VPS_STATS = "/home/ubuntu/projects/mauricefun.lol/html/untappd/data/stats.json"
STATS_PATH = VPS_STATS if os.path.exists(VPS_STATS) else os.path.join(BASE_DIR, "../data/stats.json")

CACHE_FILE = os.path.join(BASE_DIR, "../data/location_cache.json")

# Noise lines to ignore from the copy-pasted web text
NOISE_LINES = [
    "Untappd", "Blog Top Rated Insiders Help Shop", "Find a beer, brewery or bar...",
    "Venue History", "Sort & Filter", "Filter Category", "All", "Sort menu by",
    "Check-Ins (viel bis wenig)", "Check-Ins (wenig bis viel)",
    "Veranstaltungsort Namen (absteigend)", "Veranstaltungsort Namen (aufsteigend)",
    "Datum (alt bis neu)", "Letzte Check-Ins", "Datum (neu bis alt)",
    "Clear All Sorting & Filters", "Maurice", "MauriceDE", "Aachen", "Total",
    "Unique", "Badges", "Friends", "See All Badges", "Top Beers", "See All Beers",
    "Untappd for Business", "Untappd for Business Blog", "Breweries", "Shop",
    "Support", "Careers", "API", "Terms", "Privacy", "Cookie Policy",
    "Do Not Sell My Personal Information", "Icon twitter Icon facebook Icon instagram"
]

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=4, ensure_ascii=False)

def geocode_address(address):
    # Short text bypass
    if address in ["NC", "Deutschland", "España", "Unknown"]:
        return None
        
    # Rate limit protection for Nominatim (max 1 req/sec)
    time.sleep(1.2) 
    
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(address)}&format=json&addressdetails=1&limit=1"
    req = urllib.request.Request(url, headers={'User-Agent': 'MauriceUntappdHeatmapBot/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            if not data:
                return None
            res = data[0]
            lat = float(res['lat'])
            lon = float(res['lon'])
            addr = res.get('address', {})
            city = addr.get('city', addr.get('town', addr.get('village', addr.get('state', 'Unknown'))))
            country = addr.get('country', 'Unknown')
            return {
                "lat": lat,
                "lon": lon,
                "city": city,
                "country": country
            }
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None

def parse_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []
        
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        raw_lines = [L.strip() for L in f.read().split('\n') if L.strip()]
        
    venues = []
    current_block = []
    
    # Filter noise
    lines = []
    for line in raw_lines:
        if line in NOISE_LINES or "avatar" in line or line.startswith("Recappd") or "badge logo" in line:
            continue
        lines.append(line)
    
    for line in lines:
        current_block.append(line)
        if line.startswith("Check-ins:"):
            try:
                checkins = int(line.replace("Check-ins:", "").strip())
            except ValueError:
                checkins = 1
                
            name = current_block[0].replace(" Verified", "").strip()
            vtype = current_block[1] if len(current_block) > 1 else ""
            
            address = ""
            for i in range(2, len(current_block)):
                if current_block[i].startswith("First Visit:") or current_block[i].startswith("Last Visit:") or current_block[i].startswith("Check-ins:"):
                    continue
                address = current_block[i]
                break
                
            venues.append({
                'name': name,
                'type': vtype,
                'address': address,
                'checkins': checkins
            })
            current_block = []
            
    return venues

def run():
    print(f"Parsing {INPUT_FILE}...")
    venues = parse_file(INPUT_FILE)
    if not venues:
        print("No venues found or empty file.")
        return
        
    print(f"Found {len(venues)} venues.")
    cache = load_cache()
    
    heatmap_data = []
    checkin_countries_map = defaultdict(int)
    
    # Sort by checkins
    venues.sort(key=lambda x: x['checkins'], reverse=True)
    
    for v in venues:
        name = v['name']
        original_address = v['address']
        checkins = v['checkins']
        
        # Determine actual query address
        address = original_address
        if "Untappd at Home" in name or "Zuhause" in name:
            address = "Lothringerstraße 59, Aachen"
            
        if not address or address == "NC":
            address = "Aachen, Nordrhein-Westfalen"
            
        cache_key = f"{name}::{address}"
        
        if cache_key not in cache:
            print(f"Geocoding: {name} -> {address}")
            geo = geocode_address(address)
            
            # Fallback if no result found and there is a comma (usually separating street and city)
            if not geo and "," in address:
                city_part = address.split(",")[-1].strip()
                print(f"  Fallback geocoding city: {city_part}")
                geo = geocode_address(city_part)
                
            if geo:
                cache[cache_key] = geo
            else:
                # Store an empty object to avoid re-querying failures constantly
                city_fallback = address.split(',')[0] if address else "Unknown"
                country_fallback = "Deutschland" if "Nordrhein-Westfalen" in address or "Aachen" in address else "Unknown"
                if "France" in address or "Frankreich" in address: country_fallback = "Frankreich"
                if "España" in address: country_fallback = "Spanien"
                
                cache[cache_key] = {"lat": None, "lon": None, "city": city_fallback, "country": country_fallback}
                
        geo = cache[cache_key]
        
        item = {
            "venue": name,
            "city": geo.get("city", "Unknown"),
            "country": geo.get("country", "Unknown"),
            "visits": checkins,
            "lat": geo.get("lat"),
            "lon": geo.get("lon")
        }
        heatmap_data.append(item)
        
        # Aggregate check-in country visits
        # Standardize country names slightly
        c_name = item['country']
        if c_name == 'Deutschland' or c_name == 'Germany': c_name = 'Deutschland'
        elif c_name == 'France': c_name = 'Frankreich'
        elif c_name == 'Nederland' or c_name == 'The Netherlands': c_name = 'Niederlande'
        elif c_name == 'Österreich' or c_name == 'Austria': c_name = 'Österreich'
        elif c_name == 'België / Belgique / Belgien' or c_name == 'Belgium': c_name = 'Belgien'
        elif c_name == 'España' or c_name == 'Spain': c_name = 'Spanien'
        
        checkin_countries_map[c_name] += checkins
        
    save_cache(cache)
    
    # Generate Top 6 Venues for the overview grid (prioritizing high visits, keeping names short)
    valid_venues = [h for h in heatmap_data if h['lat'] is not None]
    top_venues = valid_venues[:6] if len(valid_venues) >= 6 else valid_venues
    
    # Transform country map to sorted list
    checkin_countries_list = [{"country": k, "count": v} for k, v in checkin_countries_map.items()]
    checkin_countries_list.sort(key=lambda x: x["count"], reverse=True)
    
    if os.path.exists(STATS_PATH):
        with open(STATS_PATH, 'r', encoding='utf-8') as f:
            stats = json.load(f)
            
        stats['heatmap'] = heatmap_data
        stats['top_venues'] = top_venues
        stats['checkin_countries'] = checkin_countries_list
        
        tmp = STATS_PATH + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=4, ensure_ascii=False)
        os.replace(tmp, STATS_PATH)
        print(f"stats.json updated successfully with {len(heatmap_data)} heatmap locations: {STATS_PATH}")
    else:
        print(f"WARN: {STATS_PATH} not found. Ensure stats.json exists before running.")

if __name__ == '__main__':
    run()
