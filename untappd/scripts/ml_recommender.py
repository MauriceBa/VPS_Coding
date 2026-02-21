import json
import random
import os
from datetime import datetime

# VPS hat Vorrang, sonst relativer Repo-Pfad
VPS_STATS  = "/var/www/mauricefun.lol/html/untappd/data/stats.json"
VPS_ML_OUT = "/var/www/mauricefun.lol/html/untappd/data/ml_data.json"

if os.path.exists(VPS_STATS):
    STATS_FILE  = VPS_STATS
    ML_OUT_FILE = VPS_ML_OUT
else:
    BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
    STATS_FILE  = os.path.join(BASE_DIR, "../data/stats.json")
    ML_OUT_FILE = os.path.join(BASE_DIR, "../data/ml_data.json")

# Kuratierte Weltklasse-Biere fuer den Empfehlungsalgorithmus
GLOBAL_BEERS = [
    {"name": "Westvleteren 12 (XII)",      "brewery": "Brouwerij De Sint-Sixtusabdij",       "style": "Quadrupel",    "desc": "Eines der am besten bewerteten Biere der Welt. Extrem seltenes Trappistenbier."},
    {"name": "Pliny the Elder",             "brewery": "Russian River Brewing",              "style": "DIPA",         "desc": "Absolut legend\u00e4res Double IPA aus Kalifornien mit perfekten Hopfennoten."},
    {"name": "Weihenstephaner Hefeweissbier","brewery": "Bayerische Staatsbrauerei",         "style": "Wheat Beer",   "desc": "Der Klassiker unter den Wei\u00dfbieren, oft als weltbeste Referenz genannt."},
    {"name": "Rochefort 10",               "brewery": "Abbaye Notre-Dame de Saint-R\u00e9my","style": "Quadrupel",    "desc": "Dunkel, fruchtig, komplex und stark \u2013 ein Trappisten-Meisterwerk."},
    {"name": "Orval",                      "brewery": "Brasserie d'Orval",                  "style": "Pale Ale",     "desc": "Einzigartiges Trappistenbier, das mit Brettanomyces vergoren wird."},
    {"name": "Tripel Karmeliet",            "brewery": "Brouwerij Bosteels",                 "style": "Tripel",       "desc": "Eines der popul\u00e4rsten belgischen Tripel, gebraut mit Hafer, Gerste und Weizen."},
    {"name": "Fou' Foune",                  "brewery": "Brasserie Cantillon",                "style": "Sour/Wild",   "desc": "Fantastisches traditionelles Lambic, das mit frischen Aprikosen gereift wird."},
    {"name": "Julius",                     "brewery": "Tree House Brewing Company",         "style": "NEIPA/Hazy IPA","desc": "Das IPA, das den Hazy-Trend weltweit startete. Tropische Saftigkeit pur."},
    {"name": "St. Bernardus Abt 12",       "brewery": "St. Bernardus",                      "style": "Quadrupel",    "desc": "Leichter verf\u00fcgbare Alternative zum Westvleteren 12 \u2013 oft gleich gut bewertet."},
    {"name": "Aventinus",                  "brewery": "Brauerei Schneider Weisse",           "style": "Bock/M\u00e4rzen","desc": "Kraftvoller, dunkler Weizenbock mit intensiven Bananen- und Nelkenaromen."}
]


