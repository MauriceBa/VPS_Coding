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
    
    # "il y a X minutes/heures" (vor X Minuten/Stunden)
    if "il y a" in date_str:
        # Minuten
        min_match = re.search(r'(\d+)\s*minute', date_str)
        if min_match:
            minutes = int(min_match.group(1))
            return now - timedelta(minutes=minutes)
        
        # Stunden
        hour_match = re.search(r'(\d+)\s*heure', date_str)
        if hour_match:
            hours = int(hour_match.group(1))
            return now - timedelta(hours=hours)
        
        # Sekunden (falls "il y a quelques secondes")
        if "seconde" in date_str:
            return now
    
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

def extract_summaries(posts, max_summaries=5):
    """
    Extrahiert Stichpunkte aus Posts.
    Nimmt die ersten Sätze jedes Posts, übersetzt sie und gibt sie als Stichpunkte zurück.
    """
    summaries = []
    
    for post in posts:
        content = post['content']
        
        # In Sätze aufteilen
        sentences = re.split(r'[.!?]+', content)
        
        for sentence in sentences:
            sentence = sentence.strip()
            # Längere Sätze nehmen (40-200 Zeichen)
            if len(sentence) < 40 or len(sentence) > 200:
                continue
            
            # Übersetzen
            translated = translate_french_to_german(sentence)
            # Bereinigen
            translated = clean_text(translated)
            
            # Entferne französische Füllwörter am Anfang
            translated = re.sub(r'^(le|la|les|un|une|des|et|en|de|du|au|aux|ce|cette|ces|pour|par|sur|dans|avec)\s+', '', translated, flags=re.IGNORECASE)
            
            if translated and len(translated) > 30:
                # Großschreibung am Anfang
                translated = translated[0].upper() + translated[1:]
                summaries.append(translated)
                
                # Max X Summaries pro Post
                if len([s for s in summaries if s]) >= max_summaries:
                    break
        
        # Max X Summaries insgesamt
        if len(summaries) >= max_summaries * 2:
            break
    
    # Duplikate entfernen
    unique = []
    seen = set()
    for s in summaries:
        key = s.lower()[:50]  # Vergleiche nur ersten 50 Zeichen
        if key not in seen:
            seen.add(key)
            unique.append(s)
    
    return unique[:max_summaries]

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
            if title.startswith('Liste des'):
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
            
            # Nur Threads der letzten 7 Tage (werden dann client-seitig gefiltert)
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

