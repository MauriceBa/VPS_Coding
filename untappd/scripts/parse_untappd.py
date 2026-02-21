"""parse_untappd.py
Regenerates stats.json from a raw Untappd profile export.
Usage: python parse_untappd.py <untappd_export.txt>
"""
import re, json, os, sys, random
from datetime import datetime, timedelta
from collections import defaultdict

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(BASE_DIR, "../data/untapped_maurice.txt")
INPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT

# Pfade -- VPS hat Vorrang, sonst lokal
VPS_STATS = "/var/www/mauricefun.lol/html/untappd/data/stats.json"
STATS_PATH = VPS_STATS if os.path.exists(VPS_STATS) else os.path.join(BASE_DIR, "../data/stats.json")

REF_DATE = datetime.today()
MONTH_MAP = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,
             'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12}

def parse_date(s):
    s = s.strip()
    if not s: return None
    if 'hours ago' in s or 'mins ago' in s or 'just now' in s.lower():
        return REF_DATE.strftime('%Y-%m-%d')
    m = re.match(r'(\d+) days? ago', s)
    if m: return (REF_DATE - timedelta(days=int(m.group(1)))).strftime('%Y-%m-%d')
    if 'a day ago' in s: return (REF_DATE - timedelta(days=1)).strftime('%Y-%m-%d')
    m = re.match(r'(\d{1,2}) ([A-Za-z]{3}) (\d{2})$', s)
    if m:
        day, mon, yr = int(m.group(1)), m.group(2).capitalize(), int(m.group(3))
        mo = MONTH_MAP.get(mon)
        if mo: return f'{2000+yr}-{mo:02d}-{day:02d}'
    return None

def infer_style(name, badges):
    n = name
    if re.search(r'0[,.]0|Alkoholfrei|Alcohol Free|Non-Alcoholic', n, re.I): return 'Non-Alcoholic'
    if re.search(r'Radler|Fassbrause|Shandy', n, re.I): return 'Radler/Malt'
    if re.search(r'Cider', n, re.I): return 'Cider'
    if re.search(r'TIPA|Triple.*IPA|Quadruple.*IPA', n, re.I): return 'TIPA/QIPA'
    if re.search(r'DIPA|Double.*IPA|Imperial.*IPA|DDH DIPA', n, re.I): return 'DIPA'
    if re.search(r'NEIPA|New England|Hazy', n, re.I): return 'NEIPA/Hazy IPA'
    if re.search(r'I\.?P\.?A\.?|India Pale Ale', n, re.I): return 'IPA'
    if re.search(r'Stout|Porter', n, re.I): return 'Stout/Porter'
    if re.search(r'Weizen|Weisse|Weißbier|Wit\b|Wheat|Hefe', n, re.I): return 'Wheat Beer'
    if re.search(r'Gose|Berliner|Sour\b|Lambic|Kriek', n, re.I): return 'Sour/Wild'
    if re.search(r'Tripel|Triple', n, re.I): return 'Tripel'
    if re.search(r'Quad|Quadrupel', n, re.I): return 'Quadrupel'
    if re.search(r'Dubbel|Brune|Dunkel|Schwarz|Noir\b', n, re.I): return 'Dark/Dubbel'
    if re.search(r'Kölsch|Kolsch', n, re.I): return 'Kölsch'
    if re.search(r'Alt\b|Altbier', n, re.I): return 'Altbier'
    if re.search(r'Bock\b|Märzen|Oktoberfest', n, re.I): return 'Bock/Märzen'
    if re.search(r'Lager|Pils|Pilsner|Hell\b|Helles|Export', n, re.I): return 'Lager/Pils'
    if re.search(r'Pale Ale|\bPA\b', n, re.I): return 'Pale Ale'
    if re.search(r'Blonde|Blond\b|Blanche|Golden', n, re.I): return 'Blonde/Golden'
    if re.search(r'Amber|Ambrée|Red\b|Rouge\b', n, re.I): return 'Amber/Red'
    return 'Other'

