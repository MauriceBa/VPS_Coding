"""Telegram bot that tracks hot-air balloons near a home location.

The bot polls Flightradar24 every five minutes, logs sightings, and answers a set of
statistics commands. It is configured through ``bot_config.json`` and the environment
(see :class:`mauricefun.config.Settings`).

Run as a script::

    python -m mauricefun.balloons.bot
"""

from __future__ import annotations

import datetime
import logging
import time
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import asdict, dataclass
from typing import Any
from zoneinfo import ZoneInfo

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from mauricefun.balloons.detector import FlightLike, is_balloon
from mauricefun.balloons.geo import get_distance_and_direction
from mauricefun.balloons.stats import DISTANCE_BUCKETS, aggregate_distance_counts, day_keys
from mauricefun.balloons.storage import load_json, save_json
from mauricefun.config import Settings, get_settings
from mauricefun.exceptions import BalloonTrackerError, ConfigurationError
from mauricefun.logging_config import configure_logging

logger = logging.getLogger(__name__)

__all__ = ["BalloonConfig", "BalloonTracker", "main"]

TIMEZONE = ZoneInfo("Europe/Berlin")
_POLL_INTERVAL_SECONDS = 300
_HOURLY_INTERVAL_SECONDS = 3600
_TEMP_LOCATION_HOURS = 12
_MAP_FILE = "/tmp/balloon_map.png"
_NEARBY_RADIUS_METERS = 100_000
_STATS_RADIUS_METERS = 1_000_000

try:
    from staticmap import CircleMarker, StaticMap

    _STATICMAP_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    _STATICMAP_AVAILABLE = False


@dataclass
class BalloonConfig:
    """Persisted user configuration for the tracker."""

    home_lat: float = 50.770592730763454
    home_lon: float = 6.0958551248722275
    home_city: str = "Aachen"
    temp_lat: float = 0.0
    temp_lon: float = 0.0
    temp_city: str = ""
    temp_until: float = 0
    radius: int = 20
    chat_id: int | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> BalloonConfig:
        """Build a config from a (possibly partial) dict."""
        known = set(cls.__dataclass_fields__)
        return cls(**{key: value for key, value in data.items() if key in known})


