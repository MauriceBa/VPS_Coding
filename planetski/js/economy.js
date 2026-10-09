/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Wirtschaftssystem
 */

// ===== Konstanten =====
const START_MONEY = 100000; // Startkapital
const START_REPUTATION = 50; // 0-100
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_HOUR = 3600;
const DAY_TICKET_BUYER_SHARE = 0.3; // 30% kaufen Tagesticket
const MAINTENANCE_COST_FACTOR = 0.001;
const STAFF_PER_LIFT = 3;
const STAFF_PER_BUILDING = 2;
const STAFF_COST_PER_HOUR = 25;
const ENERGY_COST_PER_KW = 0.15; // 15ct/kWh
const KW_PER_CAPACITY = 100;
const DEFAULT_KW = 10;
const VISITOR_RATE_PER_CAPACITY = 0.1;
const REPUTATION_MODIFIER_BASE = 0.5;
const REPUTATION_SCALE = 100;
const HUT_MAX_VISITOR_FACTOR = 10;
const FOOD_VISITOR_SHARE = 0.5;
const DAYS_PER_SEASON = 90;
const CHEAT_BONUS = 10000000; // 10 Millionen

class Economy {
  /**
   * Erstellt ein neues Wirtschaftssystem mit Startwerten.
   */
  constructor() {
    this.money = START_MONEY; // Startkapital
    this.reputation = START_REPUTATION; // 0-100
    this.visitors = 0;
    this.dailyVisitors = 0;
    this.totalVisitors = 0;

    // Einkommensströme
    this.liftTickets = 0;
    this.foodRevenue = 0;
    this.rentalRevenue = 0;
    this.hotelRevenue = 0;

    // Ausgaben
    this.maintenance = 0;
    this.staffCosts = 0;
    this.energyCosts = 0;

    // Statistiken
    this.day = 1;
    this.season = "winter";
    this.weather = "sunny";

    // Preise
    this.prices = {
      dayTicket: 55,
      halfDay: 35,
      seasonTicket: 800,
      skiRental: 25,
      food: 15,
      hotel: 120,
    };
  }

  /**
   * Aktualisiert Besucher, Einnahmen, Ausgaben und Geld.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @param {Array} lifts - Liste der Lifte.
   * @param {Array} buildings - Liste der Gebäude.
   * @returns {void}
   */
  update(deltaTime, lifts, buildings) {
    // Besucher basierend auf Reputation und Wetter generieren
    this.generateVisitors(deltaTime, lifts);

    // Einnahmen berechnen
    this.calculateRevenue(deltaTime, lifts, buildings);

    // Ausgaben berechnen
    this.calculateExpenses(deltaTime, lifts, buildings);

    // Geld aktualisieren
    this.money +=
      (this.liftTickets + this.foodRevenue + this.rentalRevenue + this.hotelRevenue) * deltaTime;
    this.money -= (this.maintenance + this.staffCosts + this.energyCosts) * deltaTime;
  }

  /**
   * Generiert neue Besucher basierend auf Liftkapazität, Wetter und Reputation.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @param {Array} lifts - Liste der Lifte.
   * @returns {void}
   */
  generateVisitors(deltaTime, lifts) {
    // Basis-Besucherzahl basierend auf Liftkapazität
    const totalCapacity = lifts.reduce((sum, lift) => {
      return sum + (lift.config ? lift.config.capacity : 0);
    }, 0);

    // Wetter-Modifier
    const weatherMod =
      {
        sunny: 1.2,
        cloudy: 1.0,
        snowing: 1.3,
        foggy: 0.6,
        stormy: 0.2,
      }[this.weather] || 1.0;

    // Reputation-Modifier
    const repMod = REPUTATION_MODIFIER_BASE + this.reputation / REPUTATION_SCALE;

    // Neue Besucher
    const newVisitors = totalCapacity * VISITOR_RATE_PER_CAPACITY * weatherMod * repMod * deltaTime;
    this.dailyVisitors += newVisitors;
    this.totalVisitors += newVisitors;
    this.visitors = Math.floor(this.dailyVisitors);
  }