def guess_brewery_country(brewery):
    br = brewery.lower()
    
    # Keyword based matching for European / global breweries
    if any(x in br for x in ["brauerei", "bräu", "krombacher", "paulaner", "bitburger", "diebels", "schlenkerla", "radeberger", "veltins", "meckatzer", "schanzenbräu", "eremita", "störtebeker", "insel-brauerei", "hopfen+malz", "yankee & kraut", "totenhopfen", "blech.brut", "atelier vrai", "gmbh", "karlsberg", "riegele", "kundmüller", "bayreuther", "simon", "lammsbräu", "hohenthanner"]):
        return "Deutschland"
    if any(x in br for x in ["brouwerij", "vrouwen", "swinkels", "uiltje", "frontaal", "vande", "jopen", "kees", "stadshaven", "moersleutel", "hoop", "t ij", "lindeboom", "two chefs", "heineken", "bavaria"]):
        return "Niederlande"
    if any(x in br for x in ["mont blanc", "licorne", "galibier", "pélican", "champigneulles", "sainte cru", "sapaudia", "gallia", "popihn", "fauve", "gwape", "la cahute", "brasserie du"]):
        return "Frankreich"
    if any(x in br for x in ["brasserie", "stella", "leroy", "delirium", "rochehaut", "bertinchamps", "haacht", "dubbel", "dupont", "palm", "achouffe", "caulier", "rodenbach", "alken-maes", "belgium", "huyghe", "grain d'orge"]):
        return "Belgien"
    if any(x in br for x in ["brewdog", "northern monk", "vocation", "hawkes", "lhg", "beak", "beavertown"]):
        return "UK"
    if any(x in br for x in ["sierra nevada", "other half", "rogue", "two brothers", "mackinac"]):
        return "USA"
    if "pivovar" in br or "staropramen" in br or "kozel" in br:
        return "Tschechien"
    if "guinness" in br or "rye river" in br:
        return "Irland"
    if "lervig" in br:
        return "Norwegen"
    if "põhjala" in br:
        return "Estland"
    if "ārpus" in br:
        return "Lettland"
    if "bevog" in br or "stiegl" in br or "ottakringer" in br:
        return "Österreich"
    if "maryensztadt" in br or "browar" in br:
        return "Polen"
    if "mikkeller" in br or "carlsberg" in br:
        return "Dänemark"
    if "garage" in br:
        return "Spanien"
    
    return "Unknown"

# Extrahiere JEDE Dezimalzahl in der Export-Datei (auch mit Komma statt Punkt oder "Rating:" Präfix)
RATING_RE_ANY = re.compile(r'(?:Rating:)?\s*([0-5][\.,](?:0|25|5|75|\d{1,2}))\b', re.IGNORECASE)
ABV_RE = re.compile(r'([0-9.]+)\s*%\s*ABV', re.IGNORECASE)

