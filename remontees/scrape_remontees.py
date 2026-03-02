#!/usr/bin/env python3
"""
Remontées Mécaniques Forum Scraper v2
Scrapt Skigebiet- und Lifte-News mit vollständigen Posts und Bildern
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import html
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse

BASE_URL = "https://www.remontees-mecaniques.net/forums"
STATIONS_URL = f"{BASE_URL}/index.php?showforum=129"
LIFTS_URL = f"{BASE_URL}/index.php?showforum=220"
OUTPUT_DIR = "/home/ubuntu/projects/mauricefun.lol/html/data"

def parse_french_date(date_str):
    """Parst französische Datumsangaben"""
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
    
    return None

def get_session():
    """Erstellt eine Session mit Headern"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    return session

def get_page_content(url):
    """Holt Seiteninhalt mit korrekter Kodierung"""
    session = get_session()
    resp = session.get(url, timeout=30)
    # Das Forum nutzt eigentlich Latin-1 (ISO-8859-1)
    return resp.content.decode('latin-1')

def clean_text(text):
    """Bereinigt Text von überflüssigen Leerzeichen"""
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def translate_french_to_german(text):
    """Übersetzt französische Fachbegriffe ins Deutsche"""
    
    # Wörterbuch für Fachbegriffe
    translations = {
        # Grundlegende Begriffe
        'construction': 'Bau',
        'projet': 'Projekt',
        'projets': 'Projekte',
        'nouveau': 'neu',
        'nouvelle': 'neu',
        'nouveaux': 'neue',
        'rénovation': 'Renovierung',
        'renovation': 'Renovierung',
        'démolition': 'Abriss',
        'demolition': 'Abriss',
        'remplacement': 'Ersatz',
        'remplace': 'ersetzt',
        'remplacé': 'ersetzt',
        'ouverture': 'Eröffnung',
        'ouvert': 'geöffnet',
        'ouverte': 'geöffnet',
        'fermeture': 'Schließung',
        'fermé': 'geschlossen',
        'fermée': 'geschlossen',
        'retard': 'Verzögerung',
        'avancement': 'Fortschritt',
        'avance': 'Fortschritt',
        
        # Technische Begriffe
        'gare': 'Station',
        'gares': 'Stationen',
        'pylône': 'Pylon',
        'pylone': 'Pylon',
        'pylônes': 'Pylonen',
        'cabine': 'Kabine',
        'cabines': 'Kabinen',
        'télécabine': 'Gondelbahn',
        'telecabine': 'Gondelbahn',
        'télécabines': 'Gondelbahnen',
        'télésiège': 'Sessellift',
        'telesiege': 'Sessellift',
        'télésièges': 'Sessellifte',
        'téléski': 'Schlepplift',
        'teleski': 'Schlepplift',
        'téléskis': 'Schlepplifte',
        'téléphérique': 'Seilbahn',
        'tremplin': 'Sprunganlage',
        
        # Skigebiet
        'piste': 'Piste',
        'pistes': 'Pisten',
        'neige': 'Schnee',
        'enneigement': 'Beschneiung',
        'enneige': 'beschneit',
        'artificiel': 'künstlich',
        'canons': 'Kanonen',
        'dameuse': 'Pistenraupe',
        
        # Zeit
        'été': 'Sommer',
        'hiver': 'Winter',
        'saison': 'Saison',
        'année': 'Jahr',
        'mois': 'Monat',
        'semaine': 'Woche',
        'jour': 'Tag',
        'aujourd\'hui': 'heute',
        'hier': 'gestern',
        'demain': 'morgen',
        
        # Genehmigungen
        'permis': 'Genehmigung',
        'enquete': 'Anhörung',
        'enquête': 'Anhörung',
        'public': 'öffentlich',
        'enquête publique': 'öffentliche Anhörung',
        'déclaration': 'Anmeldung',
        'travaux': 'Arbeiten',
        'chantier': 'Baustelle',
        'futur': 'zukünftig',
        'installation': 'Anlage',
        'installations': 'Anlagen',
        'démontage': 'Abbau',
        'montage': 'Aufbau',
        'assemblage': 'Montage',
        
        # Aus Forum-Posts extrahiert
        'bâche': 'Abdeckplane',
        'baches': 'Planen',
        'autorisation': 'Genehmigung',
        'autorisations': 'Genehmigungen',
        'étude': 'Studie',
        'études': 'Studien',
        'repositionner': 'verlagern',
        'remise en service': 'Wiederinbetriebnahme',
        'supprimer': 'aufheben',
        'suppression': 'Aufhebung',
        'débit': 'Kapazität',
        'fort': 'hoch',
        'incohérence': 'Unsinn',
        'folle': 'wahnwitzig',
        'sûr': 'sicher',
        'maillon': 'Glied',
        'essentiel': 'essentiell',
        'rejoindre': 'erreichen',
        'injustifié': 'ungerechtfertigt',
        'curieux': 'Neugierige',
        'nombreux': 'zahlreiche',
        'informe': 'informiert',
        'ajout': 'Hinzufügung',
        'ajouté': 'hinzugefügt',
        
        # Firmen/Hersteller
        'poma': 'Poma',
        'leitner': 'Leitner',
        'doppelmayr': 'Doppelmayr',
        'garaventa': 'Garaventa',
        'sigma': 'Sigma',
        'bgf': 'BGF',
        'skirail': 'Skirail',
        
        # Allgemein
        'domaine': 'Gebiet',
        'domaine skiable': 'Skigebiet',
        'station': 'Station',
        'stations': 'Stationen',
        'massif': 'Massiv',
        'vallée': 'Tal',
        'village': 'Dorf',
        'sommet': 'Gipfel',
        'altitude': 'Höhe',
        'mètres': 'Meter',
        'kilomètres': 'Kilometer',
        'longueur': 'Länge',
        'débit': 'Kapazität',
        'personnes': 'Personen',
        'heure': 'Stunde',
        
        # Verben
        'commence': 'beginnt',
        'commencé': 'begonnen',
        'fini': 'fertig',
        'terminé': 'beendet',
        'en cours': 'im Gange',
        'prévu': 'geplant',
        'prévue': 'geplant',
        'reporté': 'verschoben',
        'reportée': 'verschoben',
        'annulé': 'abgesagt',
        'annulée': 'abgesagt',
        'confirmé': 'bestätigt',
        'confirmée': 'bestätigt',
    }
    
    # Übersetzung durchführen (case-insensitive)
    for fr, de in translations.items():
        text = re.sub(r'\b' + re.escape(fr) + r'\b', de, text, flags=re.IGNORECASE)
    
    return text