class BalloonTracker:
    """Encapsulates the balloon tracker's state and Telegram handlers."""

    def __init__(
        self,
        settings: Settings | None = None,
        api_factory: Callable[[], Any] | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.data_dir = self.settings.balloon_data_dir
        self.config_file = self.data_dir / "bot_config.json"
        self.state_file = self.data_dir / "known_balloons.json"
        self.stats_file = self.data_dir / "daily_stats.json"
        self.flight_log_file = self.settings.balloon_flight_log_file
        self.config = self._load_config()
        self._api_factory = api_factory or _default_api_factory

    # -- persistence ------------------------------------------------------
    def _load_config(self) -> BalloonConfig:
        data = load_json(self.config_file, {})
        return BalloonConfig.from_dict(data) if isinstance(data, dict) else BalloonConfig()

    def _save_config(self) -> None:
        save_json(self.config_file, asdict(self.config))

    def _load_stats(self) -> dict[str, dict[str, list[str]]]:
        data = load_json(self.stats_file, {})
        return data if isinstance(data, dict) else {}

    def _save_stats(self, stats: dict[str, dict[str, list[str]]]) -> None:
        save_json(self.stats_file, stats)

    # -- helpers ----------------------------------------------------------
    def _active_location(self) -> tuple[float, float, str]:
        if self.config.temp_until > time.time():
            return self.config.temp_lat, self.config.temp_lon, self.config.temp_city
        return self.config.home_lat, self.config.home_lon, self.config.home_city

    def _fetch_balloons(self, bounds: Any = None) -> list[FlightLike]:
        api = self._api_factory()
        try:
            flights = api.get_flights(bounds=bounds) if bounds is not None else api.get_flights()
        except Exception as exc:
            logger.error("Failed to fetch Flightradar24 data: %s", exc)
            raise BalloonTrackerError("Flightradar24 request failed") from exc
        return [flight for flight in flights if is_balloon(flight)]

    @staticmethod
    def _distance_report(counts: dict[str, int]) -> str:
        return "\n".join(
            f"📍 Innerhalb {bucket} km: <b>{counts[bucket]}</b>" for bucket in DISTANCE_BUCKETS
        )

    # -- commands ---------------------------------------------------------
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/start`` – register the current chat for alerts."""
        if update.message is None:
            return
        self.config.chat_id = update.message.chat_id
        self._save_config()
        await update.message.reply_text(
            "🎈 Ballon & Radar-Bot ist aktiv!\n\nSende /help um eine Liste aller Befehle zu sehen."
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/help`` – list available commands."""
        if update.message is None:
            return
        message = (
            "🤖 <b>Verfügbare Befehle:</b>\n\n"
            "<b>/start</b> - Startet den Bot und aktiviert Warnungen in diesem Chat\n"
            "<b>/help</b> - Zeigt diese Befehlsübersicht an\n"
            "<b>/status</b> - Zeigt aktuelle Koordinaten, Radien und temporäre Städte an\n"
            "<b>/radius &lt;Zahl&gt;</b> - Setzt den km-Radius für die automatischen 5-Minuten-Warnungen\n"
            "<b>/stadt &lt;Name&gt;</b> - Überschreibt deinen Standort temporär für 12 Stunden\n"
            "<b>/global</b> - Zeigt globale Ballon-Anzahl & nächsten Ballon (mit Land)\n"
            "<b>/flugzeuge</b> - Sucht sofort nach den 5 Flugzeugen, die dir am nächsten sind\n"
            "<b>/alltime</b> - Zeigt eine Gesamtstatistik aller bisher gefundenen Ballons\n"
            "<b>/weekly</b> - Zeigt die Ballon-Statistik der letzten 7 Tage\n"
            "<b>/monthly</b> - Zeigt die Ballon-Statistik der letzten 30 Tage\n"
        )
        await update.message.reply_text(message, parse_mode="HTML")

    async def status(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/status`` – show the active configuration."""
        if update.message is None:
            return
        message = f"🔍 <b>Aktuelle Einstellungen:</b>\nRadius für Echtzeit-Alarme: {self.config.radius} km\n\n"
        message += f"🏠 <b>Heimatort:</b>\nStadt: {self.config.home_city}\n"
        if self.config.temp_until > time.time():
            remaining = (self.config.temp_until - time.time()) / 3600
            message += (
                f"\n⏳ <b>Temporärer Ort (noch {remaining:.1f} Std aktiv):</b>\n"
                f"Stadt: {self.config.temp_city}"
            )
        await update.message.reply_text(message, parse_mode="HTML")

    async def set_radius(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/radius <km>`` – persist the alert radius."""
        if update.message is None:
            return
        try:
            new_radius = int(context.args[0])
        except (IndexError, ValueError, TypeError):
            await update.message.reply_text("Bitte benutze das Format: /radius 50")
            return
        self.config.radius = new_radius
        self._save_config()
        await update.message.reply_text(f"✅ Radius permanent auf {new_radius} km geändert.")
        if context.job_queue:
            context.job_queue.run_once(self.check_balloons_job, 1)

    async def set_city(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/stadt <name>`` – set a temporary home location for 12 hours."""
        if update.message is None:
            return
        if not context.args:
            await update.message.reply_text("Bitte benutze das Format: /stadt Name")
            return

        from geopy.geocoders import Nominatim

        location = Nominatim(user_agent="balloon_tracker_bot").geocode(" ".join(context.args))
        if not location:
            await update.message.reply_text(
                "❌ Stadt nicht gefunden. Bitte versuche es noch einmal."
            )
            return

        self.config.temp_lat = location.latitude
        self.config.temp_lon = location.longitude
        self.config.temp_city = location.address.split(",")[0]
        self.config.temp_until = time.time() + (_TEMP_LOCATION_HOURS * 3600)
        self._save_config()
        save_json(self.state_file, [])
        await update.message.reply_text(
            f"✅ Standort <b>temporär für 12 Stunden</b> geändert auf:\n"
            f"<b>{self.config.temp_city}</b>\n\n<i>Starte sofortigen Suchlauf...</i>",
            parse_mode="HTML",
        )
        if context.job_queue:
            context.job_queue.run_once(self.check_balloons_job, 1)

    async def global_cmd(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/global`` – worldwide balloon count and nearest balloon to home."""
        if update.message is None:
            return
        await update.message.reply_text("🌍 Scanne global nach Ballons... bitte warten.")
        try:
            balloons = self._fetch_balloons()
        except BalloonTrackerError:
            await update.message.reply_text(
                "❌ Fehler beim Abrufen der Flightradar-Daten. Details wurden geloggt."
            )
            return

        if not balloons:
            await update.message.reply_text("🌍 Keine Ballons weltweit gefunden!")
            return

        nearest = min(
            balloons,
            key=lambda balloon: get_distance_and_direction(
                self.config.home_lat, self.config.home_lon, balloon.latitude, balloon.longitude
            )[0],
        )
        distance, direction = get_distance_and_direction(
            self.config.home_lat, self.config.home_lon, nearest.latitude, nearest.longitude
        )
        country = self._reverse_country(nearest.latitude, nearest.longitude)
        aircraft_type = nearest.aircraft_code or "Lighter-than-air (Ballon)"
        message = (
            f"🌍 <b>GLOBALE BALLON-ÜBERSICHT</b> 🎈\n\n"
            f"<b>Weltweit gesichtet:</b> {len(balloons)} Ballons\n\n"
            f"<b>NÄCHSTER BALLON:</b>\n"
            f"📍 {country}\n📏 {distance} km in Richtung {direction}\n"
            f"🎈 Typ: {aircraft_type}\n"
            f"📊 Höhe: {nearest.altitude} ft | 💨 Speed: {nearest.ground_speed} kts\n"
            f"📛 Callsign/Reg: {nearest.callsign} / {nearest.registration}\n\n"
            f"📍 https://www.flightradar24.com/{nearest.id}"
        )
        await update.message.reply_text(message, parse_mode="HTML")

    async def flugzeuge(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/flugzeuge`` – the five closest aircraft to the active location."""
        if update.message is None:
            return
        await update.message.reply_text("📡 Scanne den Luftraum... das dauert einen kurzen Moment.")
        lat, lon, city = self._active_location()
        api = self._api_factory()
        bounds = api.get_bounds_by_point(lat, lon, _NEARBY_RADIUS_METERS)
        try:
            flights = api.get_flights(bounds=bounds)
        except Exception as exc:
            logger.error("Failed to fetch flights: %s", exc)
            await update.message.reply_text(
                "❌ Fehler beim Abrufen der Flightradar-Daten. Details wurden geloggt."
            )
            return

        if not flights:
            await update.message.reply_text(
                "Gerade ist absolut kein Flugzeug im Umkreis von 100km in der Luft!"
            )
            return

        ranked = sorted(
            flights,
            key=lambda flight: get_distance_and_direction(
                lat, lon, flight.latitude, flight.longitude
            )[0],
        )[:5]
        message = f"✈️ <b>Die {len(ranked)} nächsten Flugzeuge bei {city}:</b>\n\n"
        for index, flight in enumerate(ranked, 1):
            distance, direction = get_distance_and_direction(
                lat, lon, flight.latitude, flight.longitude
            )
            aircraft = flight.aircraft_code or "Unbekannter Typ"
            callsign = flight.callsign or "Kein Callsign"
            message += (
                f"<b>{index}. {aircraft}</b> ({callsign})\n"
                f"   📏 {distance} km in Richtung {direction}\n"
                f"   🎚️ Höhe: {flight.altitude} ft | 💨 Speed: {flight.ground_speed} kts\n"
                f"   📍 https://www.flightradar24.com/{flight.id}\n\n"
            )
        await update.message.reply_text(message, parse_mode="HTML")

    async def _send_distance_stats(self, update: Update, title: str, days: list[str]) -> None:
        if update.message is None:
            return
        counts = aggregate_distance_counts(self._load_stats(), days)
        await update.message.reply_text(
            f"{title}\n\n{self._distance_report(counts)}", parse_mode="HTML"
        )

    async def alltime(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/alltime`` – statistics across every recorded day."""
        if update.message is None:
            return
        stats = self._load_stats()
        counts = aggregate_distance_counts(stats, list(stats.keys()))
        message = (
            f"📈 <b>Allzeit-Ballon-Statistik:</b>\n\n"
            f"Insgesamt wurden seit dem ersten Start des Bots folgende Ballons um deine "
            f"Heimatkoordinaten ({self.config.home_city}) erfasst:\n\n"
            f"{self._distance_report(counts)}"
        )
        await update.message.reply_text(message, parse_mode="HTML")

    async def weekly(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/weekly`` – statistics for the last 7 days."""
        await self._send_distance_stats(
            update, "📊 <b>Wochenstatistik (letzte 7 Tage):</b>", day_keys(datetime.date.today(), 7)
        )

    async def monthly(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """``/monthly`` – statistics for the last 30 days."""
        await self._send_distance_stats(
            update,
            "📈 <b>Monatsstatistik (letzte 30 Tage):</b>",
            day_keys(datetime.date.today(), 30),
        )

    # -- background jobs --------------------------------------------------
    async def check_hourly_stats_job(self, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Record the distinct balloons currently within each distance bucket."""
        today = datetime.date.today().isoformat()
        stats = self._load_stats()
        day_stats = stats.setdefault(today, {bucket: [] for bucket in DISTANCE_BUCKETS})
        for bucket in DISTANCE_BUCKETS:
            day_stats.setdefault(bucket, [])

        api = self._api_factory()
        bounds = api.get_bounds_by_point(
            self.config.home_lat, self.config.home_lon, _STATS_RADIUS_METERS
        )
        try:
            balloons = self._fetch_balloons(bounds)
        except BalloonTrackerError:
            return

        for balloon in balloons:
            distance, _ = get_distance_and_direction(
                self.config.home_lat, self.config.home_lon, balloon.latitude, balloon.longitude
            )
            for bucket in DISTANCE_BUCKETS:
                if distance <= int(bucket) and balloon.id not in day_stats[bucket]:
                    day_stats[bucket].append(balloon.id)
        self._save_stats(stats)

    async def check_balloons_job(self, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Poll for balloons and alert the configured chat within the radius."""
        chat_id = self.config.chat_id
        if not chat_id:
            return

        if 0 < self.config.temp_until <= time.time():
            self.config.temp_until = 0
            self._save_config()
            await context.bot.send_message(
                chat_id=chat_id,
                text=f"⏱️ Die 12 Stunden sind abgelaufen! Der Radar scannt wieder den Heimatort ({self.config.home_city}).",
            )

        lat, lon, city = self._active_location()
        try:
            balloons = self._fetch_balloons()
        except BalloonTrackerError:
            return

        known: list[str] = load_json(self.state_file, [])
        current_ids: list[str] = []
        for balloon in balloons:
            distance, direction = get_distance_and_direction(
                lat, lon, balloon.latitude, balloon.longitude
            )
            current_ids.append(balloon.id)
            self._log_flight(balloon)
            if distance <= self.config.radius and balloon.id not in known:
                await self._notify_balloon(context, balloon, distance, direction, city)

        updated = [balloon_id for balloon_id in known if balloon_id in current_ids]
        updated.extend(balloon_id for balloon_id in current_ids if balloon_id not in updated)
        save_json(self.state_file, updated)

    async def _notify_balloon(
        self,
        context: ContextTypes.DEFAULT_TYPE,
        balloon: FlightLike,
        distance: float,
        direction: str,
        city: str,
    ) -> None:
        chat_id = self.config.chat_id
        if not chat_id:
            return
        aircraft_type = balloon.aircraft_code or "Lighter-than-air (Ballon)"
        message = (
            f"🎈 <b>HEISSLUFTBALLON BEI {city.upper()} GESICHTET!</b> 🎈\n\n"
            f"<b>Typ:</b> {aircraft_type}\n"
            f"<b>Position:</b> {distance} km in Richtung {direction}\n"
            f"<b>Höhe:</b> {balloon.altitude} ft\n"
            f"<b>Speed:</b> {balloon.ground_speed} kts\n"
            f"<b>Callsign/Reg:</b> {balloon.callsign} / {balloon.registration}\n\n"
            f"📍 https://www.flightradar24.com/{balloon.id}"
        )
        map_path = self._generate_map(balloon.latitude, balloon.longitude)
        if map_path:
            try:
                with open(map_path, "rb") as photo:
                    await context.bot.send_photo(chat_id=chat_id, photo=photo)
            except OSError as exc:
                logger.error("Failed to send map: %s", exc)
        photo_url = self._balloon_photo(balloon.callsign, balloon.registration)
        if photo_url:
            try:
                await context.bot.send_photo(chat_id=chat_id, photo=photo_url)
            except Exception as exc:
                logger.error("Failed to send photo: %s", exc)
        await context.bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")

    async def reset_database_job(self, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Daily noon job: report yesterday's stats and reset the seen-balloon DB."""
        chat_id = self.config.chat_id
        yesterday = datetime.date.today() - datetime.timedelta(days=1)
        stats = self._load_stats()
        day_stats = stats.get(yesterday.isoformat())
        if chat_id and day_stats:
            counts = {bucket: len(day_stats.get(bucket, [])) for bucket in DISTANCE_BUCKETS}
            message = (
                f"📊 <b>Ballon-Statistik für gestern ({yesterday.strftime('%d.%m.%Y')}):</b>\n\n"
                f"Unterschiedliche Ballons um deine Heimatkoordinaten:\n{self._distance_report(counts)}"
            )
        else:
            message = (
                f"📊 <b>Ballon-Statistik für gestern ({yesterday.strftime('%d.%m.%Y')}):</b>\n\n"
                f"<i>Es wurden für den gestrigen Tag noch keine Daten aufgezeichnet.</i>"
            )
        if chat_id:
            await context.bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")

        save_json(self.state_file, [])
        if chat_id:
            await context.bot.send_message(
                chat_id=chat_id,
                text="🔄 12:00 Uhr: Die Echtzeit-Datenbank der gesehenen Ballons wurde planmäßig zurückgesetzt.",
            )

    # -- media / logging helpers -----------------------------------------
    def _generate_map(self, balloon_lat: float, balloon_lon: float) -> str | None:
        if not _STATICMAP_AVAILABLE:
            return None
        try:
            static_map = StaticMap(600, 400)
            static_map.add_marker(
                CircleMarker((self.config.home_lon, self.config.home_lat), "blue", 10)
            )
            static_map.add_marker(CircleMarker((balloon_lon, balloon_lat), "red", 10))
            static_map.render().save(_MAP_FILE)
            return _MAP_FILE
        except Exception as exc:
            logger.error("Map generation failed: %s", exc)
            return None

    @staticmethod
    def _balloon_photo(callsign: str | None, registration: str | None) -> str | None:
        query = (callsign or registration or "").strip()
        if not query:
            return None
        try:
            url = (
                "https://en.wikipedia.org/w/api.php?action=query&titles="
                f"{urllib.parse.quote(query)}&prop=pageimages&format=json&pithumbsize=400"
            )
            with urllib.request.urlopen(url, timeout=5) as response:
                import json

                data = json.loads(response.read())
            for page in data.get("query", {}).get("pages", {}).values():
                if "thumbnail" in page:
                    return str(page["thumbnail"]["source"])
        except Exception as exc:
            logger.error("Wikipedia lookup failed: %s", exc)
        return None

    def _log_flight(self, balloon: FlightLike) -> None:
        try:
            entries = load_json(self.flight_log_file, [])
            entries.append(
                {
                    "id": balloon.id,
                    "callsign": balloon.callsign,
                    "registration": balloon.registration,
                    "lat": balloon.latitude,
                    "lon": balloon.longitude,
                    "altitude": balloon.altitude,
                    "ground_speed": balloon.ground_speed,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "date": datetime.date.today().isoformat(),
                }
            )
            save_json(self.flight_log_file, entries)
        except Exception as exc:
            logger.error("Failed to log flight: %s", exc)

    @staticmethod
    def _reverse_country(lat: float, lon: float) -> str:
        try:
            from geopy.geocoders import Nominatim

            location = Nominatim(user_agent="ballon_bot").reverse((lat, lon), language="de")
            if location and location.raw and "address" in location.raw:
                return str(location.raw["address"].get("country", "Unbekannt"))
        except Exception as exc:
            logger.error("Reverse geocoding failed: %s", exc)
        return "Unbekannt"

    # -- wiring -----------------------------------------------------------
    def build_application(self) -> Application:
        """Create and configure the Telegram application."""
        token = self.settings.telegram_bot_token
        if not token:
            raise ConfigurationError("TELEGRAM_BOT_TOKEN must be set")

        application = Application.builder().token(token).build()
        for command, handler in (
            ("start", self.start),
            ("help", self.help_command),
            ("status", self.status),
            ("radius", self.set_radius),
            ("stadt", self.set_city),
            ("global", self.global_cmd),
            ("flugzeuge", self.flugzeuge),
            ("alltime", self.alltime),
            ("weekly", self.weekly),
            ("monthly", self.monthly),
        ):
            application.add_handler(CommandHandler(command, handler))

        job_queue = application.job_queue
        if job_queue:
            job_queue.run_repeating(
                self.check_balloons_job,
                interval=_POLL_INTERVAL_SECONDS,
                first=10,
                job_kwargs={"misfire_grace_time": 60},
            )
            job_queue.run_repeating(
                self.check_hourly_stats_job,
                interval=_HOURLY_INTERVAL_SECONDS,
                first=20,
                job_kwargs={"misfire_grace_time": 300},
            )
            job_queue.run_daily(
                self.reset_database_job,
                time=datetime.time(hour=12, minute=0, tzinfo=TIMEZONE),
                job_kwargs={"misfire_grace_time": 300},
            )
        return application


def _default_api_factory() -> Any:
    from flightradar24 import Api as FlightRadar24API

    return FlightRadar24API()


def main() -> None:
    """Entrypoint for the ``mauricefun-balloons`` console script."""
    configure_logging(log_file=str(get_settings().balloon_data_dir / "ballon_bot.log"))
    tracker = BalloonTracker()
    logger.info("Bot starting; send /help in Telegram.")
    tracker.build_application().run_polling()


if __name__ == "__main__":  # pragma: no cover
    main()