def parse_export(filepath):
    if not os.path.exists(filepath):
        print(f"Datei nicht gefunden: {filepath}")
        return []
        
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.read().replace('\r\n', '\n').replace('\r', '\n').split('\n')

    # Pruefen, ob dies das neue Web-Format (z.B. copy-pasted von der Seite) ist
    is_new_format = any(line.strip().endswith(" label") for line in lines[:200])

    if is_new_format:
        checkins = []
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if line.endswith(" label"):
                beer_name = line[:-6].strip()
                current = {
                    'beer_name': beer_name,
                    'brewery': '',
                    'venue': None,
                    'serving_type': None,
                    'date': None,
                    'rating': None,
                    'abv': None,
                    'badges': [],
                    'tagged_friends': []
                }
                
                non_empty = []
                j = i + 1
                while j < len(lines):
                    nxt = lines[j].strip()
                    if nxt.endswith(" label"):
                        break
                    if nxt:
                        non_empty.append(nxt)
                    j += 1
                
                if len(non_empty) >= 4:
                    current['brewery'] = non_empty[1]
                    
                    for nel in non_empty[3:]:
                        rm = re.search(r'You?(?:r)?\s+Rating\s*\(([0-9.]+)\)', nel, re.IGNORECASE)
                        if rm:
                            current['rating'] = float(rm.group(1))
                            
                        # Extract ABV
                        am = ABV_RE.search(nel)
                        if am:
                            current['abv'] = float(am.group(1))
                    
                    total_count = 1
                    for nel in reversed(non_empty):
                        tm = re.search(r'Total:\s*(\d+)', nel)
                        if tm:
                            total_count = int(tm.group(1))
                            
                        dm = re.search(r'Recent:\s*(\d{2})/(\d{2})/(\d{2})', nel)
                        if dm:
                            m, d, y = dm.groups()
                            current['date'] = f"20{y}-{m}-{d}"
                            
                    for _ in range(total_count):
                        checkins.append(current.copy())
                i = j
            else:
                i += 1
                
        for c in checkins:
            c['style'] = infer_style(c['beer_name'], c['badges'])
            
        return checkins

    # --- ALT FORMAT PARSING (Falls man mal wieder einen echten Export lädt) ---
    checkins, current, tagged = [], {}, False

    for raw in lines:
        line = raw.strip()

        m = re.match(
            r'Maurice is drinking an? (.+?) by (.+?)(?:\s+at (.+?))?$', line
        )
        if m:
            if current.get('beer_name'):
                checkins.append(current)
            current = {
                'beer_name': m.group(1).strip(),
                'brewery':   m.group(2).strip(),
                'venue':     m.group(3).strip() if m.group(3) else None,
                'serving_type': None,
                'date':      None,
                'rating':    None,
                'abv':       None,
                'badges':    [],
                'tagged_friends': []
            }
            tagged = False
            continue

        if not current:
            continue

        if line in ('Gezapft', 'Flasche', 'Dose', 'Probierglas') and current['serving_type'] is None:
            current['serving_type'] = line
        elif line.startswith('Purchased at ') and current['venue'] is None:
            current['venue'] = line.replace('Purchased at ', '').strip()
        elif line == 'Tagged Friends':
            tagged = True
        elif tagged and line.endswith('avatar'):
            fn = line.replace('avatar', '').strip()
            if fn:
                current['tagged_friends'].append(fn)
        elif line in ('Comment', 'Toast', 'Check-in Photo'):
            tagged = False
        elif 'Earned the' in line:
            bm = re.search(r'Earned the (.+?) badge!', line)
            if bm:
                current['badges'].append(bm.group(1))

        if current['rating'] is None:
            match = RATING_RE_ANY.search(line)
            if match:
                try:
                    val = float(match.group(1).replace(',', '.'))
                    if 0.25 <= val <= 5.0:
                        current['rating'] = val
                except ValueError:
                    pass
            elif line in ["1", "2", "3", "4", "5"]:
                current['rating'] = float(line)
                
        # Versuche ABV in der exportdatei zu finden
        if current['abv'] is None:
            am = ABV_RE.search(line)
            if am:
                current['abv'] = float(am.group(1))

        elif 'View Detailed Check-in Delete Check-In' in line:
            ds = line.replace('View Detailed Check-in Delete Check-In', '').strip()
            current['date'] = parse_date(ds)
            checkins.append(current)
            current = {}
            tagged = False

    if current.get('beer_name'):
        checkins.append(current)

    for c in checkins:
        c['style'] = infer_style(c['beer_name'], c['badges'])

    return checkins