  /**
   * Berechnet Einnahmen pro Sekunde (Liftkarten, Gastronomie, Hotels).
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @param {Array} lifts - Liste der Lifte.
   * @param {Array} buildings - Liste der Gebäude.
   * @returns {void}
   */
  calculateRevenue(deltaTime, lifts, buildings) {
    // Liftkarten
    const ticketSales = this.dailyVisitors * this.prices.dayTicket * DAY_TICKET_BUYER_SHARE;
    this.liftTickets = ticketSales / SECONDS_PER_DAY; // Pro Sekunde

    // Gastronomie
    const huts = buildings.filter((b) => b.type === "hut" || b.type === "restaurant");
    const foodSales = huts.reduce((sum, hut) => {
      const visitors = Math.min(
        hut.config.incomePerVisitor * HUT_MAX_VISITOR_FACTOR,
        this.dailyVisitors * FOOD_VISITOR_SHARE,
      );
      return sum + visitors * this.prices.food;
    }, 0);
    this.foodRevenue = foodSales / SECONDS_PER_DAY;

    // Hotels
    const hotels = buildings.filter((b) => b.type === "hotel" || b.type === "hostel");
    this.hotelRevenue =
      hotels.reduce((sum, hotel) => sum + hotel.config.income, 0) / SECONDS_PER_DAY;
  }

  /**
   * Berechnet Ausgaben pro Sekunde (Wartung, Personal, Energie).
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @param {Array} lifts - Liste der Lifte.
   * @param {Array} buildings - Liste der Gebäude.
   * @returns {void}
   */
  calculateExpenses(deltaTime, lifts, buildings) {
    // Wartung pro Lift
    this.maintenance =
      lifts.reduce((sum, lift) => {
        const baseCost = lift.config ? lift.config.cost * MAINTENANCE_COST_FACTOR : 0;
        return sum + baseCost;
      }, 0) / SECONDS_PER_DAY;

    // Personal-Kosten
    this.staffCosts =
      ((lifts.length * STAFF_PER_LIFT + buildings.length * STAFF_PER_BUILDING) *
        STAFF_COST_PER_HOUR) /
      SECONDS_PER_HOUR;

    // Energie
    this.energyCosts =
      lifts.reduce((sum, lift) => {
        const kw = lift.config ? lift.config.capacity / KW_PER_CAPACITY : DEFAULT_KW;
        return sum + kw * ENERGY_COST_PER_KW; // 15ct/kWh
      }, 0) / SECONDS_PER_HOUR;
  }

  /**
   * Wechselt zum nächsten Tag: Zähler zurücksetzen, Wetter/Saison ändern.
   * @returns {void}
   */
  nextDay() {
    this.day++;
    this.dailyVisitors = 0;

    // Wetter ändern
    const weathers = ["sunny", "sunny", "cloudy", "cloudy", "snowing", "foggy"];
    this.weather = weathers[Math.floor(Math.random() * weathers.length)];

    // Saison-Wechsel
    if (this.day > DAYS_PER_SEASON) {
      this.day = 1;
      this.season = this.season === "winter" ? "summer" : "winter";
    }
  }

  /**
   * Liefert die aktuellen Spielstatistiken.
   * @returns {Object} Statistiken (Geld, Besucher, Einnahmen, Ausgaben).
   */
  getStats() {
    return {
      money: Math.floor(this.money),
      visitors: this.visitors,
      totalVisitors: Math.floor(this.totalVisitors),
      reputation: Math.floor(this.reputation),
      day: this.day,
      season: this.season,
      weather: this.weather,
      income: {
        liftTickets: Math.floor(this.liftTickets * SECONDS_PER_DAY),
        food: Math.floor(this.foodRevenue * SECONDS_PER_DAY),
        hotel: Math.floor(this.hotelRevenue * SECONDS_PER_DAY),
      },
      expenses: {
        maintenance: Math.floor(this.maintenance * SECONDS_PER_DAY),
        staff: Math.floor(this.staffCosts * SECONDS_PER_DAY),
        energy: Math.floor(this.energyCosts * SECONDS_PER_DAY),
      },
    };
  }

  /**
   * Prüft, ob genug Geld vorhanden ist.
   * @param {number} amount - Benötigter Betrag.
   * @returns {boolean} True, wenn das Geld ausreicht.
   */
  canAfford(amount) {
    return this.money >= amount;
  }

  /**
   * Gibt Geld aus, falls verfügbar.
   * @param {number} amount - Auszugebender Betrag.
   * @returns {boolean} True, wenn die Zahlung erfolgreich war.
   */
  spend(amount) {
    if (this.canAfford(amount)) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  /**
   * Fügt Geld hinzu.
   * @param {number} amount - Betrag.
   * @returns {void}
   */
  earn(amount) {
    this.money += amount;
  }

  /**
   * Cheatcode: Unendlich Geld.
   * @returns {string} Cheat-Bestätigung.
   */
  cheatMoney() {
    this.money += CHEAT_BONUS;
    return "💰 CHEAT ACTIVATED: +10,000,000€!";
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Economy };
}
