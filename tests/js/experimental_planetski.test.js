/**
 * Tests für die reinen (DOM-freien) Logikfunktionen:
 * - js/experimental/ Module (Experimental-Seite)
 * - planetski/js/ Module (Wirtschafts-Mathe, Daten-Kataloge)
 */
import { describe, it, expect } from "vitest";
import { generateAIResponse, AI_KNOWLEDGE } from "../../js/experimental/aiChat.js";
import { computeCodingHours, formatCodingDuration } from "../../js/experimental/dashboard.js";
import { matchesKonamiSequence, pushKonamiKey } from "../../js/experimental/konami.js";
import { isCorrectRiddleAnswer } from "../../js/experimental/riddle.js";
import {
  createEggHuntState,
  recordEggFound,
  TOTAL_EGGS,
} from "../../js/experimental/easterEggs.js";
import { computeDragRotation, computeRaycastNDC } from "../../js/experimental/threeRoom.js";
import { Economy } from "../../planetski/js/economy.js";
import { LIFT_TYPES } from "../../planetski/js/lifts.js";
import { BUILDING_TYPES } from "../../planetski/js/buildings.js";

// ===== KI-Chat =====
describe("generateAIResponse", () => {
  it("beantwortet Technologien-Fragen", () => {
    expect(generateAIResponse("Was sind deine Technologien?")).toBe(AI_KNOWLEDGE.technologien);
    expect(generateAIResponse("Erzähl mir von deinem Tech Stack!")).toBe(AI_KNOWLEDGE.technologien);
  });

  it("beantwortet Projekt-Fragen", () => {
    expect(generateAIResponse("Was sind deine aktuellen Projekte?")).toBe(AI_KNOWLEDGE.projekte);
    expect(generateAIResponse("Woran arbeitest du gerade?")).toBe(AI_KNOWLEDGE.projekte);
  });

  it("beantwortet Lern-Fragen", () => {
    expect(generateAIResponse("Was lernst du gerade?")).toBe(AI_KNOWLEDGE.lerne);
  });

  it("beantwortet Buch-Fragen", () => {
    expect(generateAIResponse("Welches Buch liest du?")).toBe(AI_KNOWLEDGE.buch);
  });

  it("beantwortet Kaffee-Fragen", () => {
    expect(generateAIResponse("Kaffee?")).toBe(AI_KNOWLEDGE.kaffee);
    expect(generateAIResponse("Coffee?")).toBe(AI_KNOWLEDGE.kaffee);
  });

  it("beantwortet Hobby-Fragen", () => {
    expect(generateAIResponse("Was sind deine Hobbys?")).toBe(AI_KNOWLEDGE.hobby);
  });

  it("beantwortet Berlin-Fragen", () => {
    expect(generateAIResponse("Wohnst du in Berlin?")).toBe(AI_KNOWLEDGE.berlin);
  });

  it("beantwortet Ziel-Fragen", () => {
    expect(generateAIResponse("Was sind deine Ziele?")).toBe(AI_KNOWLEDGE.ziele);
  });

  it("beantwortet Begrüßungen", () => {
    expect(generateAIResponse("Hallo!")).toBe(
      "Hey! 👋 Schön, dass du hier bist! Was möchtest du über mich wissen?",
    );
    expect(generateAIResponse("HI")).toBe(
      "Hey! 👋 Schön, dass du hier bist! Was möchtest du über mich wissen?",
    );
  });

  it("nutzt die Default-Antwort bei unbekannten Fragen", () => {
    expect(generateAIResponse("Was ist der Sinn des Lebens?")).toBe(AI_KNOWLEDGE.default);
  });

  it("ist case-insensitive", () => {
    expect(generateAIResponse("TECHNOLOGIEN")).toBe(AI_KNOWLEDGE.technologien);
  });
});

