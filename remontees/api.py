#!/usr/bin/env python3
"""
FastAPI Backend für Remontées Scraper
Ermöglicht On-Demand Scraping mit Parameter für Anzahl der Beiträge
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import subprocess
import os
import json
from datetime import datetime

app = FastAPI(title="Remontées Scraper API", version="6.0")

# CORS für Frontend-Zugriff
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In Produktion auf deine Domain einschränken!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pfade
SCRAPER_PATH = "/home/ubuntu/projects/mauricefun.lol/scripts/scrape_remontees.py"
DATA_FILE = "/home/ubuntu/projects/mauricefun.lol/html/data/remontees_data.json"
OUTPUT_DIR = "/home/ubuntu/projects/mauricefun.lol/html/data"


@app.get("/")
def read_root():
    return {
        "message": "Remontées Scraper API",
        "version": "6.0",
        "endpoints": {
            "/api/scrape": "POST - Startet Scraper mit posts Parameter",
            "/api/status": "GET - Gibt aktuelle Daten zurück"
        }
    }


@app.post("/api/scrape")
def scrape_posts(
    posts: int = Query(default=20, ge=5, le=40, description="Anzahl Beiträge pro Thread (5-40)")
):
    """
    Führt den Scraper mit der angegebenen Anzahl von Beiträgen pro Thread aus.
    Dauert ca. 20-40 Sekunden.
    """
    try:
        # Scraper als Subprozess ausführen
        # WICHTIG: Environment Variable setzen!
        env = os.environ.copy()
        
        result = subprocess.run(
            ["python3", SCRAPER_PATH, str(posts)],
            capture_output=True,
            text=True,
            timeout=120,  # 2 Minuten Timeout
            env=env,
            cwd=os.path.dirname(SCRAPER_PATH)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500, 
                detail=f"Scraper Fehler: {result.stderr}"
            )
        
        # Ergebnis aus der JSON-Datei lesen
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {
                "success": True,
                "message": "Scrape erfolgreich",
                "posts_per_thread": posts,
                "data": data
            }
        else:
            raise HTTPException(status_code=500, detail="Ausgabedatei nicht gefunden")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Scraper Timeout (> 2 Minuten)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/status")
def get_status():
    """Gibt die aktuellen Scraped-Daten zurück"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data
        else:
            return {
                "last_updated": None,
                "stations": [],
                "lifts": []
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health_check():
    """Health Check für Monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "scraper_exists": os.path.exists(SCRAPER_PATH),
        "data_exists": os.path.exists(DATA_FILE)
    }


if __name__ == "__main__":
    import uvicorn
    # Lokal starten mit: python3 api.py
    uvicorn.run(app, host="127.0.0.1", port=8000)
