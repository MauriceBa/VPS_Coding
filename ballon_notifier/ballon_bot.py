import json
import os
import math
import time
import datetime
from zoneinfo import ZoneInfo

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from FlightRadar24 import FlightRadar24API

# --- EINSTELLUNGEN ---
TELEGRAM_TOKEN = "8745987610:AAGg7mDIT4vKMV-_uV8YvUk46lUBQaSy27U"
TIMEZONE = ZoneInfo("Europe/Berlin")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "bot_config.json")
STATE_FILE = os.path.join(BASE_DIR, "known_balloons.json")
STATS_FILE = os.path.join(BASE_DIR, "daily_stats.json")

config = {
    "home_lat": 50.770592730763454,
    "home_lon": 6.0958551248722275,
    "home_city": "Aachen",
    "temp_lat": 0.0,
    "temp_lon": 0.0,
    "temp_city": "",
    "temp_until": 0,
    "radius": 20,
    "chat_id": None
}

def load_data():
    global config
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            config.update(json.load(f))

def save_data():
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f)

def get_distance_and_direction(user_lat, user_lon, target_lat, target_lon):
    dist_km = geodesic((user_lat, user_lon), (target_lat, target_lon)).kilometers
    
    lat1 = math.radians(user_lat)
    lat2 = math.radians(target_lat)
    diff_long = math.radians(target_lon - user_lon)
    
    x = math.sin(diff_long) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(diff_long))
    
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    
    directions = ["N", "NO", "O", "SO", "S", "SW", "W", "NW", "N"]
    index = int(round(compass_bearing / 45.0)) % 8
    return round(dist_km, 1), directions[index]

def is_balloon(f):
    speed = f.ground_speed if f.ground_speed is not None else 0
    if speed > 60:
        return False
    if f.aircraft_code in ["BALL", "HBAL"]:
        return True
    reg = f.registration.upper() if f.registration else ""
    call = f.callsign.upper() if f.callsign else ""
    has_balloon_prefix = (
        reg.startswith("HB-") or call.startswith("HB-") or
        reg.startswith("D-O") or call.startswith("D-O") or
        reg.startswith("OO-B") or call.startswith("OO-B")
    )
    if has_balloon_prefix:
        return True
    return False