def extract_summaries(posts):
    """Extrahiert Stichpunkte aus Posts"""
    summaries = []
    
    for post in posts:
        content = post['content']
        
        # In Sätze aufteilen
        sentences = re.split(r'[.!?]+', content)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 30 or len(sentence) > 250:
                continue
            
            # Prüfe ob Satz relevante Infos enthält
            keywords = ['bau', 'projekt', 'neu', 'renovierung', 'ersatz', 'eröffnung', 
                       'station', 'pylon', 'kabine', 'gondelbahn', 'sessellift', 'piste',
                       'genehmigung', 'arbeiten', 'fortschritt', 'verschoben', 'geplant']
            
            if any(kw in sentence.lower() for kw in keywords):
                # Übersetzen
                translated = translate_french_to_german(sentence)
                # Bereinigen
                translated = clean_text(translated)
                
                if translated and len(translated) > 20:
                    summaries.append(translated)
    
    # Duplikate entfernen
    unique = []
    seen = set()
    for s in summaries:
        key = s.lower()
        if key not in seen:
            seen.add(key)
            unique.append(s)
    
    return unique[:5]  # Max 5 Stichpunkte

def scrape_forum_list(url):
    """Scraped die Thread-Liste aus einem Forum"""
    try:
        html_content = get_page_content(url)
        soup = BeautifulSoup(html_content, 'html.parser')
        
        threads = []
        seen_topics = set()
        
        # Finde die Haupttabelle
        tables = soup.find_all('table')
        if not tables:
            return []
        
        # Nimm die größte Tabelle (Foren-Liste)
        main_table = max(tables, key=lambda t: len(t.find_all('tr')))
        rows = main_table.find_all('tr')
        
        for row in rows:
            tds = row.find_all('td')
            if len(tds) < 5:
                continue
            
            # TD[1] enthält den Topic-Titel
            topic_td = tds[1]
            topic_link = None
            best_text = ''
            
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
            
            # Filtere unerwünschte Einträge
            if not title or len(title) < 5:
                continue
            if title.startswith('[') or title.startswith('Liste des'):
                continue
            
            # Extrahiere topic ID
            topic_match = re.search(r'showtopic=(\d+)', href)
            if not topic_match:
                continue
            
            topic_id = topic_match.group(1)
            if topic_id in seen_topics or topic_id == '36657':
                continue
            seen_topics.add(topic_id)
            
            # Bereinige URL
            clean_url = re.sub(r'\?s=[a-f0-9]+&', '?', href)
            clean_url = re.sub(r'&s=[a-f0-9]+', '', clean_url)
            if clean_url.startswith('//'):
                clean_url = 'https:' + clean_url
            elif clean_url.startswith('/'):
                clean_url = BASE_URL + clean_url
            elif not clean_url.startswith('http'):
                clean_url = BASE_URL + '/' + clean_url
            
            # TD[4] enthält den letzten Post-Zeitstempel
            last_post_td = tds[4]
            last_post_time = None
            
            # Suche nach dem getlastpost Link mit Text (nicht das Bild)
            for link in last_post_td.find_all('a', href=True):
                if 'view=getlastpost' in link.get('href', ''):
                    time_text = link.get_text(strip=True)
                    if time_text:
                        last_post_time = parse_french_date(time_text)
                        if last_post_time:
                            break
            
            # Nur Threads der letzten 24h
            if last_post_time:
                time_diff = datetime.now() - last_post_time
                if time_diff <= timedelta(days=1):
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