// ===== Dashboard: Coding-Zeit =====
describe("computeCodingHours", () => {
  it("ist 0h 0m zur Startzeit (09:00)", () => {
    expect(computeCodingHours(new Date(2026, 5, 15, 9, 0, 0))).toEqual({ hours: 0, minutes: 0 });
  });

  it("berechnet Stunden und Minuten korrekt", () => {
    expect(computeCodingHours(new Date(2026, 5, 15, 10, 30, 0))).toEqual({ hours: 1, minutes: 30 });
    expect(computeCodingHours(new Date(2026, 5, 15, 12, 5, 30))).toEqual({ hours: 3, minutes: 5 });
  });

  it("begrenzt Stunden auf 8", () => {
    expect(computeCodingHours(new Date(2026, 5, 15, 18, 45, 0))).toEqual({ hours: 8, minutes: 45 });
  });

  it("begrenzt Minuten auf 59", () => {
    expect(computeCodingHours(new Date(2026, 5, 15, 23, 59, 0))).toEqual({ hours: 8, minutes: 59 });
  });

  it("zeigt 0h 0m vor der Startzeit (negativ → 0)", () => {
    expect(computeCodingHours(new Date(2026, 5, 15, 8, 0, 0))).toEqual({ hours: 0, minutes: 0 });
  });
});

describe("formatCodingDuration", () => {
  it('formatiert als "Xh Ym"', () => {
    expect(formatCodingDuration(8, 59)).toBe("8h 59m");
    expect(formatCodingDuration(0, 0)).toBe("0h 0m");
  });
});