def run_ml_pipeline():
    try:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            stats = json.load(f)
    except Exception as e:
        print(f"Konnte stats.json nicht lesen: {e}")
        return

    total_checkins = stats["overview"]["total_checkins"]

    # ============================================================
    # 1. Rating-Verteilung
    # ============================================================
    rated_beers = stats.get("rated_beers", [])

    if rated_beers:
        # ECHTE Ratings aus dem Untappd-Export vorhanden
        all_ratings = [b["avg_rating"] for b in rated_beers]
        avg_rating  = round(sum(all_ratings) / len(all_ratings), 2)

        # Verteilung aus echten Daten aufbauen
        ratings_count = {f"{x/4:.2f}": 0 for x in range(1, 21)}
        for r in all_ratings:
            key = f"{r:.2f}"
            if key in ratings_count:
                ratings_count[key] += 1
        ratings_source = "real"
        print(f"Echte Ratings gefunden: {len(rated_beers)} Biere bewertet, Ø {avg_rating}")
    else:
        # KEIN echtes Rating -- simulierte Normalverteilung als Platzhalter
        ratings_count = {f"{x/4:.2f}": 0 for x in range(1, 21)}
        sum_ratings   = 0
        tmp_state     = random.getstate()
        random.seed(42)
        for _ in range(total_checkins):
            val     = random.gauss(3.8, 0.55)
            val     = max(0.25, min(5.0, val))
            rounded = round(val * 4) / 4
            ratings_count[f"{rounded:.2f}"] += 1
            sum_ratings += rounded
        random.setstate(tmp_state)
        avg_rating     = round(sum_ratings / total_checkins, 2)
        ratings_source = "simulated"
        print("WARN: Keine echten Ratings in stats.json -- simulierte Verteilung wird verwendet.")
        print("      Loesung: parse_untappd.py erneut ausfuehren um echte Ratings zu extrahieren.")

    # ============================================================
    # 2. Top 10 Beste & Schlechteste Biere (NUR aus echten Ratings)
    # ============================================================
    if rated_beers:
        # Mindestens 1x bewertet; bei Gleichstand: mehr Check-ins = weiter oben
        sorted_desc = sorted(
            rated_beers,
            key=lambda b: (b["avg_rating"], b.get("rated_count", 1)),
            reverse=True
        )
        sorted_asc = sorted(
            rated_beers,
            key=lambda b: (b["avg_rating"], -b.get("rated_count", 1))
        )

        def fmt_list(lst):
            return [
                {
                    "beer":    b["beer"],
                    "brewery": b["brewery"],
                    "style":   b["style"],
                    "rating":  b["avg_rating"],
                    "count":   b.get("rated_count", 1)
                }
                for b in lst[:10]
            ]

        top_rated    = fmt_list(sorted_desc)
        lowest_rated = fmt_list(sorted_asc)
    else:
        # Ohne echte Daten: leere Listen -- Frontend zeigt Hinweis
        top_rated    = []
        lowest_rated = []

    # ============================================================
    # 3. KI Bier-Empfehlung (Content-Based, tagesbasiert)
    # ============================================================
    random.seed(datetime.now().strftime("%Y-%m-%d"))

    top_styles  = [s["style"] for s in stats.get("styles", [])[:5]]
    drunk_beers = {b["beer"] for b in stats.get("top_beers", [])}

    scored = []
    for b in GLOBAL_BEERS:
        if b["name"] not in drunk_beers:
            score  = 10 if b["style"] in top_styles else 0
            score += random.uniform(0, 5)
            scored.append((score, b))
    scored.sort(key=lambda x: x[0], reverse=True)
    best_match = scored[0][1] if scored else GLOBAL_BEERS[0]

    # ============================================================
    # 4. JSON Export
    # ============================================================
    ml_data = {
        "ratings": {
            "average":       avg_rating,
            "distribution":  ratings_count,
            "source":        ratings_source
        },
        "recommendation": {
            "beer":         best_match["name"],
            "brewery":      best_match["brewery"],
            "style":        best_match["style"],
            "description":  best_match["desc"],
            "match_reason": f"KI Match: Empfohlen aufgrund deiner hohen Check-in-Rate f\u00fcr {best_match['style']}."
        },
        "top_rated":    top_rated,
        "lowest_rated": lowest_rated,
        "ratings_source": ratings_source,
        "updated_at":   datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    tmp = ML_OUT_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(ml_data, f, indent=4, ensure_ascii=False)
    os.replace(tmp, ML_OUT_FILE)
    print(f"ML Pipeline abgeschlossen: {ML_OUT_FILE}")


if __name__ == "__main__":
    run_ml_pipeline()
