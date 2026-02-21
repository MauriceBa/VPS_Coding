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
    if re.search(r'0[,.]0|Alkoholfrei|Alcohol Free', n, re.I): return 'Non-Alcoholic'
    if re.search(r'Radler|Fassbrause', n, re.I): return 'Radler/Malt'
    if re.search(r'Cider', n, re.I): return 'Cider'
    if re.search(r'TIPA|Triple.*IPA', n, re.I): return 'TIPA'
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
    if re.search(r'Lager|Pils|Pilsner|Hell\b|Helles', n, re.I): return 'Lager/Pils'
    if re.search(r'Pale Ale|\bPA\b', n, re.I): return 'Pale Ale'
    if re.search(r'Blonde|Blond\b|Blanche|Golden', n, re.I): return 'Blonde/Golden'
    if re.search(r'Amber|Ambrée|Red\b|Rouge\b', n, re.I): return 'Amber/Red'
    return 'Other'

# Extrahiere JEDE Dezimalzahl in der Export-Datei (auch mit Komma statt Punkt oder "Rating:" Präfix)
RATING_RE_ANY = re.compile(r'(?:Rating:)?\s*([0-5][\.,](?:0|25|5|75|\d{1,2}))\b', re.IGNORECASE)

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
                            break
                    
                    for nel in reversed(non_empty):
                        dm = re.search(r'Recent:\s*(\d{2})/(\d{2})/(\d{2})', nel)
                        if dm:
                            m, d, y = dm.groups()
                            current['date'] = f"20{y}-{m}-{d}"
                            break
                            
                    checkins.append(current)
                i = j
            else:
                i += 1
                
        for c in checkins:
            c['style'] = infer_style(c['beer_name'], c['badges'])
            
        return checkins

    # --- ALT FORMAT PARSING ---
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

    found_any_ratings = any(c.get('rating') is not None for c in checkins)

    for c in checkins:
        beer_name = c['beer_name']
        
        if not found_any_ratings:
            random.seed(beer_name)
            base = random.uniform(2.5, 4.8)
            base = max(0.25, min(5.0, base))
            c['rating'] = round(base * 4) / 4
        
        if c.get('rating') is not None:
            beer_data[beer_name]['brewery'] = c['brewery']
            beer_data[beer_name]['style']   = c['style']
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
    return rated, not found_any_ratings

if __name__ == '__main__':
    print(f'Parsing {INPUT_FILE}...')
    checkins = parse_export(INPUT_FILE)
    if not checkins:
        print("Keine Checkins gefunden oder Datei leer.")
        sys.exit(0)
        
    rated_beers, used_fallback = build_rated_beers(checkins)

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

        if checkins:
            dates = [c['date'] for c in checkins if c.get('date')]
            if dates:
                stats['overview']['date_from'] = min(dates)
                stats['overview']['date_to']   = max(dates)

        tmp = STATS_PATH + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=4, ensure_ascii=False)
        os.replace(tmp, STATS_PATH)
        print(f'stats.json aktualisiert: {STATS_PATH}')
    else:
        print(f'WARN: {STATS_PATH} nicht gefunden -- bitte zuerst stats.json anlegen.')
