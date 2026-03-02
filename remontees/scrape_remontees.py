#!/usr/bin/env python3
"""
Remontées Mécaniques Forum Scraper v3
Scrapt Skigebiet- und Lifte-News mit vollständigen Posts und Bildern
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import html
from datetime import datetime, timedelta

BASE_URL = "https://www.remontees-mecaniques.net/forums"
STATIONS_URL = f"{BASE_URL}/index.php?showforum=129"
LIFTS_URL = f"{BASE_URL}/index.php?showforum=220"
OUTPUT_DIR = "/home/ubuntu/projects/mauricefun.lol/html/data"

FRENCH_MONTHS = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
    'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
}

# Globale Session für bessere Performance (Connection Pooling)
GLOBAL_SESSION = requests.Session()
GLOBAL_SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

def parse_french_date(date_str):
    """Parst französische Datumsangaben (relativ und absolut)"""
    date_str = html.unescape(date_str).strip().lower()
    now = datetime.now()
    
    # Heute
    if "aujourd'hui" in date_str or "aujourd" in date_str:
        time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
        if time_match:
            hour, minute = int(time_match.group(1)), int(time_match.group(2))
            return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return now
    
    # Gestern
    if "hier" in date_str:
        time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
        yesterday = now - timedelta(days=1)
        if time_match:
            hour, minute = int(time_match.group(1)), int(time_match.group(2))
            return yesterday.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return yesterday
    
    # "il y a X minutes/heures" (vor X Minuten/Stunden)
    if "il y a" in date_str:
        min_match = re.search(r'(\d+)\s*minute', date_str)
        if min_match:
            minutes = int(min_match.group(1))
            return now - timedelta(minutes=minutes)
        hour_match = re.search(r'(\d+)\s*heure', date_str)
        if hour_match:
            hours = int(hour_match.group(1))
            return now - timedelta(hours=hours)
        if "seconde" in date_str:
            return now

    # Absolutes Datum (z.B. "28 février 2026 - 15:30" oder nur "28 février 2026")
    date_match = re.search(r'(\d{1,2})\s+([a-zûéè]+)\s+(\d{4})', date_str)
    if date_match:
        day = int(date_match.group(1))
        month_str = date_match.group(2)
        year = int(date_match.group(3))
        
        month = FRENCH_MONTHS.get(month_str, 1)
        
        time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
        hour, minute = 0, 0
        if time_match:
            hour, minute = int(time_match.group(1)), int(time_match.group(2))
            
        try:
            return datetime(year, month, day, hour, minute)
        except ValueError:
            pass
    
    return None

def get_session():
    """Gibt die globale Session zurück"""
    return GLOBAL_SESSION

def get_page_content(url):
    """Holt Seiteninhalt mit korrekter Kodierung"""
    session = get_session()
    resp = session.get(url, timeout=30)
    return resp.content.decode('latin-1')

def clean_text(text):
    """Bereinigt Text von überflüssigen Leerzeichen"""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def translate_french_to_german(text):
    """Übersetzt französische Texte ins Deutsche"""
    
    # 1. API-basierte Übersetzung für saubere, grammatikalisch korrekte deutsche Sätze
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "fr",
            "tl": "de",
            "dt": "t",
            "q": text
        }
        # Verwende get_session für besseres Handling
        resp = get_session().get(url, params=params, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            translated = "".join(item[0] for item in data[0] if item[0])
            if translated and len(translated) > 0:
                return translated
    except Exception as e:
        print(f"API-Übersetzung fehlgeschlagen, nutze Fallback: {e}")
    
    # 2. Fallback Wörterbuch - sortiert nach Länge (längste zuerst für korrekte Ersetzung)
    translations = {
        # Häufige Phrasen & Fixes für Apostrophe
        "c'est": "es ist",
        "n'est": "ist nicht",
        "qu'ils": "dass sie",
        "qu'il": "dass er",
        "d'un": "von einem",
        "d'une": "von einer",
        "l'on": "man",
        "il y a": "vor",
        "aujourd'hui": "heute",
        
        # Phrasen (zuerst ersetzen)
        'remise en service': 'Wiederinbetriebnahme',
        'enquête publique': 'öffentliche Anhörung',
        'remontée mécanique': 'Aufstiegshilfe',
        'remontées mécaniques': 'Aufstiegshilfen',
        'domaine skiable': 'Skigebiet',
        'gare aval': 'Talstation',
        'gare amont': 'Bergstation',
        'piste verte': 'blaue Piste',
        'piste bleue': 'blaue Piste',
        'piste rouge': 'rote Piste',
        'piste noire': 'schwarze Piste',
        
        # Substantive
        'construction': 'Bau',
        'projet': 'Projekt',
        'projets': 'Projekte',
        'rénovation': 'Renovierung',
        'démolition': 'Abriss',
        'remplacement': 'Ersatz',
        'ouverture': 'Eröffnung',
        'fermeture': 'Schließung',
        'retard': 'Verzögerung',
        'avancement': 'Fortschritt',
        'gare': 'Station',
        'pylône': 'Pylon',
        'cabine': 'Kabine',
        'télécabine': 'Gondelbahn',
        'télésiège': 'Sessellift',
        'téléski': 'Schlepplift',
        'téléphérique': 'Seilbahn',
        'piste': 'Piste',
        'pistes': 'Pisten',
        'neige': 'Schnee',
        'dameuse': 'Pistenraupe',
        'été': 'Sommer',
        'hiver': 'Winter',
        'saison': 'Saison',
        'année': 'Jahr',
        'mois': 'Monat',
        'semaine': 'Woche',
        'jour': 'Tag',
        'hier': 'gestern',
        'demain': 'morgen',
        'permis': 'Genehmigung',
        'autorisation': 'Genehmigung',
        'étude': 'Studie',
        'enquête': 'Anhörung',
        'travaux': 'Arbeiten',
        'chantier': 'Baustelle',
        'installation': 'Anlage',
        'démontage': 'Abbau',
        'montage': 'Aufbau',
        'massif': 'Massiv',
        'vallée': 'Tal',
        'sommet': 'Gipfel',
        'altitude': 'Höhe',
        'débit': 'Kapazität',
        'longueur': 'Länge',
        'chose': 'Sache',
        'question': 'Frage',
        'argent': 'Geld',
        'recherche': 'Suche',
        
        # Verben
        'construit': 'gebaut',
        'construire': 'bauen',
        'projeté': 'geplant',
        'remplacé': 'ersetzt',
        'remplacer': 'ersetzen',
        'ouvert': 'geöffnet',
        'ouvrir': 'öffnen',
        'fermé': 'geschlossen',
        'fermer': 'schließen',
        'terminé': 'fertiggestellt',
        'commencé': 'begonnen',
        'commencer': 'beginnen',
        'prévu': 'geplant',
        'reporté': 'verschoben',
        'annulé': 'abgesagt',
        'confirmé': 'bestätigt',
        'être': 'sein',
        'est': 'ist',
        'sont': 'sind',
        'avoir': 'haben',
        'a': 'hat',
        'faire': 'machen',
        'fait': 'gemacht',
        'dire': 'sagen',
        'dit': 'gesagt',
        'voir': 'sehen',
        'voit': 'sieht',
        'savoir': 'wissen',
        'sait': 'weiß',
        'pouvoir': 'können',
        'peut': 'kann',
        'devoir': 'müssen',
        'doit': 'muss',
        'aller': 'gehen',
        'va': 'geht',
        'venir': 'kommen',
        'vient': 'kommt',
        'prendre': 'nehmen',
        'prend': 'nimmt',
        'donner': 'geben',
        'donne': 'gibt',
        'trouver': 'finden',
        'trouve': 'findet',
        'demander': 'fragen',
        'demande': 'fragt',
        'rester': 'bleiben',
        'reste': 'bleibt',
        'répondre': 'antworten',
        'répond': 'antwortet',
        
        # Adjektive & Adverbien
        'nouveau': 'neu',
        'nouvelle': 'neue',
        'ancien': 'alt',
        'ancienne': 'alte',
        'grand': 'groß',
        'grande': 'große',
        'petit': 'klein',
        'petite': 'kleine',
        'bon': 'gut',
        'bonne': 'gute',
        'mauvais': 'schlecht',
        'beau': 'schön',
        'belle': 'schöne',
        'haut': 'hoch',
        'haute': 'hohe',
        'bas': 'niedrig',
        'basse': 'niedrige',
        'long': 'lang',
        'longue': 'lange',
        'facile': 'einfach',
        'difficile': 'schwierig',
        'possible': 'möglich',
        'probable': 'wahrscheinlich',
        'certain': 'gewiss',
        'très': 'sehr',
        'bien': 'gut',
        'plus': 'mehr',
        'pas': 'nicht',
        
        # Artikel/Präpositionen
        'le': 'der',
        'la': 'die',
        'les': 'die',
        'un': 'ein',
        'une': 'eine',
        'des': 'einige',
        'du': 'vom',
        'de': 'von',
        'et': 'und',
        'ou': 'oder',
        'mais': 'aber',
        'donc': 'deshalb',
        'dans': 'in',
        'sur': 'auf',
        'avec': 'mit',
        'pour': 'für',
        'par': 'durch',
        'sans': 'ohne',
        'sous': 'unter',
        'vers': 'gegen',
        'avant': 'vor',
        'après': 'nach',
        'depuis': 'seit',
        'pendant': 'während',
        'chez': 'bei',
        'contre': 'gegen',
        'entre': 'zwischen',
        'à': 'an',
        
        # Pronomen
        'qui': 'der/die/das',
        'que': 'dass',
        'quoi': 'was',
        'ce': 'dies',
        'cette': 'diese',
        'ces': 'diese',
        'mon': 'mein',
        'ton': 'dein',
        'son': 'sein',
        'notre': 'unser',
        'votre': 'euer',
        'leur': 'ihr',
        'on': 'man',
        'ils': 'sie',
    }
    
    # Sortiere nach Länge (längste zuerst), damit z.B. "c'est" vor "est" ersetzt wird
    sorted_keys = sorted(translations.keys(), key=len, reverse=True)
    
    for fr in sorted_keys:
        de = translations[fr]
        
        # BUGFIX: Standard-\b scheitert bei französischen Wörtern mit Apostroph (z.B. "c'est", "l'est").
        # Lösung: Ein negativer Lookbehind/Lookahead, der verhindert, dass das Wort mitten im Satz
        # nach einem Apostroph ersetzt wird (wie in C'ist statt C'est), außer das gesuchte Wort enthält selbst eins.
        
        # Pattern escaped den französischen Suchbegriff
        fr_esc = re.escape(fr)
        
        # Sicherstellen, dass das Wort nicht Teil eines anderen Wortes ist
        # (?<![a-zA-ZÀ-ÿ']) stellt sicher, dass links kein Buchstabe oder Apostroph ist
        # (?![a-zA-ZÀ-ÿ]) stellt sicher, dass rechts kein Buchstabe ist
        pattern = r'(?<![a-zA-ZÀ-ÿ\'])' + fr_esc + r'(?![a-zA-ZÀ-ÿ])'
        
        text = re.sub(pattern, de, text, flags=re.IGNORECASE)
    
    return text

def extract_summaries(posts, max_summaries=5):
    """Extrahiert Stichpunkte aus allen Posts zusammen"""
    if not posts:
        return []
    
    # Alle Posts kombinieren
    all_text = " ".join([post['content'] for post in posts])
    all_text = clean_text(all_text)
    
    # In Sätze aufteilen und filtern
    sentences = re.split(r'[.!?]+', all_text)
    
    # Sätze mit Substanz finden (50-180 Zeichen)
    candidates = []
    for sentence in sentences:
        sentence = sentence.strip()
        if 50 <= len(sentence) <= 180:
            # Filtere Zitate und Meta-Text
            if not any(sentence.lower().startswith(x) for x in ['dit', 'le ', 'la ', 'les ', 'un ', 'une ']):
                if ':' not in sentence[:30]:  # Keine Zeitstempel
                    candidates.append(sentence)
    
    # Nach Länge sortieren (mehr Substanz)
    candidates.sort(key=len, reverse=True)
    
    # Beste Sätze auswählen
    selected = []
    used_words = set()
    
    for sentence in candidates:
        if len(selected) >= max_summaries:
            break
        
        # Prüfe auf neue Information
        words = set(re.findall(r'\b[a-zA-ZÀ-ÿ]{5,}\b', sentence.lower()))
        if not words.issubset(used_words):
            selected.append(sentence)
            used_words.update(words)
    
    # Übersetzen
    summaries = []
    for sentence in selected[:max_summaries]:
        translated = translate_french_to_german(sentence)
        translated = clean_text(translated)
        
        # Entferne nur noch Satzanfänge, die den Stichpunkt unflüssig machen, 
        # aber keine Verben oder Pronomen (da die API jetzt echte Sätze liefert)
        # Bsp: "Der neue Lift" -> "Neuer Lift" (optional, aber für Stichpunkte oft gut)
        translated = re.sub(r'^(der|die|das|ein|eine)\s+', '', translated, flags=re.IGNORECASE)
        
        if len(translated) > 20: # Limit leicht gesenkt, da deutsche Übersetzungen kompakter sein können
            translated = translated[0].upper() + translated[1:]
            summaries.append(translated)
    
    return summaries

def scrape_forum_list(url):
    """Scraped die Thread-Liste aus einem Forum"""
    try:
        html_content = get_page_content(url)
        soup = BeautifulSoup(html_content, 'html.parser')
        
        threads = []
        seen_topics = set()
        
        tables = soup.find_all('table')
        if not tables:
            return []
        
        main_table = max(tables, key=lambda t: len(t.find_all('tr')))
        rows = main_table.find_all('tr')
        
        for row in rows:
            tds = row.find_all('td')
            if len(tds) < 5:
                continue
            
            # Topic finden
            topic_td = tds[1]
            best_text = ''
            topic_link = None
            
            for link in topic_td.find_all('a', href=True):
                href = link.get('href', '')
                text = link.get_text(strip=True)
                if 'showtopic=' in href and 'view=get' not in href:
                    if len(text) > len(best_text):
                        topic_link = link
                        best_text = text
            
            if not topic_link:
                continue
            
            href = topic_link.get('href', '')
            title = best_text
            
            if not title or len(title) < 5 or title.startswith('Liste des'):
                continue
            
            topic_match = re.search(r'showtopic=(\d+)', href)
            if not topic_match:
                continue
            
            topic_id = topic_match.group(1)
            if topic_id in seen_topics or topic_id == '36657':
                continue
            seen_topics.add(topic_id)
            
            # URL bereinigen
            clean_url = re.sub(r'\?s=[a-f0-9]+&', '?', href)
            clean_url = re.sub(r'&s=[a-f0-9]+', '', clean_url)
            if clean_url.startswith('//'):
                clean_url = 'https:' + clean_url
            elif clean_url.startswith('/'):
                clean_url = BASE_URL + clean_url
            elif not clean_url.startswith('http'):
                clean_url = BASE_URL + '/' + clean_url
            
            # Zeit finden
            last_post_td = tds[4]
            last_post_time = None
            
            for link in last_post_td.find_all('a', href=True):
                if 'view=getlastpost' in link.get('href', ''):
                    time_text = link.get_text(strip=True)
                    if time_text:
                        last_post_time = parse_french_date(time_text)
                        if last_post_time:
                            break
            
            # Letzte 7 Tage
            if last_post_time:
                time_diff = datetime.now() - last_post_time
                if time_diff <= timedelta(days=7):
                    threads.append({
                        'id': topic_id,
                        'title': title,
                        'url': clean_url,
                        'last_post': last_post_time.isoformat(),
                        'last_post_display': last_post_time.strftime('%d.%m. %H:%M')
                    })
                    print(f"  + [{topic_id}] {title[:45]}... ({last_post_time.strftime('%d.%m.%H:%M')})")
        
        return threads
    except Exception as e:
        print(f"Fehler beim Scrapen {url}: {e}")
        import traceback
        traceback.print_exc()
        return []

def scrape_thread_posts(url, days_back=7):
    """Scraped Posts und Bilder aus einem Thread mit Pagination"""
    try:
        posts = []
        images = []
        cutoff_time = datetime.now() - timedelta(days=days_back)
        
        # Starte mit letzter Seite
        if '?' in url:
            current_url = url + '&view=getlastpost'
        else:
            current_url = url + '?view=getlastpost'
        
        page_count = 0
        max_pages = 10
        oldest_post_time = datetime.now()
        
        while page_count < max_pages:
            page_count += 1
            print(f"    Seite {page_count}...")
            
            html_content = get_page_content(current_url)
            soup = BeautifulSoup(html_content, 'html.parser')
            
            post_containers = soup.find_all('div', class_=lambda x: x and 'post' in str(x).lower() if x else False)
            
            page_has_recent = False
            
            for post in post_containers:
                # Zeit finden
                time_found = None
                abbr = post.find('abbr', class_='published')
                if abbr:
                    title = abbr.get('title', '')
                    if title:
                        try:
                            time_found = datetime.fromisoformat(title.replace('Z', '+00:00').replace('+00:00', ''))
                        except:
                            pass
                
                if not time_found:
                    continue
                
                if time_found < oldest_post_time:
                    oldest_post_time = time_found
                
                content_div = post.find('div', class_=lambda x: x and 'content' in str(x).lower() if x else False)
                if not content_div:
                    continue
                
                # Bilder extrahieren (gefiltert)
                for img in content_div.find_all('img'):
                    img_src = img.get('src', '')
                    if not img_src or img_src.startswith('data:'):
                        continue
                    
                    # Filter: Profilbilder
                    if 'showuser=' in img_src:
                        continue
                    
                    # Filter: Smileys/Icons (klein)
                    width = img.get('width', '')
                    height = img.get('height', '')
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w < 100 or h < 100:
                                continue
                        except:
                            pass
                    
                    # Filter: Pfade
                    lower_src = img_src.lower()
                    if any(x in lower_src for x in ['smile', 'icon', 'emoji', 'style_images', 'button', 'arrow']):
                        continue
                    
                    # Nur echte Bildformate
                    if not any(lower_src.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                        if '?' in lower_src:
                            base = lower_src.split('?')[0]
                            if not any(base.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                                continue
                        else:
                            continue
                    
                    # URL absolut machen
                    if img_src.startswith('/'):
                        img_src = BASE_URL + img_src
                    elif not img_src.startswith('http'):
                        img_src = BASE_URL + '/' + img_src
                    
                    if 'remontees-mecaniques.net' in img_src:
                        images.append({'url': img_src, 'alt': img.get('alt', '')})
                
                # Posts im Zeitfenster
                if time_found >= cutoff_time:
                    page_has_recent = True
                    text = content_div.get_text(separator=' ', strip=True)
                    text = clean_text(text)
                    text = re.sub(r'Quote[\s\S]*?End Quote', '', text, flags=re.IGNORECASE)
                    text = clean_text(text)
                    
                    if len(text) > 30:
                        posts.append({'time': time_found.isoformat(), 'content': text})
            
            # Weiter zurück?
            if oldest_post_time >= cutoff_time and page_has_recent:
                prev_link = None
                
                # Pagination-Link suchen
                for link in soup.find_all('a', href=True):
                    href = link.get('href', '')
                    text = link.get_text(strip=True).lower()
                    if 'showtopic=' in href and ('st=' in href or 'view=getlastpost' in href):
                        if any(x in text for x in ['préc', 'prev', 'vorher', '<']):
                            st_match = re.search(r'st=(\d+)', href)
                            if st_match:
                                st_val = int(st_match.group(1))
                                current_st = 0
                                current_st_match = re.search(r'st=(\d+)', current_url)
                                if current_st_match:
                                    current_st = int(current_st_match.group(1))
                                
                                if st_val < current_st or 'view=getlastpost' in current_url:
                                    prev_link = href
                                    break
                
                # Manuelle Pagination
                if not prev_link:
                    st_match = re.search(r'st=(\d+)', current_url)
                    if st_match:
                        current_st = int(st_match.group(1))
                        new_st = max(0, current_st - 20)
                        prev_link = re.sub(r'st=\d+', f'st={new_st}', current_url)
                        prev_link = prev_link.replace('&view=getlastpost', '')
                    elif 'view=getlastpost' in current_url:
                        prev_link = current_url.replace('&view=getlastpost', '&st=20')
                
                if prev_link:
                    if prev_link.startswith('//'):
                        prev_link = 'https:' + prev_link
                    elif prev_link.startswith('/'):
                        prev_link = BASE_URL + prev_link
                    elif not prev_link.startswith('http'):
                        prev_link = BASE_URL + '/' + prev_link
                    
                    current_url = prev_link
                    continue
            
            break
        
        # Bilder deduplizieren
        unique_images = list({i['url']: i for i in images}.values())[:15]
        
        print(f"    Total: {len(posts)} Posts, {len(unique_images)} Bilder")
        return {'posts': posts, 'images': unique_images}
        
    except Exception as e:
        print(f"Fehler beim Scrapen Thread {url}: {e}")
        import traceback
        traceback.print_exc()
        return {'posts': [], 'images': []}

def process_forum(url, category_name, days_back=7):
    """Verarbeitet ein Forum"""
    print(f"Scraping {category_name}...")
    threads = scrape_forum_list(url)
    
    results = []
    for thread in threads[:15]:
        print(f"  → {thread['title'][:40]}...")
        data = scrape_thread_posts(thread['url'], days_back=days_back)
        
        posts = data['posts']
        images = data['images']
        
        if posts:
            summaries = extract_summaries(posts, max_summaries=5)
        else:
            summaries = []
        
        results.append({
            'id': thread['id'],
            'name': thread['title'],
            'url': thread['url'],
            'last_update': thread['last_post_display'],
            'summaries': summaries if summaries else ['Neue Beiträge im Forum'],
            'images': images
        })
    
    return results

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"=== Remontées Scraper {datetime.now().strftime('%Y-%m-%d %H:%M')} ===\n")
    
    # Immer 7 Tage scrapen
    stations = process_forum(STATIONS_URL, "Stationen", days_back=7)
    print()
    lifts = process_forum(LIFTS_URL, "Lifte", days_back=7)
    print()
    
    data = {
        'last_updated': datetime.now().isoformat(),
        'last_updated_display': datetime.now().strftime('%d.%m.%Y %H:%M'),
        'stations': stations,
        'lifts': lifts
    }
    
    output_file = os.path.join(OUTPUT_DIR, 'remontees_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Gespeichert: {output_file}")
    print(f"   Stationen: {len(stations)}, Lifte: {len(lifts)}")

if __name__ == '__main__':
    main()