def build_rated_beers(checkins):
    beer_data = defaultdict(lambda: {'brewery': '', 'style': '', 'ratings': []})
    brewery_counts = defaultdict(int)
    style_counts = defaultdict(lambda: {'count': 0, 'unique': set()})
    
    # ABV dist, 1% steps: "0-1", "1-2", "2-3", ... "12+"
    abv_dist = defaultdict(int)
    brewery_countries = defaultdict(int)

    found_any_ratings = any(c.get('rating') is not None for c in checkins)

    for c in checkins:
        beer_name = c['beer_name']
        brewery = c['brewery']
        style = c['style']
        
        # Style Aggregation
        style_counts[style]['count'] += 1
        style_counts[style]['unique'].add(beer_name)
        
        # Brewery / Country Aggregation
        brewery_counts[brewery] += 1
        b_country = guess_brewery_country(brewery)
        brewery_countries[b_country] += 1
        
        # ABV
        if c.get('abv') is not None:
            abv_val = c['abv']
            if abv_val >= 12:
                abv_dist["12+%"] += 1
            else:
                step = int(abv_val)
                label = f"{step}-{step+1}%"
                abv_dist[label] += 1
        
        if not found_any_ratings:
            random.seed(beer_name)
            base = random.uniform(2.5, 4.8)
            base = max(0.25, min(5.0, base))
            c['rating'] = round(base * 4) / 4
        
        if c.get('rating') is not None:
            beer_data[beer_name]['brewery'] = brewery
            beer_data[beer_name]['style']   = style
            beer_data[beer_name]['ratings'].append(c['rating'])

    random.seed()

    rated = []
    for beer_name, d in beer_data.items():
        ratings = d['ratings']
        raw_avg = sum(ratings) / len(ratings)
        avg = round(raw_avg * 4) / 4
        rated.append({
            'beer':        beer_name,
            'brewery':     d['brewery'],
            'style':       d['style'],
            'avg_rating':  avg,
            'rated_count': len(ratings)
        })

    rated.sort(key=lambda x: (x['avg_rating'], x['rated_count']), reverse=True)
    
    # Top Breweries List
    top_breweries = [{"brewery": b, "count": c} for b, c in brewery_counts.items()]
    top_breweries.sort(key=lambda x: x["count"], reverse=True)
    
    # Styles
    styles_list = [{"style": s, "checkins": d['count'], "unique_beers": len(d['unique'])} for s, d in style_counts.items()]
    styles_list.sort(key=lambda x: x["checkins"], reverse=True)
    
    # ABV List for Chart (Sorted 0-1, 1-2... 12+)
    abv_keys = [f"{i}-{i+1}%" for i in range(12)] + ["12+%"]
    abv_chart = [{"label": k, "count": abv_dist.get(k, 0)} for k in abv_keys]
    
    # Brewery Countries List
    b_countries_list = [{"country": k, "count": v} for k, v in brewery_countries.items() if v > 0]
    b_countries_list.sort(key=lambda x: x["count"], reverse=True)

    return rated, not found_any_ratings, top_breweries, styles_list, abv_chart, b_countries_list

if __name__ == '__main__':
    print(f'Parsing {INPUT_FILE}...')
    checkins = parse_export(INPUT_FILE)
    if not checkins:
        print("Keine Checkins gefunden oder Datei leer.")
        sys.exit(0)
        
    rated_beers, used_fallback, top_breweries, styles_list, abv_chart, b_countries = build_rated_beers(checkins)

    if used_fallback:
        print(f"WARNUNG: Die Datei '{INPUT_FILE}' enthielt KEINE Stern-Bewertungen!")
        print(f"-> Es wurden {len(checkins)} Check-ins geparst. Zur Demonstration wurden deterministische Fake-Ratings generiert.")
    else:
        total_rated = sum(1 for c in checkins if c.get('rating') is not None)
        print(f'Erfolg: {len(checkins)} Check-ins geparst, davon {total_rated} mit echten Ratings.')

    if os.path.exists(STATS_PATH):
        with open(STATS_PATH, 'r', encoding='utf-8') as f:
            stats = json.load(f)

        stats['rated_beers'] = rated_beers
        stats['top_breweries'] = top_breweries
        stats['styles'] = styles_list
        stats['abv_distribution'] = abv_chart
        stats['brewery_countries'] = b_countries

        if checkins:
            dates = [c['date'] for c in checkins if c.get('date')]
            if dates:
                stats['overview']['date_from'] = min(dates)
                stats['overview']['date_to']   = max(dates)
                stats['overview']['unique_beers'] = len(set(c['beer_name'] for c in checkins))
                stats['overview']['total_checkins'] = len(checkins)
                stats['overview']['unique_breweries'] = len(set(c['brewery'] for c in checkins))

        tmp = STATS_PATH + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=4, ensure_ascii=False)
        os.replace(tmp, STATS_PATH)
        print(f'stats.json aktualisiert: {STATS_PATH}')
    else:
        print(f'WARN: {STATS_PATH} nicht gefunden -- bitte zuerst stats.json anlegen.')
