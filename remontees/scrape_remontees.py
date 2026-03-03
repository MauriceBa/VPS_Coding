#!/usr/bin/env python3
"""
Remontées Mécaniques Forum Scraper v6.1
Scrapt Skigebiet- und Lifte-News mit LLM-basierten Zusammenfassungen
Exakte st-Parameter Berechnung zum Zurückgehen von X Beiträgen
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import html
import sys
from datetime import datetime

BASE_URL = "https://www.remontees-mecaniques.net/forums"
STATIONS_URL = f"{BASE_URL}/index.php?showforum=129"
LIFTS_URL = f"{BASE_URL}/index.php?showforum=220"
OUTPUT_DIR = "/home/ubuntu/projects/mauricefun.lol/html/data"

# OpenRouter API Konfiguration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

# === KONFIGURATION ===
MAX_THREADS = 30        # Max Threads pro Kategorie von der ersten Seite
DEFAULT_POSTS = 40      # Standard: Letzte X Beiträge pro Thread

# Globale Session
GLOBAL_SESSION = requests.Session()
GLOBAL_SESSION.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

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
    """Bulk-Zusammenfassung via OpenRouter"""
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
            if len(thread_content) > 4000:
                thread_content = thread_content[:4000] + "... [Text gekürzt]"
                
            combined_text += f"=== THREAD_ID: {thread['id']} | TITEL: {thread['name']} ===\n"
            combined_text += f"{thread_content}\n\n"
            thread_order.append(thread['id'])
            
    if not thread_order:
        return {}
        
    if len(combined_text) > 50000:
        combined_text = combined_text[:50000] + "\n... [Rest abgeschnitten aufgrund von Token-Limit]"

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
        print("Sende gebündelten Request an LLM...")
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
                    clean_line = re.sub(r'^[\-\•\*]\s*', '', line).strip()
                    if clean_line:
                        if len(summaries_dict[current_id]) < 5:
                            summaries_dict[current_id].append(clean_line)
                            
            return summaries_dict
        else:
            print(f"OpenRouter API Fehler {response.status_code}: {response.text}")
            return {}
            
    except Exception as e:
        print(f"Fehler bei OpenRouter API: {e}")
        return {}


def scrape_forum_list(url, max_threads=MAX_THREADS):
    """
    Scraped Threads von der ersten Seite eines Forums.
    """
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
            is_pinned = False
            
            # Check ob angepinnt (Epinglé)
            pin_indicator = topic_td.find(['img', 'span'], class_=lambda x: x and ('pin' in str(x).lower() if x else False))
            if pin_indicator or '📌' in topic_td.get_text() or 'Epinglé' in topic_td.get_text():
                is_pinned = True
            
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
            
            # Basis-URL des Threads
            clean_url = f"{BASE_URL}/index.php?showtopic={topic_id}"
            
            # Letztes Post-Datum als STRING auslesen
            last_post_td = tds[4]
            last_post_display = "Unbekannt"
            
            for link in last_post_td.find_all('a', href=True):
                if 'view=getlastpost' in link.get('href', ''):
                    time_text = link.get_text(strip=True)
                    if time_text:
                        last_post_display = time_text
                        break
            
            threads.append({
                'id': topic_id,
                'title': title,
                'url': clean_url,
                'last_update': last_post_display,
                'is_pinned': is_pinned
            })
            
            pin_marker = "📌 " if is_pinned else ""
            print(f"  + [{topic_id}] {pin_marker}{title[:45]}... ({last_post_display})")
            
            if len(threads) >= max_threads:
                break
        
        return threads
        
    except Exception as e:
        print(f"Fehler beim Scrapen {url}: {e}")
        import traceback
        traceback.print_exc()
        return []

def scrape_thread_posts(url, posts_to_fetch=DEFAULT_POSTS):
    """
    Exakte Paginierung: Bestimmt die max_st (z.B. 5460) und zieht posts_to_fetch ab.
    Lädt alle Seiten in diesem Bereich und extrahiert die Posts.
    """
    try:
        # 1. Ermittle die letzte Seite (max st=...)
        html_content = get_page_content(url)
        soup = BeautifulSoup(html_content, 'html.parser')
        
        max_st = 0
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if 'showtopic=' in href and 'st=' in href:
                m = re.search(r'st=(\d+)', href)
                if m:
                    val = int(m.group(1))
                    if val > max_st:
                        max_st = val
        
        # 2. Berechne, wie weit wir zurückgehen müssen
        # Jeder Seite hat 20 Posts. Wir gehen in -20 Schritten zurück.
        min_st = max(0, max_st - posts_to_fetch + 20)  
        # Beisp: max_st=5460, posts_to_fetch=40 => min_st=5440. Wir scrapen 5460 und 5440.
        
        posts = []
        images = []
        
        for st_val in range(max_st, min_st - 1, -20):
            if st_val < 0:
                break
                
            page_url = f"{url}&st={st_val}"
            print(f"    Lese Seite st={st_val}...")
            
            p_html = get_page_content(page_url)
            p_soup = BeautifulSoup(p_html, 'html.parser')
            
            post_containers = p_soup.find_all('div', class_=lambda x: x and 'post' in str(x).lower() if x else False)
            
            # Posts von OBEN nach UNTEN lesen auf der jeweiligen Seite
            for post in post_containers:
                content_div = post.find('div', class_=lambda x: x and 'content' in str(x).lower() if x else False)
                if not content_div:
                    continue
                
                # Text extrahieren
                text = content_div.get_text(separator=' ', strip=True)
                text = clean_text(text)
                text = re.sub(r'Quote[\s\S]*?End Quote', '', text, flags=re.IGNORECASE)
                text = clean_text(text)
                
                if len(text) > 20:
                    posts.append({'content': text})
                
                # Bilder extrahieren
                for img in content_div.find_all('img'):
                    img_src = img.get('src', '')
                    if not img_src or img_src.startswith('data:'): continue
                    if 'showuser=' in img_src: continue
                    
                    lower_src = img_src.lower()
                    if any(x in lower_src for x in ['smile', 'icon', 'emoji', 'style_images', 'button', 'arrow']): continue
                    if not any(lower_src.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                        if '?' in lower_src:
                            base = lower_src.split('?')[0]
                            if not any(base.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                                continue
                        else:
                            continue
                    
                    if img_src.startswith('/'): img_src = BASE_URL + img_src
                    elif not img_src.startswith('http'): img_src = BASE_URL + '/' + img_src
                    
                    if 'remontees-mecaniques.net' in img_src:
                        images.append({'url': img_src, 'alt': img.get('alt', '')})
        
        # Da wir von hinten (max_st -> max_st-20) durch die Seiten iteriert haben,
        # haben wir erst die neuesten Posts der neuesten Seite, dann die der vorletzten Seite etc.
        # Am Ende beschneiden wir auf die exakt geforderte Anzahl (falls wir auf der Seite mehr hatten)
        posts = posts[-posts_to_fetch:]
        
        unique_images = list({i['url']: i for i in images}.values())[:15]
        print(f"    Total gescrapte Posts: {len(posts)}, Bilder: {len(unique_images)}")
        
        return {'posts': posts, 'images': unique_images}
        
    except Exception as e:
        print(f"Fehler beim Scrapen Thread {url}: {e}")
        return {'posts': [], 'images': []}

def process_forum(url, category_name, posts_to_fetch=DEFAULT_POSTS, max_threads=MAX_THREADS):
    print(f"Scraping {category_name}...")
    threads = scrape_forum_list(url, max_threads=max_threads)
    
    results = []
    
    for thread in threads:
        print(f"  → {thread['title'][:40]}...")
        data = scrape_thread_posts(thread['url'], posts_to_fetch=posts_to_fetch)
        
        results.append({
            'id': thread['id'],
            'name': thread['title'],
            'url': thread['url'],
            'last_update': thread['last_update'],
            'is_pinned': thread.get('is_pinned', False),
            'raw_posts': data['posts'],
            'images': data['images'],
            'summaries': []
        })

    print(f"\nSende alle {len(results)} Threads aus {category_name} zur Zusammenfassung...")
    llm_summaries = summarize_all_threads_bulk(results)

    for thread in results:
        thread_id = str(thread['id'])
        if thread_id in llm_summaries and llm_summaries[thread_id]:
            thread['summaries'] = llm_summaries[thread_id]
        else:
            if thread['raw_posts']:
                thread['summaries'] = ['Keine spezifische Zusammenfassung generiert, aber Beiträge vorhanden.']
            else:
                thread['summaries'] = ['Keine Beiträge in den letzten gelesenen Seiten gefunden.']
                
        del thread['raw_posts']
        
    return results

def main():
    if not OPENROUTER_API_KEY:
        print("ACHTUNG: OPENROUTER_API_KEY ist nicht gesetzt!")
        return
    
    posts_to_fetch = DEFAULT_POSTS
    if len(sys.argv) > 1:
        try:
            posts_to_fetch = int(sys.argv[1])
            print(f"📊 Anzahl Beiträge pro Thread: {posts_to_fetch}")
        except ValueError:
            print(f"⚠️ Ungültiger Parameter. Nutze Standard: {DEFAULT_POSTS}")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    now = datetime.now()
    print(f"=== Remontées Scraper v6.1 (Posts: {posts_to_fetch}) {now.strftime('%Y-%m-%d %H:%M')} ===\n")
    
    stations = process_forum(STATIONS_URL, "Stationen", posts_to_fetch=posts_to_fetch)
    print()
    lifts = process_forum(LIFTS_URL, "Lifte", posts_to_fetch=posts_to_fetch)
    print()
    
    data = {
        'last_updated': now.isoformat(),
        'last_updated_display': now.strftime('%d.%m.%Y %H:%M'),
        'posts_per_thread': posts_to_fetch,
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