# --- BOT BEFEHLE ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    config["chat_id"] = update.message.chat_id
    save_data()
    await update.message.reply_text(
        "🎈 Ballon & Radar-Bot ist aktiv!\n\n"
        "Sende /help um eine Liste aller Befehle zu sehen."
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (
        "🤖 <b>Verfügbare Befehle:</b>\n\n"
        "<b>/start</b> - Startet den Bot und aktiviert Warnungen in diesem Chat\n"
        "<b>/help</b> - Zeigt diese Befehlsübersicht an\n"
        "<b>/status</b> - Zeigt aktuelle Koordinaten, Radien und temporäre Städte an\n"
        "<b>/radius &lt;Zahl&gt;</b> - Setzt den km-Radius für die automatischen 5-Minuten-Warnungen\n"
        "<b>/stadt &lt;Name&gt;</b> - Überschreibt deinen Standort temporär für 12 Stunden\n"
        "<b>/now</b> - Führt sofort einen Scan nach Ballons im aktuellen Radius aus\n"
        "<b>/flugzeuge</b> - Sucht sofort nach den 5 Flugzeugen, die dir am nächsten sind\n"
        "<b>/alltime</b> - Zeigt eine Gesamtstatistik aller bisher gefundenen Ballons\n"
    )
    await update.message.reply_text(msg, parse_mode="HTML")

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = f"🔍 <b>Aktuelle Einstellungen:</b>\n"
    msg += f"Radius für Echtzeit-Alarme: {config['radius']} km\n\n"
    msg += f"🏠 <b>Heimatort:</b>\nStadt: {config['home_city']}\n"
    if config["temp_until"] > time.time():
        remaining_hours = (config["temp_until"] - time.time()) / 3600
        msg += (f"\n⏳ <b>Temporärer Ort (noch {remaining_hours:.1f} Std aktiv):</b>\n"
                f"Stadt: {config['temp_city']}")
    await update.message.reply_text(msg, parse_mode="HTML")

async def set_radius(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        new_radius = int(context.args[0])
        config["radius"] = new_radius
        save_data()
        await update.message.reply_text(f"✅ Radius permanent auf {new_radius} km geändert.")
        context.job_queue.run_once(check_balloons_job, 1)
    except (IndexError, ValueError):
        await update.message.reply_text("Bitte benutze das Format: /radius 50")

async def set_city(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("Bitte benutze das Format: /stadt Name")
        return
    city_name = " ".join(context.args)
    geolocator = Nominatim(user_agent="balloon_tracker_bot")
    location = geolocator.geocode(city_name)
    if location:
        config["temp_lat"] = location.latitude
        config["temp_lon"] = location.longitude
        config["temp_city"] = location.address.split(',')[0]
        config["temp_until"] = time.time() + (12 * 3600)
        save_data()
        
        with open(STATE_FILE, "w") as f:
            json.dump([], f)
            
        await update.message.reply_text(
            f"✅ Standort <b>temporär für 12 Stunden</b> geändert auf:\n"
            f"<b>{config['temp_city']}</b>\n\n"
            f"<i>Starte sofortigen Suchlauf...</i>", 
            parse_mode="HTML"
        )
        context.job_queue.run_once(check_balloons_job, 1)
    else:
        await update.message.reply_text("❌ Stadt nicht gefunden. Bitte versuche es noch einmal.")

# NEU: /now Befehl (Sofort-Scan)
async def now(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(f"📡 Scanne den Radius von {config['radius']} km... bitte warten.")
    
    if config["temp_until"] > time.time():
        active_lat, active_lon, active_city = config["temp_lat"], config["temp_lon"], config["temp_city"]
    else:
        active_lat, active_lon, active_city = config["home_lat"], config["home_lon"], config["home_city"]

    fr_api = FlightRadar24API()
    bounds = fr_api.get_bounds_by_point(active_lat, active_lon, config["radius"] * 1000)
    
    try:
        flights = fr_api.get_flights(bounds=bounds)
        balloons = [f for f in flights if is_balloon(f)]
    except Exception as e:
        await update.message.reply_text("❌ Fehler beim Abrufen der Flightradar-Daten.")
        return

    found_in_radius = []
    
    # Filtere nochmal exakt nach Distanz (Da die Bounds quadratisch sind, der Radius aber ein Kreis ist)
    for b in balloons:
        dist_km, direction = get_distance_and_direction(active_lat, active_lon, b.latitude, b.longitude)
        if dist_km <= config["radius"]:
            found_in_radius.append((b, dist_km, direction))

    if not found_in_radius:
        await update.message.reply_text(f"Keine Ballons im Umkreis von {config['radius']} km um {active_city} gefunden.")
        return

    # Bekannte Ballons laden, damit wir nicht bei /now jedes Mal alle als "neu" in die .json packen
    known_balloons = []
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            known_balloons = json.load(f)

    # Sende die gefundenen Ballons
    for b, dist_km, direction in found_in_radius:
        aircraft_type = b.aircraft_code if b.aircraft_code else "Lighter-than-air (Ballon)"
        msg = (f"🎈 <b>HEISSLUFTBALLON BEI {active_city.upper()} GEFUNDEN!</b> 🎈\n\n"
               f"<b>Typ:</b> {aircraft_type}\n"
               f"<b>Position:</b> {dist_km} km in Richtung {direction}\n"
               f"<b>Höhe:</b> {b.altitude} ft\n"
               f"<b>Speed:</b> {b.ground_speed} kts\n"
               f"<b>Callsign/Reg:</b> {b.callsign} / {b.registration}\n\n"
               f"📍 https://www.flightradar24.com/{b.id}")
        await update.message.reply_text(msg, parse_mode="HTML")
        
        # In die Liste aufnehmen, damit der 5-Minuten-Job danach nicht sofort nochmal warnt
        if b.id not in known_balloons:
            known_balloons.append(b.id)

    # Speichern
    with open(STATE_FILE, "w") as f:
        json.dump(known_balloons, f)


async def flugzeuge(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📡 Scanne den Luftraum... das dauert einen kurzen Moment.")
    if config["temp_until"] > time.time():
        active_lat, active_lon, active_city = config["temp_lat"], config["temp_lon"], config["temp_city"]
    else:
        active_lat, active_lon, active_city = config["home_lat"], config["home_lon"], config["home_city"]

    fr_api = FlightRadar24API()
    bounds = fr_api.get_bounds_by_point(active_lat, active_lon, 100000)
    
    try:
        flights = fr_api.get_flights(bounds=bounds)
    except Exception as e:
        await update.message.reply_text("❌ Fehler beim Abrufen der Flightradar-Daten.")
        return

    if not flights:
        await update.message.reply_text("Gerade ist absolut kein Flugzeug im Umkreis von 100km in der Luft!")
        return

    flight_distances = []
    for f in flights:
        dist_km, direction = get_distance_and_direction(active_lat, active_lon, f.latitude, f.longitude)
        flight_distances.append((dist_km, direction, f))
        
    flight_distances.sort(key=lambda x: x[0])
    top_5 = flight_distances[:5]
    
    msg = f"✈️ <b>Die {len(top_5)} nächsten Flugzeuge bei {active_city}:</b>\n\n"
    for i, (dist, direction, f) in enumerate(top_5, 1):
        aircraft = f.aircraft_code if f.aircraft_code else "Unbekannter Typ"
        callsign = f.callsign if f.callsign else "Kein Callsign"
        msg += (f"<b>{i}. {aircraft}</b> ({callsign})\n"
                f"   📏 {dist} km in Richtung {direction}\n"
                f"   🎚️ Höhe: {f.altitude} ft | 💨 Speed: {f.ground_speed} kts\n"
                f"   📍 https://www.flightradar24.com/{f.id}\n\n")
    await update.message.reply_text(msg, parse_mode="HTML")

async def alltime(update: Update, context: ContextTypes.DEFAULT_TYPE):
    stats = {}
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, "r") as f:
            stats = json.load(f)
            
    all_10 = set()
    all_50 = set()
    all_100 = set()
    all_500 = set()
    all_1000 = set()
    
    for day, data in stats.items():
        all_10.update(data.get("10", []))
        all_50.update(data.get("50", []))
        all_100.update(data.get("100", []))
        all_500.update(data.get("500", []))
        all_1000.update(data.get("1000", []))
        
    msg = (f"📈 <b>Allzeit-Ballon-Statistik:</b>\n\n"
           f"Insgesamt wurden seit dem ersten Start des Bots folgende Ballons "
           f"um deine Heimatkoordinaten ({config['home_city']}) erfasst:\n\n"
           f"📍 Innerhalb 10 km: <b>{len(all_10)}</b>\n"
           f"📍 Innerhalb 50 km: <b>{len(all_50)}</b>\n"
           f"📍 Innerhalb 100 km: <b>{len(all_100)}</b>\n"
           f"📍 Innerhalb 500 km: <b>{len(all_500)}</b>\n"
           f"📍 Innerhalb 1000 km: <b>{len(all_1000)}</b>")
    await update.message.reply_text(msg, parse_mode="HTML")


# --- HINTERGRUND-TASKS ---

async def check_hourly_stats_job(context: ContextTypes.DEFAULT_TYPE):
    today_str = datetime.date.today().isoformat()
    stats = {}
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, "r") as f:
            stats = json.load(f)
            
    if today_str not in stats:
        stats[today_str] = {"10": [], "50": [], "100": [], "500": [], "1000": []}
    else:
        for dist_key in ["10", "50", "100", "500", "1000"]:
            if dist_key not in stats[today_str]:
                stats[today_str][dist_key] = []

    fr_api = FlightRadar24API()
    bounds = fr_api.get_bounds_by_point(config["home_lat"], config["home_lon"], 1000000)
    
    try:
        flights = fr_api.get_flights(bounds=bounds)
        balloons = [f for f in flights if is_balloon(f)]
    except Exception:
        return

    for b in balloons:
        dist_km = geodesic((config["home_lat"], config["home_lon"]), (b.latitude, b.longitude)).kilometers
        
        if dist_km <= 1000 and b.id not in stats[today_str]["1000"]:
            stats[today_str]["1000"].append(b.id)
        if dist_km <= 500 and b.id not in stats[today_str]["500"]:
            stats[today_str]["500"].append(b.id)
        if dist_km <= 100 and b.id not in stats[today_str]["100"]:
            stats[today_str]["100"].append(b.id)
        if dist_km <= 50 and b.id not in stats[today_str]["50"]:
            stats[today_str]["50"].append(b.id)
        if dist_km <= 10 and b.id not in stats[today_str]["10"]:
            stats[today_str]["10"].append(b.id)

    with open(STATS_FILE, "w") as f:
        json.dump(stats, f)


async def check_balloons_job(context: ContextTypes.DEFAULT_TYPE):
    if not config.get("chat_id"):
        return

    if config["temp_until"] > 0 and time.time() > config["temp_until"]:
        config["temp_until"] = 0
        save_data()
        await context.bot.send_message(
            chat_id=config["chat_id"], 
            text="⏱️ Die 12 Stunden sind abgelaufen! Der Radar scannt wieder den Heimatort (" + config["home_city"] + ")."
        )

    if config["temp_until"] > 0:
        active_lat, active_lon, active_city = config["temp_lat"], config["temp_lon"], config["temp_city"]
    else:
        active_lat, active_lon, active_city = config["home_lat"], config["home_lon"], config["home_city"]

    fr_api = FlightRadar24API()
    bounds = fr_api.get_bounds_by_point(active_lat, active_lon, config["radius"] * 1000)
    
    try:
        flights = fr_api.get_flights(bounds=bounds)
        balloons = [f for f in flights if is_balloon(f)]
    except Exception as e:
        return

    known_balloons = []
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            known_balloons = json.load(f)

    current_balloon_ids = []

    for b in balloons:
        dist_km, direction = get_distance_and_direction(active_lat, active_lon, b.latitude, b.longitude)
        
        if dist_km <= config["radius"]:
            current_balloon_ids.append(b.id)
            if b.id not in known_balloons:
                aircraft_type = b.aircraft_code if b.aircraft_code else "Lighter-than-air (Ballon)"
                
                msg = (f"🎈 <b>HEISSLUFTBALLON BEI {active_city.upper()} GESICHTET!</b> 🎈\n\n"
                       f"<b>Typ:</b> {aircraft_type}\n"
                       f"<b>Position:</b> {dist_km} km in Richtung {direction}\n"
                       f"<b>Höhe:</b> {b.altitude} ft\n"
                       f"<b>Speed:</b> {b.ground_speed} kts\n"
                       f"<b>Callsign/Reg:</b> {b.callsign} / {b.registration}\n\n"
                       f"📍 https://www.flightradar24.com/{b.id}")
                
                await context.bot.send_message(chat_id=config["chat_id"], text=msg, parse_mode="HTML")

    updated_known = [b_id for b_id in known_balloons if b_id in current_balloon_ids]
    for new_id in current_balloon_ids:
        if new_id not in updated_known:
            updated_known.append(new_id)

    with open(STATE_FILE, "w") as f:
        json.dump(updated_known, f)


async def reset_database_job(context: ContextTypes.DEFAULT_TYPE):
    chat_id = config.get("chat_id")
    if chat_id:
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        yesterday_str = yesterday.isoformat()
        
        stats = {}
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE, "r") as f:
                stats = json.load(f)
                
        if yesterday_str in stats:
            c10 = len(stats[yesterday_str].get("10", []))
            c50 = len(stats[yesterday_str].get("50", []))
            c100 = len(stats[yesterday_str].get("100", []))
            c500 = len(stats[yesterday_str].get("500", []))
            c1000 = len(stats[yesterday_str].get("1000", []))
            
            msg = (f"📊 <b>Ballon-Statistik für gestern ({yesterday.strftime('%d.%m.%Y')}):</b>\n\n"
                   f"Unterschiedliche Ballons um deine Heimatkoordinaten:\n"
                   f"📍 Innerhalb 10 km: <b>{c10}</b>\n"
                   f"📍 Innerhalb 50 km: <b>{c50}</b>\n"
                   f"📍 Innerhalb 100 km: <b>{c100}</b>\n"
                   f"📍 Innerhalb 500 km: <b>{c500}</b>\n"
                   f"📍 Innerhalb 1000 km: <b>{c1000}</b>")
        else:
            msg = (f"📊 <b>Ballon-Statistik für gestern ({yesterday.strftime('%d.%m.%Y')}):</b>\n\n"
                   f"<i>Es wurden für den gestrigen Tag noch keine Daten aufgezeichnet.</i>")
            
        await context.bot.send_message(chat_id=chat_id, text=msg, parse_mode="HTML")

    with open(STATE_FILE, "w") as f:
        json.dump([], f)
        
    if chat_id:
        await context.bot.send_message(
            chat_id=chat_id, 
            text="🔄 12:00 Uhr: Die Echtzeit-Datenbank der gesehenen Ballons wurde planmäßig zurückgesetzt."
        )

# --- MAIN ---

def main():
    load_data()
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("radius", set_radius))
    app.add_handler(CommandHandler("stadt", set_city))
    app.add_handler(CommandHandler("now", now))  # NEU HINZUGEFÜGT
    app.add_handler(CommandHandler("flugzeuge", flugzeuge))
    app.add_handler(CommandHandler("alltime", alltime))

    job_queue = app.job_queue
    job_queue.run_repeating(check_balloons_job, interval=300, first=10, job_kwargs={'misfire_grace_time': 60})
    job_queue.run_repeating(check_hourly_stats_job, interval=3600, first=20, job_kwargs={'misfire_grace_time': 300})
    
    reset_time = datetime.time(hour=12, minute=0, tzinfo=TIMEZONE)
    job_queue.run_daily(reset_database_job, time=reset_time, job_kwargs={'misfire_grace_time': 300})

    print("Bot läuft! Schreibe ihm /help in Telegram.")
    app.run_polling()

if __name__ == '__main__':
    main()