// ===== Konami-Code =====
describe("Konami-Code", () => {
  it("erkennt die komplette Sequenz", () => {
    expect(
      matchesKonamiSequence([
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
      ]),
    ).toBe(true);
  });

  it("erkennt unvollständige/falsche Sequenzen nicht", () => {
    expect(matchesKonamiSequence(["ArrowUp"])).toBe(false);
    expect(matchesKonamiSequence([])).toBe(false);
    expect(
      matchesKonamiSequence([
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "c",
      ]),
    ).toBe(false);
  });

  it("kürzt den Puffer auf die maximale Länge", () => {
    const buffer = pushKonamiKey(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"], "k");
    expect(buffer).toHaveLength(10);
    expect(buffer[0]).toBe("b");
    expect(buffer[9]).toBe("k");
  });

  it("baut die Sequenz Schritt für Schritt auf", () => {
    const sequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let buffer = [];
    for (const key of sequence) {
      buffer = pushKonamiKey(buffer, key);
    }
    expect(matchesKonamiSequence(buffer)).toBe(true);
  });
});

// ===== Rätsel =====
describe("isCorrectRiddleAnswer", () => {
  it("akzeptiert alle richtigen Antworten", () => {
    for (const answer of ["karte", "karten", "landkarte", "landkarten", "map"]) {
      expect(isCorrectRiddleAnswer(answer)).toBe(true);
    }
  });

  it("ist case-insensitive und trimmt", () => {
    expect(isCorrectRiddleAnswer("KARTE")).toBe(true);
    expect(isCorrectRiddleAnswer("  Landkarten  ")).toBe(true);
  });

  it("lehnt falsche Antworten ab", () => {
    expect(isCorrectRiddleAnswer("berg")).toBe(false);
    expect(isCorrectRiddleAnswer("")).toBe(false);
  });
});

// ===== Easter Eggs =====
describe("Easter-Egg-Jagd", () => {
  it("startet leer", () => {
    const state = createEggHuntState();
    expect(state.count).toBe(0);
    expect(state.found.size).toBe(0);
  });

  it("zählt gefundene Eggs hoch", () => {
    let state = createEggHuntState();
    state = recordEggFound(state, 1);
    expect(state.count).toBe(1);
    expect(state.complete).toBe(false);
  });

  it("ignoriert doppelt gefundene Eggs", () => {
    let state = createEggHuntState();
    state = recordEggFound(state, 1);
    const result = recordEggFound(state, 1);
    expect(result.count).toBe(1);
    expect(result.found).toBe(state.found); // gleiche Referenz = kein neuer Fund
  });

  it("ist komplett, wenn alle 5 Eggs gefunden sind", () => {
    let state = createEggHuntState();
    for (let i = 1; i <= TOTAL_EGGS; i++) {
      state = recordEggFound(state, i);
    }
    expect(state.count).toBe(5);
    expect(state.complete).toBe(true);
  });
});

// ===== Three.js-Raum: reine Mathematik =====
describe("computeDragRotation", () => {
  it("skaliert das Delta mit der Empfindlichkeit", () => {
    expect(computeDragRotation({ x: 0, y: 0 }, { x: 10, y: 5 })).toEqual({ x: 0.05, y: 0.1 });
  });

  it("clampt die Neigung auf maxTilt", () => {
    expect(computeDragRotation({ x: 0.4, y: 0 }, { x: 0, y: 100 }).x).toBe(0.5);
    expect(computeDragRotation({ x: -0.4, y: 0 }, { x: 0, y: -100 }).x).toBe(-0.5);
  });

  it("erlaubt keine Begrenzung bei maxTilt = null (Touch)", () => {
    expect(computeDragRotation({ x: 0, y: 0 }, { x: 0, y: 100 }, 0.01, null).x).toBe(1);
  });
});

describe("computeRaycastNDC", () => {
  const rect = { left: 0, top: 0, width: 100, height: 50 };

  it("rechnet die Mitte auf (0, 0) um", () => {
    expect(computeRaycastNDC({ clientX: 50, clientY: 25 }, rect)).toEqual({ x: 0, y: 0 });
  });

  it("rechnet die Ecken auf (-1, 1) und (1, -1) um", () => {
    expect(computeRaycastNDC({ clientX: 0, clientY: 0 }, rect)).toEqual({ x: -1, y: 1 });
    expect(computeRaycastNDC({ clientX: 100, clientY: 50 }, rect)).toEqual({ x: 1, y: -1 });
  });
});

// ===== PlanetSki: Wirtschaft =====
describe("Economy", () => {
  it("mit Startwerten", () => {
    const eco = new Economy();
    expect(eco.money).toBe(100000);
    expect(eco.reputation).toBe(50);
    expect(eco.day).toBe(1);
    expect(eco.weather).toBe("sunny");
  });

  it("canAfford/spend/earn", () => {
    const eco = new Economy();
    expect(eco.canAfford(100000)).toBe(true);
    expect(eco.canAfford(100001)).toBe(false);
    expect(eco.spend(50000)).toBe(true);
    expect(eco.money).toBe(50000);
    expect(eco.spend(60000)).toBe(false);
    expect(eco.money).toBe(50000);
    eco.earn(1000);
    expect(eco.money).toBe(51000);
  });

  it("cheatMoney addiert 10.000.000€", () => {
    const eco = new Economy();
    const msg = eco.cheatMoney();
    expect(eco.money).toBe(10100000);
    expect(msg).toContain("CHEAT");
  });

  it("generateVisitors: Kapazität × Wetter × Reputation", () => {
    const eco = new Economy();
    const lifts = [{ config: { capacity: 1000 } }, { config: { capacity: 500 } }];
    // 1500 * 0.1 * 1.2 (sunny) * 1.0 (rep 50) * 1s = 180
    eco.generateVisitors(1, lifts);
    expect(eco.dailyVisitors).toBeCloseTo(180, 5);
    expect(eco.visitors).toBe(180);
    expect(eco.totalVisitors).toBe(180);
  });

  it("generateVisitors: Sturm reduziert Besucher", () => {
    const eco = new Economy();
    eco.weather = "stormy";
    const lifts = [{ config: { capacity: 1500 } }];
    // 1500 * 0.1 * 0.2 * 1.0 * 1s = 30
    eco.generateVisitors(1, lifts);
    expect(eco.dailyVisitors).toBeCloseTo(30, 5);
  });

  it("calculateRevenue: Tickets, Gastronomie und Hotels", () => {
    const eco = new Economy();
    eco.dailyVisitors = 100;
    const buildings = [
      { type: "hut", config: { incomePerVisitor: 15 } },
      { type: "hotel", config: { income: 5000 } },
    ];
    eco.calculateRevenue(1, [], buildings);
    // 100 * 55 * 0.3 / 86400
    expect(eco.liftTickets).toBeCloseTo((100 * 55 * 0.3) / 86400, 10);
    // min(150, 50) * 15 / 86400
    expect(eco.foodRevenue).toBeCloseTo((50 * 15) / 86400, 10);
    expect(eco.hotelRevenue).toBeCloseTo(5000 / 86400, 10);
  });

  it("calculateExpenses: Wartung, Personal und Energie", () => {
    const eco = new Economy();
    const lifts = [{ config: { cost: 50000, capacity: 1000 } }];
    const buildings = [{ type: "hut" }];
    eco.calculateExpenses(1, lifts, buildings);
    // Wartung: 50000 * 0.001 / 86400
    expect(eco.maintenance).toBeCloseTo(50 / 86400, 10);
    // Personal: (1*3 + 1*2) * 25 / 3600
    expect(eco.staffCosts).toBeCloseTo(125 / 3600, 10);
    // Energie: (1000/100) * 0.15 / 3600
    expect(eco.energyCosts).toBeCloseTo(1.5 / 3600, 10);
  });

  it("nextDay: Tag hoch, dailyVisitors zurück", () => {
    const eco = new Economy();
    eco.dailyVisitors = 123;
    eco.nextDay();
    expect(eco.day).toBe(2);
    expect(eco.dailyVisitors).toBe(0);
    expect(["sunny", "cloudy", "snowing", "foggy"]).toContain(eco.weather);
  });

  it("nextDay: Saisonwechsel nach 90 Tagen", () => {
    const eco = new Economy();
    eco.day = 90;
    eco.nextDay();
    expect(eco.day).toBe(1);
    expect(eco.season).toBe("summer");
  });

  it("getStats: Einnahmen/Ausgaben als Tagesbeträge", () => {
    const eco = new Economy();
    eco.dailyVisitors = 86400;
    eco.calculateRevenue(1, [], []);
    const stats = eco.getStats();
    // 86400 * 55 * 0.3 = 1.425.600
    expect(stats.income.liftTickets).toBe(1425600);
    expect(stats.money).toBe(100000);
  });
});

// ===== PlanetSki: Daten-Kataloge =====
describe("LIFT_TYPES", () => {
  it("enthalten die wichtigsten Lifte mit Kosten/Kapazität", () => {
    expect(LIFT_TYPES.chair4Fixed.cost).toBe(55000);
    expect(LIFT_TYPES.chair4Fixed.capacity).toBe(1800);
    expect(LIFT_TYPES.magicCarpet.category).toBe("surface");
    expect(LIFT_TYPES.magicCarpet.model).toBe("conveyor");
    expect(LIFT_TYPES.tramway200.cost).toBe(2000000);
  });

  it("hat für jeden Lift ein Modell", () => {
    for (const [key, lift] of Object.entries(LIFT_TYPES)) {
      expect(lift.model, `Lift ${key} ohne Modell`).toBeDefined();
      expect(lift.cost, `Lift ${key} ohne Kosten`).toBeGreaterThan(0);
    }
  });
});

describe("BUILDING_TYPES", () => {
  it("enthalten die wichtigsten Gebäude mit Kosten/Kategorie", () => {
    expect(BUILDING_TYPES.hotel.cost).toBe(500000);
    expect(BUILDING_TYPES.hotel.category).toBe("accommodation");
    expect(BUILDING_TYPES.hotel.income).toBe(5000);
    expect(BUILDING_TYPES.mountainStation.category).toBe("infrastructure");
    expect(BUILDING_TYPES.hut.incomePerVisitor).toBe(15);
  });
});
