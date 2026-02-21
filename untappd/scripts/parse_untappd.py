"""parse_untappd.py
Regenerates untappd_maurice.db and CSV exports from a raw Untappd profile export.
Usage: python parse_untappd.py <untappd_export.txt>
"""
import re, sqlite3, json, os, sys, pandas as pd
from datetime import datetime, timedelta

INPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else 'untappd-Maurice.txt'
OUTPUT_DB  = 'data/untappd_maurice.db'
OUTPUT_JSON = 'data/untappd_data.json'
OUTPUT_CSV_DIR = 'data/csv'

REF_DATE = datetime(2026, 2, 21)  # update to today when re-running
MONTH_MAP = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,
             'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12}

def parse_date(s):
    s = s.strip()
    if not s: return None
    if 'hours ago' in s or 'mins ago' in s: return REF_DATE.strftime('%Y-%m-%d')
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
    if re.search(r'0[,.]0|Alkoholfrei|Alcohol Free', name, re.I): return 'Non-Alcoholic'
    if re.search(r'Radler|Fassbrause', name, re.I): return 'Radler/Malt'
    if re.search(r'Cider', name, re.I): return 'Cider'
    if re.search(r'TIPA|Triple.*IPA', name, re.I): return 'TIPA'
    if re.search(r'DIPA|Double.*IPA|Imperial.*IPA|DDH DIPA', name, re.I): return 'DIPA'
    if re.search(r'NEIPA|New England|Hazy', name, re.I): return 'NEIPA/Hazy IPA'
    if re.search(r'I\.?P\.?A\.?|India Pale Ale', name, re.I): return 'IPA'
    if re.search(r'Stout|Porter', name, re.I): return 'Stout/Porter'
    if re.search(r'Weizen|Weisse|Wei\u00dfbier|Wit\b|Wheat|Hefe', name, re.I): return 'Wheat Beer'
    if re.search(r'Gose|Berliner|Sour\b|Lambic|Kriek', name, re.I): return 'Sour/Wild'
    if re.search(r'Tripel|Triple', name, re.I): return 'Tripel'
    if re.search(r'Quad|Quadrupel', name, re.I): return 'Quadrupel'
    if re.search(r'Dubbel|Brune|Dunkel|Schwarz|Noir\b', name, re.I): return 'Dark/Dubbel'
    if re.search(r'K\u00f6lsch|Kolsch', name, re.I): return 'K\u00f6lsch'
    if re.search(r'Alt\b|Altbier', name, re.I): return 'Altbier'
    if re.search(r'Bock\b|M\u00e4rzen|Oktoberfest', name, re.I): return 'Bock/M\u00e4rzen'
    if re.search(r'Lager|Pils|Pilsner|Hell\b|Helles', name, re.I): return 'Lager/Pils'
    if re.search(r'Pale Ale|\bPA\b', name, re.I): return 'Pale Ale'
    if re.search(r'Blonde|Blond\b|Blanche|Golden', name, re.I): return 'Blonde/Golden'
    if re.search(r'Amber|Ambr\u00e9e|Red\b|Rouge\b', name, re.I): return 'Amber/Red'
    return 'Other'

if __name__ == '__main__':
    with open(INPUT_FILE, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.read().replace('\r\n','\n').replace('\r','\n').split('\n')

    checkins, current, tagged = [], {}, False
    for raw in lines:
        line = raw.strip()
        m = re.match(r'Maurice is drinking an? (.+?) by (.+?)(?:\s+at (.+?))?$', line)
        if m:
            if current.get('beer_name'): checkins.append(current)
            current = {'beer_name':m.group(1).strip(),'brewery':m.group(2).strip(),
                       'venue':m.group(3).strip() if m.group(3) else None,
                       'serving_type':None,'date':None,'badges':[],'tagged_friends':[]}
            tagged = False; continue
        if not current: continue
        if line in ['Gezapft','Flasche','Dose','Probierglas'] and current['serving_type'] is None:
            current['serving_type'] = line
        elif line.startswith('Purchased at ') and current['venue'] is None:
            current['venue'] = line.replace('Purchased at ','').strip()
        elif line == 'Tagged Friends': tagged = True
        elif tagged and line.endswith('avatar'):
            fn = line.replace('avatar','').strip()
            if fn: current['tagged_friends'].append(fn)
        elif line in ['Comment','Toast','Check-in Photo']: tagged = False
        elif 'Earned the' in line:
            bm = re.search(r'Earned the (.+?) badge!', line)
            if bm: current['badges'].append(bm.group(1))
        elif 'View Detailed Check-in Delete Check-In' in line:
            ds = line.replace('View Detailed Check-in Delete Check-In','').strip()
            current['date'] = parse_date(ds)
            checkins.append(current); current = {}; tagged = False
    if current.get('beer_name'): checkins.append(current)
    for c in checkins:
        c['style'] = infer_style(c['beer_name'], c['badges'])
    print(f'Parsed {len(checkins)} check-ins')
    # Build DB and CSVs here (see full script in README)