def scrape_thread_posts(url, days_back=1):
    """Scraped die Posts und Bilder aus einem Thread"""
    try:
        # Füge view=getlastpost hinzu um die neuesten Posts zu sehen
        if '?' in url:
            url_with_view = url + '&view=getlastpost'
        else:
            url_with_view = url + '?view=getlastpost'
        
        html_content = get_page_content(url_with_view)
        soup = BeautifulSoup(html_content, 'html.parser')
        
        posts = []
        images = []
        cutoff_time = datetime.now() - timedelta(days=days_back)
        
        # IP.Board Post-Container finden
        post_containers = soup.find_all('div', class_=lambda x: x and 'post' in str(x).lower() if x else False)
        
        for post in post_containers:
            # Zeit finden - IP.Board nutzt <abbr class="published">
            time_found = None
            
            # Versuche <abbr class="published">
            abbr = post.find('abbr', class_='published')
            if abbr:
                title = abbr.get('title', '')
                if title:
                    try:
                        time_found = datetime.fromisoformat(title.replace('Z', '+00:00').replace('+00:00', ''))
                    except:
                        pass
            
            # Fallback: <time> Element
            if not time_found:
                time_el = post.find('time')
                if time_el:
                    datetime_attr = time_el.get('datetime')
                    if datetime_attr:
                        try:
                            time_found = datetime.fromisoformat(datetime_attr.replace('Z', '+00:00').replace('+00:00', ''))
                        except:
                            pass
            
            # Wenn keine Zeit gefunden, überspringen
            if not time_found:
                continue
            
            # Inhalt finden
            content_div = post.find('div', class_=lambda x: x and 'content' in str(x).lower())
            if not content_div:
                continue
            
            # Bilder extrahieren (auch aus älteren Posts im Thread)
            for img in content_div.find_all('img'):
                img_src = img.get('src', '')
                if img_src and not img_src.startswith('data:'):
                    # Relativen URLs zu absoluten machen
                    if img_src.startswith('/'):
                        img_src = BASE_URL + img_src
                    elif not img_src.startswith('http'):
                        img_src = BASE_URL + '/' + img_src
                    
                    # Nur Bilder vom Forum-Server
                    if 'remontees-mecaniques.net' in img_src:
                        images.append({
                            'url': img_src,
                            'alt': img.get('alt', '')
                        })
            
            # Nur Posts der letzten X Tage für Text
            if time_found >= cutoff_time:
                # Text extrahieren
                text = content_div.get_text(separator=' ', strip=True)
                text = clean_text(text)
                
                # Zitierte Texte entfernen
                text = re.sub(r'Quote[\s\S]*?End Quote', '', text, flags=re.IGNORECASE)
                text = clean_text(text)
                
                if len(text) > 30:
                    posts.append({
                        'time': time_found.isoformat(),
                        'content': text
                    })
        
        return {'posts': posts, 'images': list({i['url']: i for i in images}.values())[:10]}  # Max 10 Bilder, unique
    except Exception as e:
        print(f"Fehler beim Scrapen Thread {url}: {e}")
        return {'posts': [], 'images': []}

def process_forum(url, category_name):
    """Verarbeitet ein komplettes Forum"""
    print(f"Scraping {category_name}...")
    threads = scrape_forum_list(url)
    
    results = []
    for thread in threads[:15]:  # Max 15 Threads pro Kategorie
        print(f"  → Scrape Details: {thread['title'][:40]}...")
        data = scrape_thread_posts(thread['url'])
        
        posts = data['posts']
        images = data['images']
        
        if posts:
            summaries = extract_summaries(posts)
        else:
            summaries = []
        
        results.append({
            'id': thread['id'],
            'name': thread['title'],
            'url': thread['url'],
            'last_update': thread['last_post_display'],
            'summaries': summaries if summaries else ['Neuer Beitrag im Forum (Details siehe Link)'],
            'images': images
        })
    
    return results

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"=== Remontées Scraper v2 {datetime.now().strftime('%Y-%m-%d %H:%M')} ===\n")
    
    # Stationen scrapen
    stations = process_forum(STATIONS_URL, "Stationen")
    print()
    
    # Lifte scrapen
    lifts = process_forum(LIFTS_URL, "Lifte")
    print()
    
    # JSON erstellen
    data = {
        'last_updated': datetime.now().isoformat(),
        'last_updated_display': datetime.now().strftime('%d.%m.%Y %H:%M'),
        'stations': stations,
        'lifts': lifts
    }
    
    output_file = os.path.join(OUTPUT_DIR, 'remontees_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Daten gespeichert: {output_file}")
    print(f"   Stationen: {len(stations)}")
    print(f"   Lifte: {len(lifts)}")

if __name__ == '__main__':
    main()
