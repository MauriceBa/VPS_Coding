"""Remontées Mécaniques forum scraper.

Scrapes ski-resort and lift news threads and attaches LLM-generated German summaries.

Run as a script::

    python -m mauricefun.remontees.scraper [posts_per_thread]
"""

from __future__ import annotations

import json
import logging
import re
import sys
from datetime import datetime
from typing import Any

import requests
from bs4 import BeautifulSoup

from mauricefun.config import Settings, get_settings
from mauricefun.exceptions import RemonteesError
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = [
    "BASE_URL",
    "DEFAULT_POSTS",
    "MAX_THREADS",
    "RemonteesScraper",
    "clean_text",
    "parse_summaries",
]

BASE_URL = "https://www.remontees-mecaniques.net/forums"
STATIONS_URL = f"{BASE_URL}/index.php?showforum=129"
LIFTS_URL = f"{BASE_URL}/index.php?showforum=220"

MAX_THREADS = 30
DEFAULT_POSTS = 40
_MAX_SUMMARY_BULLETS = 5
_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_OPENROUTER_MODEL = "stepfun/step-3.5-flash:free"

_SYSTEM_PROMPT = (
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

_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp")
_IMAGE_NOISE = ("smile", "icon", "emoji", "style_images", "button", "arrow")
_IMAGE_LIMIT = 15
_THREAD_TEXT_LIMIT = 4000
_COMBINED_TEXT_LIMIT = 50000


def clean_text(text: str) -> str:
    """Collapse all whitespace runs in ``text`` to single spaces and strip it."""
    return re.sub(r"\s+", " ", text).strip()


def parse_summaries(result_text: str) -> dict[str, list[str]]:
    """Parse the LLM output into ``{thread_id: [bullets]}``.

    Recognises ``THREAD_ID: <id>`` headers followed by ``-`` bullets.
    """
    summaries: dict[str, list[str]] = {}
    current_id: str | None = None
    for raw_line in result_text.split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        id_match = re.search(r"THREAD_ID:\s*(\d+)", line, re.IGNORECASE)
        if id_match:
            current_id = id_match.group(1)
            summaries[current_id] = []
        elif current_id and line.startswith("-"):
            bullet = re.sub(r"^[\-\u2022\*]\s*", "", line).strip()
            if bullet and len(summaries[current_id]) < _MAX_SUMMARY_BULLETS:
                summaries[current_id].append(bullet)
    return summaries


class RemonteesScraper:
    """Scrapes forum threads and generates summaries via OpenRouter."""

    def __init__(
        self, settings: Settings | None = None, session: requests.Session | None = None
    ) -> None:
        self.settings = settings or get_settings()
        self.session = session or self._build_session()
        self.api_key = self.settings.openrouter_api_key

    @staticmethod
    def _build_session() -> requests.Session:
        session = requests.Session()
        session.headers.update({"User-Agent": _USER_AGENT})
        return session

    def _get_html(self, url: str) -> str:
        """Fetch ``url`` and decode it as latin-1 (the forum's encoding)."""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise RemonteesError(f"Failed to fetch {url}: {exc}") from exc
        return response.content.decode("latin-1")

    def summarize_threads(self, threads: list[dict[str, Any]]) -> dict[str, list[str]]:
        """Send all threads to OpenRouter in one request and parse the summaries."""
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY not set; skipping summaries")
            return {}

        combined_text = (
            "Bitte analysiere die folgenden Foren-Themen und gib für jedes Thema eine "
            "deutschsprachige Zusammenfassung.\n\n"
        )
        thread_order: list[str] = []
        for thread in threads:
            raw_posts = thread.get("raw_posts", [])
            if not raw_posts:
                continue
            thread_content = ""
            for idx, post in enumerate(raw_posts):
                content = clean_text(post["content"])
                if len(content) > 15:
                    thread_content += f"Post {idx + 1}: {content}\n"
            if thread_content.strip():
                if len(thread_content) > _THREAD_TEXT_LIMIT:
                    thread_content = thread_content[:_THREAD_TEXT_LIMIT] + "... [Text gekürzt]"
                combined_text += f"=== THREAD_ID: {thread['id']} | TITEL: {thread['name']} ===\n"
                combined_text += f"{thread_content}\n\n"
                thread_order.append(thread["id"])

        if not thread_order:
            return {}
        if len(combined_text) > _COMBINED_TEXT_LIMIT:
            combined_text = combined_text[:_COMBINED_TEXT_LIMIT] + "\n... [Rest abgeschnitten]"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://mauricefun.lol",
            "X-Title": "Remontees Scraper",
            "Content-Type": "application/json",
        }
        payload = {
            "model": _OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": combined_text},
            ],
            "temperature": 0.2,
        }
        try:
            response = self.session.post(_OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        except requests.RequestException as exc:
            logger.error("OpenRouter request failed: %s", exc)
            return {}

        if response.status_code != 200:
            logger.error("OpenRouter API error %s: %s", response.status_code, response.text)
            return {}

        content = response.json()["choices"][0]["message"]["content"].strip()
        return parse_summaries(content)

    def scrape_forum_list(self, url: str, max_threads: int = MAX_THREADS) -> list[dict[str, Any]]:
        """Scrape the thread list from the first page of a forum."""
        try:
            soup = BeautifulSoup(self._get_html(url), "html.parser")
        except RemonteesError:
            logger.exception("Failed to scrape forum list %s", url)
            return []

        tables = soup.find_all("table")
        if not tables:
            return []
        main_table = max(tables, key=lambda table: len(table.find_all("tr")))

        threads: list[dict[str, Any]] = []
        seen: set[str] = set()
        for row in main_table.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) < 5:
                continue
            thread = self._parse_thread_row(cells)
            if thread is None or thread["id"] in seen:
                continue
            seen.add(thread["id"])
            threads.append(thread)
            if len(threads) >= max_threads:
                break
        return threads

    def _parse_thread_row(self, cells: list[Any]) -> dict[str, Any] | None:
        topic_cell = cells[1]
        is_pinned = bool(
            topic_cell.find(
                ["img", "span"], class_=lambda value: value and "pin" in str(value).lower()
            )
            or "\U0001f4cc" in topic_cell.get_text()
            or "Epinglé" in topic_cell.get_text()
        )

        best_text = ""
        topic_id: str | None = None
        for link in topic_cell.find_all("a", href=True):
            href = str(link.get("href", ""))
            text = link.get_text(strip=True)
            if "showtopic=" in href and "view=get" not in href and len(text) > len(best_text):
                match = re.search(r"showtopic=(\d+)", href)
                if match:
                    topic_id = match.group(1)
                    best_text = text

        if topic_id is None or topic_id == "36657":
            return None
        if not best_text or len(best_text) < 5 or best_text.startswith("Liste des"):
            return None

        last_update = "Unbekannt"
        for link in cells[4].find_all("a", href=True):
            if "view=getlastpost" in link.get("href", ""):
                text = link.get_text(strip=True)
                if text:
                    last_update = text
                    break

        return {
            "id": topic_id,
            "title": best_text,
            "url": f"{BASE_URL}/index.php?showtopic={topic_id}",
            "last_update": last_update,
            "is_pinned": is_pinned,
        }

    def scrape_thread_posts(self, url: str, posts_to_fetch: int = DEFAULT_POSTS) -> dict[str, Any]:
        """Scrape the last ``posts_to_fetch`` posts (and images) of a thread."""
        try:
            soup = BeautifulSoup(self._get_html(url), "html.parser")
        except RemonteesError:
            logger.exception("Failed to scrape thread %s", url)
            return {"posts": [], "images": []}

        max_st = 0
        for link in soup.find_all("a", href=True):
            href = str(link.get("href", ""))
            if "showtopic=" in href and "st=" in href:
                match = re.search(r"st=(\d+)", href)
                if match and int(match.group(1)) > max_st:
                    max_st = int(match.group(1))

        min_st = max(0, max_st - posts_to_fetch + 20)
        posts: list[dict[str, str]] = []
        images: list[dict[str, str]] = []
        for st_val in range(max_st, min_st - 1, -20):
            if st_val < 0:
                break
            page_soup = BeautifulSoup(self._get_html(f"{url}&st={st_val}"), "html.parser")
            self._collect_posts_and_images(page_soup, posts, images)

        posts = posts[-posts_to_fetch:]
        unique_images = list({image["url"]: image for image in images}.values())[:_IMAGE_LIMIT]
        return {"posts": posts, "images": unique_images}

    def _collect_posts_and_images(
        self,
        page_soup: BeautifulSoup,
        posts: list[dict[str, str]],
        images: list[dict[str, str]],
    ) -> None:
        containers = page_soup.find_all(
            "div", class_=lambda value: value and "post" in str(value).lower()
        )
        for post in containers:
            content_div = post.find(
                "div", class_=lambda value: value and "content" in str(value).lower()
            )
            if not content_div:
                continue
            text = clean_text(content_div.get_text(separator=" ", strip=True))
            text = clean_text(re.sub(r"Quote[\s\S]*?End Quote", "", text, flags=re.IGNORECASE))
            if len(text) > 20:
                posts.append({"content": text})
            for image in content_div.find_all("img"):
                source = self._normalize_image_source(str(image.get("src", "")))
                if source and "remontees-mecaniques.net" in source:
                    images.append({"url": source, "alt": str(image.get("alt", ""))})

    @staticmethod
    def _normalize_image_source(src: str) -> str | None:
        if not src or src.startswith("data:") or "showuser=" in src:
            return None
        lower = src.lower()
        if any(noise in lower for noise in _IMAGE_NOISE):
            return None
        if not lower.endswith(_IMAGE_EXTENSIONS):
            base = lower.split("?")[0] if "?" in lower else lower
            if not base.endswith(_IMAGE_EXTENSIONS):
                return None
        if src.startswith("/"):
            return BASE_URL + src
        if not src.startswith("http"):
            return BASE_URL + "/" + src
        return src

    def process_forum(
        self,
        url: str,
        category_name: str,
        posts_to_fetch: int = DEFAULT_POSTS,
        max_threads: int = MAX_THREADS,
    ) -> list[dict[str, Any]]:
        """Scrape every thread in a forum and attach summaries."""
        logger.info("Scraping %s...", category_name)
        threads = self.scrape_forum_list(url, max_threads=max_threads)
        results: list[dict[str, Any]] = []
        for thread in threads:
            logger.info("  -> %s...", thread["title"][:40])
            data = self.scrape_thread_posts(thread["url"], posts_to_fetch=posts_to_fetch)
            results.append(
                {
                    "id": thread["id"],
                    "name": thread["title"],
                    "url": thread["url"],
                    "last_update": thread["last_update"],
                    "is_pinned": thread.get("is_pinned", False),
                    "raw_posts": data["posts"],
                    "images": data["images"],
                    "summaries": [],
                }
            )

        logger.info("Summarising %d threads from %s...", len(results), category_name)
        summaries = self.summarize_threads(results)
        for thread in results:
            thread_id = str(thread["id"])
            if summaries.get(thread_id):
                thread["summaries"] = summaries[thread_id]
            elif thread["raw_posts"]:
                thread["summaries"] = [
                    "Keine spezifische Zusammenfassung generiert, aber Beiträge vorhanden."
                ]
            else:
                thread["summaries"] = ["Keine Beiträge in den letzten gelesenen Seiten gefunden."]
            del thread["raw_posts"]
        return results

    def run(self, posts_to_fetch: int = DEFAULT_POSTS) -> dict[str, Any]:
        """Run the full scrape and write ``remontees_data.json`` to the output dir."""
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY is not set; aborting")
            return {}

        output_file = self.settings.remontees_data_file
        output_file.parent.mkdir(parents=True, exist_ok=True)
        now = datetime.now()
        logger.info("Remontées scraper starting (posts=%s)", posts_to_fetch)

        stations = self.process_forum(STATIONS_URL, "Stationen", posts_to_fetch=posts_to_fetch)
        lifts = self.process_forum(LIFTS_URL, "Lifte", posts_to_fetch=posts_to_fetch)

        data = {
            "last_updated": now.isoformat(),
            "last_updated_display": now.strftime("%d.%m.%Y %H:%M"),
            "posts_per_thread": posts_to_fetch,
            "stations": stations,
            "lifts": lifts,
        }
        with open(output_file, "w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
        logger.info("Saved %s (stations=%d, lifts=%d)", output_file, len(stations), len(lifts))
        return data


def main() -> None:
    """Entrypoint for the ``mauricefun-remontees-scrape`` console script."""
    configure_logging()
    posts_to_fetch = DEFAULT_POSTS
    if len(sys.argv) > 1:
        try:
            posts_to_fetch = int(sys.argv[1])
        except ValueError:
            logger.warning(
                "Invalid posts argument %r; using default %d", sys.argv[1], DEFAULT_POSTS
            )
    RemonteesScraper().run(posts_to_fetch)


if __name__ == "__main__":  # pragma: no cover
    main()
