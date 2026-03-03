#!/usr/bin/env python3
"""
Remontées Mécaniques Forum Scraper v5.2
Scrapt Skigebiet- und Lifte-News mit LLM-basierten Zusammenfassungen (OpenRouter/Stepfun)
Fix für französisches Datumsformat inkl. Abkürzungen wie "févr."
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import html
import time
from datetime import datetime, timedelta

BASE_URL = "https://www.remontees-mecaniques.net/forums"
STATIONS_URL = f"{BASE_URL}/index.php?showforum=129"
LIFTS_URL = f"{BASE_URL}/index.php?showforum=220"
OUTPUT_DIR = "/home/ubuntu/projects/mauricefun.lol/html/data"

# OpenRouter API Konfiguration (Wird aus Environment Variable geladen)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

# Auch abgekürzte Monate wie "févr." hinzufügen!
FRENCH_MONTHS = {
    'janvier': 1, 'janv': 1, 'janv.': 1, 
    'février': 2, 'févr': 2, 'févr.': 2, 'fevrier': 2, 'fevr': 2, 'fevr.': 2,
    'mars': 3, 
    'avril': 4, 'avr': 4, 'avr.': 4,
    'mai': 5, 
    'juin': 6, 
    'juillet': 7, 'juil': 7, 'juil.': 7,
    'août': 8, 'aout': 8,
    'septembre': 9, 'sept': 9, 'sept.': 9,
    'octobre': 10, 'oct': 10, 'oct.': 10,
    'novembre': 11, 'nov': 11, 'nov.': 11,
    'décembre': 12, 'decembre': 12, 'déc': 12, 'déc.': 12, 'dec': 12, 'dec.': 12
}

# Globale Session für bessere Performance
GLOBAL_SESSION = requests.Session()
GLOBAL_SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

def parse_french_date(date_str):
    """Parst französische Datumsangaben in allen möglichen Formaten"""
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
    
    # Vor X Minuten / Stunden
    if "il y a" in date_str:
        min_match = re.search(r'(\d+)\s*minute', date_str)
        if min_match:
            return now - timedelta(minutes=int(min_match.group(1)))
        hour_match = re.search(r'(\d+)\s*heure', date_str)
        if hour_match:
            return now - timedelta(hours=int(hour_match.group(1)))
        if "seconde" in date_str:
            return now

    # Absolutes Datum parsen
    day, month_str, year = None, None, now.year
    date_str_clean = date_str.replace(',', ' ').replace('.', '')
    
    # Format 1: "28 février 2026" oder "28 févr 2026"
    m1 = re.search(r'(\d{1,2})\s+([a-zûéè]+)\s+(\d{4})', date_str_clean)
    # Format 2: "mars 01 2026" (Dieses Format nutzt das Forum oft!)
    m2 = re.search(r'([a-zûéè]+)\s+(\d{1,2})\s+(\d{4})', date_str_clean)
    # Format 3: "28 février" (Ohne Jahr)
    m3 = re.search(r'(\d{1,2})\s+([a-zûéè]+)', date_str_clean)
    # Format 4: "février 28" (Ohne Jahr)
    m4 = re.search(r'([a-zûéè]+)\s+(\d{1,2})', date_str_clean)
    
    if m1:
        day, month_str, year = int(m1.group(1)), m1.group(2), int(m1.group(3))
    elif m2:
        month_str, day, year = m2.group(1), int(m2.group(2)), int(m2.group(3))
    elif m3:
        day, month_str = int(m3.group(1)), m3.group(2)
    elif m4:
        month_str, day = m4.group(1), int(m4.group(2))
        
    if day and month_str:
        month = FRENCH_MONTHS.get(month_str)
        if not month:
            # Fallback falls es ein ganz komischer Monats-String ist
            for k, v in FRENCH_MONTHS.items():
                if month_str.startswith(k) or k.startswith(month_str):
                    month = v
                    break
        
        if month:
            time_match = re.search(r'(\d{1,2}):(\d{2})', date_str)
            hour, minute = 0, 0
            if time_match:
                hour, minute = int(time_match.group(1)), int(time_match.group(2))
                
            try:
                parsed_date = datetime(year, month, day, hour, minute)
                # Wenn Datum in der Zukunft liegt (z.B. Dezember, obwohl wir Januar haben), war es letztes Jahr
                if parsed_date > now + timedelta(days=1):
                    parsed_date = parsed_date.replace(year=year-1)
                return parsed_date
            except ValueError:
                pass
            
    return None

def get_session():
    return GLOBAL_SESSION

def get_page_content(url):
    session = get_session()
    resp = session.get(url, timeout=30)
    return resp.content.decode('latin-1')

def clean_text(text):
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def summarize_all_threads_bulk(all_threads_data):
    if not OPENROUTER_API_KEY:
        print("WARNUNG: OPENROUTER_API_KEY nicht gesetzt.")
        return {}
        
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://mauricefun.lol",
        "X-Title": "Remontees Scraper",
        "Content-Type": "application/json"
    }

    combined_text = "Bitte analysiere die folgenden Foren-Themen und gib für jedes Thema eine deutschsprachige Zusammenfassung.\n\n"
    thread_order = []
    
    for thread in all_threads_data:
        raw_posts = thread.get('raw_posts', [])
        if not raw_posts:
            continue
            
        thread_content = ""
        for idx, post in enumerate(raw_posts):
            clean_content = clean_text(post['content'])
            if len(clean_content) > 15:
                thread_content += f"Post {idx+1}: {clean_content}\n"
                
        if thread_content.strip():
            if len(thread_content) > 3000:
                thread_content = thread_content[:3000] + "... [Text gekürzt]"
                
            combined_text += f"=== THREAD_ID: {thread['id']} | TITEL: {thread['name']} ===\n"
            combined_text += f"{thread_content}\n\n"
            thread_order.append(thread['id'])
            
    if not thread_order:
        return {}
        
    if len(combined_text) > 40000:
        combined_text = combined_text[:40000] + "\n... [Rest abgeschnitten aufgrund von Token-Limit]"

    system_prompt = (
        "Du bist ein Experte für Skigebiete und Seilbahnen. Du erhältst Beiträge aus verschiedenen "
        "Foren-Themen. Deine Aufgabe ist es, für jedes Thema die wichtigsten Fakten als deutsche Stichpunkte "
        "zusammenzufassen.\n\n"
        "Regeln für die Ausgabe:\n"
        "1. Nutze exakt das Format: THREAD_ID: [ID des Themas]\n"
        "2. Darunter listest du die Zusammenfassungen auf.\n"
        "3. Jeder Stichpunkt muss mit einem Bindestrich (-) beginnen.\n"
        "4. Konzentriere dich auf harte Fakten (neue Lifte, Eröffnungen, Bauarbeiten) und ignoriere Grüße/Meinungen.\n"
        "5. Maximal 5 Stichpunkte pro Thema.\n\n"
        "Beispielausgabe:\n"
        "THREAD_ID: 12345\n"
        "- Neue 6er-Sesselbahn wird gebaut.\n"
        "- Eröffnung für Dezember geplant.\n"
        "THREAD_ID: 67890\n"
        "- Alter Schlepplift wurde abgerissen."
    )

    payload = {
        "model": "stepfun/step-3.5-flash:free",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": combined_text}
        ],
        "temperature": 0.2
    }

    try:
        print("Sende gebündelten Request an LLM (Rate Limits umgehen)...")
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            result_text = response.json()['choices'][0]['message']['content'].strip()
            print("Antwort erhalten! Parse Ergebnisse...")
            
            summaries_dict = {}
            current_id = None
            
            for line in result_text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                    
                id_match = re.search(r'THREAD_ID:\s*(\d+)', line, re.IGNORECASE)
                if id_match:
                    current_id = id_match.group(1)
                    summaries_dict[current_id] = []
                elif current_id and line.startswith('-'):
                    clean_line = re.sub(r'^-\s*', '', line).strip()
                    if clean_line:
                        if len(summaries_dict[current_id]) < 5:
                            summaries_dict[current_id].append(clean_line)
                            
            return summaries_dict
        else:
            print(f"OpenRouter API Fehler {response.status_code}: {response.text}")
            return {}
            
    except Exception as e:
        print(f"Ausnahmefehler bei OpenRouter API: {e}")
        return {}


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
                        parsed_time = parse_french_date(time_text)
                        if parsed_time:
                            last_post_time = parsed_time
                            break
                        else:
                            print(f"WARNUNG: Konnte Datum nicht parsen: '{time_text}' in Thread '{title}'")
            
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
                
                # Bilder extrahieren
                for img in content_div.find_all('img'):
                    img_src = img.get('src', '')
                    if not img_src or img_src.startswith('data:'):
                        continue
                    
                    if 'showuser=' in img_src:
                        continue
                    
                    width = img.get('width', '')
                    height = img.get('height', '')
                    if width and height:
                        try:
                            w, h = int(width), int(height)
                            if w < 100 or h < 100:
                                continue
                        except:
                            pass
                    
                    lower_src = img_src.lower()
                    if any(x in lower_src for x in ['smile', 'icon', 'emoji', 'style_images', 'button', 'arrow']):
                        continue
                    
                    if not any(lower_src.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                        if '?' in lower_src:
                            base = lower_src.split('?')[0]
                            if not any(base.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                                continue
                        else:
                            continue
                    
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
        
        unique_images = list({i['url']: i for i in images}.values())[:15]
        print(f"    Total: {len(posts)} Posts, {len(unique_images)} Bilder")
        return {'posts': posts, 'images': unique_images}
        
    except Exception as e:
        print(f"Fehler beim Scrapen Thread {url}: {e}")
        return {'posts': [], 'images': []}

def process_forum(url, category_name, days_back=7):
    print(f"Scraping {category_name}...")
    threads = scrape_forum_list(url)
    
    results = []
    
    for thread in threads[:25]: # Limit leicht erhöht auf 25, damit auch angepinnte Posts Platz haben
        print(f"  → Scraping Inhalte: {thread['title'][:40]}...")
        data = scrape_thread_posts(thread['url'], days_back=days_back)
        
        results.append({
            'id': thread['id'],
            'name': thread['title'],
            'url': thread['url'],
            'last_update': thread['last_post_display'],
            'raw_posts': data['posts'],
            'images': data['images'],
            'summaries': []
        })

    print(f"\nSende alle {len(results)} Threads aus {category_name} zur Zusammenfassung an das LLM...")
    llm_summaries = summarize_all_threads_bulk(results)

    for thread in results:
        thread_id = str(thread['id'])
        if thread_id in llm_summaries and llm_summaries[thread_id]:
            thread['summaries'] = llm_summaries[thread_id]
        else:
            if thread['raw_posts']:
                thread['summaries'] = ['Keine spezifische Zusammenfassung generiert, aber neue Beiträge vorhanden.']
            else:
                thread['summaries'] = ['Keine neuen Text-Beiträge in den letzten 7 Tagen.']
                
        del thread['raw_posts']
        
    return results

def main():
    if not OPENROUTER_API_KEY:
        print("ACHTUNG: OPENROUTER_API_KEY ist nicht gesetzt!")
        
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"=== Remontées Scraper (LLM BULK Version 5.2) {datetime.now().strftime('%Y-%m-%d %H:%M')} ===\n")
    
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