def scrape_thread_posts(url, days_back=1):
    """Scraped die Posts und Bilder aus einem Thread mit Pagination"""
    try:
        posts = []
        images = []
        cutoff_time = datetime.now() - timedelta(days=days_back)
        
        # Starte mit der letzten Seite (view=getlastpost)
        if '?' in url:
            current_url = url + '&view=getlastpost'
        else:
            current_url = url + '?view=getlastpost'
        
        page_count = 0
        max_pages = 10  # Max 10 Seiten zurück um Endlosschleifen zu vermeiden
        oldest_post_time = datetime.now()
        
        while page_count < max_pages:
            page_count += 1
            print(f"    Seite {page_count}: {current_url[-60:]}...")
            
            html_content = get_page_content(current_url)
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # IP.Board Post-Container finden
            post_containers = soup.find_all('div', class_=lambda x: x and 'post' in str(x).lower() if x else False)
            print(f"    Posts auf Seite: {len(post_containers)}")
            
            page_has_recent_posts = False
            
            for post in post_containers:
                # Zeit finden - IP.Board nutzt <abbr class="published">
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
                
                # Track ältester Post auf dieser Seite
                if time_found < oldest_post_time:
                    oldest_post_time = time_found
                
                # Inhalt finden
                content_div = post.find('div', class_=lambda x: x and 'content' in str(x).lower() if x else False)
                if not content_div:
                    continue
                
                # Bilder extrahieren (aus allen Posts)
                for img in content_div.find_all('img'):
                    img_src = img.get('src', '')
                    if not img_src or img_src.startswith('data:'):
                        continue
                    
                    # Profilbilder überspringen (showuser in URL)
                    if 'showuser=' in img_src:
                        continue
                    
                    # Smileys/Icons überspringen (typischerweise klein)
                    width = img.get('width', '')
                    height = img.get('height', '')
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w < 100 or h < 100:
                                continue
                        except:
                            pass
                    
                    # Auch anhand des Pfads prüfen (Smileys/Icons)
                    lower_src = img_src.lower()
                    if any(x in lower_src for x in ['smile', 'icon', 'emoji', 'emoticon', 'style_images', 'public/style', 'button', 'arrow']):
                        continue
                    
                    # Dateiendung prüfen (nur echte Bilder)
                    if not any(lower_src.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']):
                        # Manche Bilder haben Parameter nach der Endung
                        if '?' in lower_src:
                            base = lower_src.split('?')[0]
                            if not any(base.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']):
                                continue
                        else:
                            continue
                    
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
                
                # Nur Posts im Zeitfenster für Text
                if time_found >= cutoff_time:
                    page_has_recent_posts = True
                    text = content_div.get_text(separator=' ', strip=True)
                    text = clean_text(text)
                    text = re.sub(r'Quote[\s\S]*?End Quote', '', text, flags=re.IGNORECASE)
                    text = clean_text(text)
                    
                    if len(text) > 30:
                        posts.append({
                            'time': time_found.isoformat(),
                            'content': text
                        })
            
            # Prüfe ob wir weiter zurück müssen
            # Wenn der älteste Post auf dieser Seite neuer ist als der Cutoff,
            # müssen wir eine Seite zurück
            if oldest_post_time >= cutoff_time and page_has_recent_posts:
                # Suche Pagination-Link für "vorherige Seite"
                # IP.Board zeigt Links wie "<  Vorherige" oder "<< Erste"
                prev_link = None
                
                # Suche nach "Préc" (Précédent) oder "<"
                for link in soup.find_all('a', href=True):
                    link_text = link.get_text(strip=True).lower()
                    href = link.get('href', '')
                    if 'showtopic=' in href and ('st=' in href or 'view=getlastpost' in href):
                        if any(x in link_text for x in ['préc', 'prev', 'vorher', '<']):
                            # Extrahiere st= Wert
                            st_match = re.search(r'st=(\d+)', href)
                            if st_match:
                                st_val = int(st_match.group(1))
                                # Aktueller st-Wert aus URL
                                current_st = 0
                                current_st_match = re.search(r'st=(\d+)', current_url)
                                if current_st_match:
                                    current_st = int(current_st_match.group(1))
                                
                                # Nur wenn der neue st-Wert kleiner ist (weiter zurück)
                                if st_val < current_st or 'view=getlastpost' in current_url:
                                    prev_link = href
                                    break
                
                # Wenn kein Prev-Link gefunden, versuche st manuell zu dekrementieren
                if not prev_link:
                    # Aus der aktuellen URL den st-Wert extrahieren
                    st_match = re.search(r'st=(\d+)', current_url)
                    if st_match:
                        current_st = int(st_match.group(1))
                        new_st = max(0, current_st - 20)
                        prev_link = re.sub(r'st=\d+', f'st={new_st}', current_url)
                        prev_link = prev_link.replace('&view=getlastpost', '')
                    elif 'view=getlastpost' in current_url:
                        # Erste Pagination-Seite hat st=20 (nicht 0!)
                        prev_link = current_url.replace('&view=getlastpost', '&st=20')
                
                if prev_link:
                    # Bereinige URL
                    if prev_link.startswith('//'):
                        prev_link = 'https:' + prev_link
                    elif prev_link.startswith('/'):
                        prev_link = BASE_URL + prev_link
                    elif not prev_link.startswith('http'):
                        prev_link = BASE_URL + '/' + prev_link
                    
                    current_url = prev_link
                    print(f"    → Gehe zu vorheriger Seite...")
                    continue
            
            # Wenn wir hier sind, haben wir genug oder keine vorherige Seite
            break
        
        print(f"    Total Posts: {len(posts)}, Bilder: {len(images)}")
        return {'posts': posts, 'images': list({i['url']: i for i in images}.values())[:15]}
        
    except Exception as e:
        print(f"Fehler beim Scrapen Thread {url}: {e}")
        import traceback
        traceback.print_exc()
        return {'posts': [], 'images': []}

def process_forum(url, category_name, days_back=7):
    """Verarbeitet ein komplettes Forum"""
    print(f"Scraping {category_name} (letzte {days_back} Tage)...")
    threads = scrape_forum_list(url)
    
    results = []
    for thread in threads[:15]:  # Max 15 Threads pro Kategorie
        print(f"  → Scrape Details: {thread['title'][:40]}...")
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
            'summaries': summaries if summaries else ['Neuer Beitrag im Forum (Details siehe Link)'],
            'images': images
        })
    
    return results

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"=== Remontées Scraper v2 {datetime.now().strftime('%Y-%m-%d %H:%M')} ===\n")
    
    # Immer 7 Tage scrapen, die Website filtert dann client-seitig
    days_back = 7
    
    # Stationen scrapen
    stations = process_forum(STATIONS_URL, "Stationen", days_back=days_back)
    print()
    
    # Lifte scrapen
    lifts = process_forum(LIFTS_URL, "Lifte", days_back=days_back)
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
