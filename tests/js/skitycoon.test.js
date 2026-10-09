/**
 * Pure-logic tests for the SkiTycoon modules.
 * Imports only DOM-free modules (no game.js, no localStorage).
 */
import { describe, it, expect } from "vitest";
import {
  BLD_DATA,
  RES_DATA,
  UNIT_DATA,
  getCost,
  getBuildTime,
  getUnitCost,
  calcProduction,
  getStorageCapacity,
  getPoints,
  getBuiltFields,
  getTotalTechLevels,
} from "../../SkiTycoon/js/economy.js";
import {
  checkReqs,
  getReqStatus,
  canBuild,
  canResearch,
  canTrain,
} from "../../SkiTycoon/js/research.js";
import {
  mulberry32,
  createUniverse,
  calcDistance,
  calcFlightTime,
  calcFuelCost,
  calcAttackPower,
  calcCargoCapacity,
  calcAiDefPower,
  calcAiLoot,
  calcCombatOutcome,
  calcLoot,
} from "../../SkiTycoon/js/guests.js";
import {
  SAVE_VERSION,
  createInitialState,
  serializeState,
  deserializeState,
  isValidState,
} from "../../SkiTycoon/js/save.js";

// ---------------------------------------------------------------------------
// economy: cost growth
// ---------------------------------------------------------------------------

describe("economy: cost growth", () => {
  it("charges base cost at level 0 and grows exponentially per level", () => {
    const s = createInitialState();
    // kapital: baseK 60, fK 1.5
    expect(getCost("kapital", "bld", s)).toEqual({ k: 60, m: 15, s: 0 });
    s.bld.kapital = 1;
    expect(getCost("kapital", "bld", s)).toEqual({ k: 90, m: 22, s: 0 }); // floor(15*1.5)=22
    s.bld.kapital = 2;
    expect(getCost("kapital", "bld", s)).toEqual({ k: 135, m: 33, s: 0 }); // floor(15*2.25)=33
  });

  it("grows research cost with its own factor", () => {
    const s = createInitialState();
    // energy_tech: baseK 800, baseM 400, f 1.8
    expect(getCost("energy_tech", "tech", s)).toEqual({ k: 800, m: 400, s: 0 });
    s.tech.energy_tech = 1;
    expect(getCost("energy_tech", "tech", s)).toEqual({ k: 1440, m: 720, s: 0 });
  });

  it("charges flat unit costs independent of levels", () => {
    const s = createInitialState();
    expect(getCost("promoter", "unit", s)).toEqual({ k: 300, m: 100, s: 10 });
    s.bld.agentur = 5;
    expect(getCost("promoter", "unit", s)).toEqual({ k: 300, m: 100, s: 10 });
  });

  it("scales unit cost linearly with count", () => {
    expect(getUnitCost("promoter", 3)).toEqual({ k: 900, m: 300, s: 30 });
    expect(getUnitCost("bus", 2)).toEqual({ k: 4000, m: 4000, s: 100 });
  });
});

// ---------------------------------------------------------------------------
// economy: build times
// ---------------------------------------------------------------------------

describe("economy: build times", () => {
  it("computes building time from cost divided by HQ speed bonus", () => {
    const s = createInitialState();
    // totalCost 2000 / 100 = 20s
    expect(getBuildTime(1000, 1000, "bld", s)).toBe(20);
    s.bld.hq = 1;
    expect(getBuildTime(1000, 1000, "bld", s)).toBe(10); // /(1+1)
    s.bld.hq = 4;
    expect(getBuildTime(1000, 1000, "bld", s)).toBe(4); // 20/5
  });

  it("uses the 1.5x labor bonus for research", () => {
    const s = createInitialState();
    expect(getBuildTime(1000, 1000, "tech", s)).toBe(20);
    s.bld.labor = 1;
    expect(getBuildTime(1000, 1000, "tech", s)).toBe(8); // 20/2.5
  });

  it("uses the /500 divisor and agentur bonus for units", () => {
    const s = createInitialState();
    expect(getBuildTime(2000, 2000, "unit", s)).toBe(8); // 4000/500
    s.bld.agentur = 1;
    expect(getBuildTime(2000, 2000, "unit", s)).toBe(4); // /(1+1)
    s.bld.agentur = 3;
    expect(getBuildTime(2000, 2000, "unit", s)).toBe(2); // 8/4
  });

  it("never returns less than the 2-second minimum", () => {
    const s = createInitialState();
    expect(getBuildTime(10, 10, "bld", s)).toBe(2);
    expect(getBuildTime(10, 10, "tech", s)).toBe(2);
    expect(getBuildTime(10, 10, "unit", s)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// economy: production & capacity
// ---------------------------------------------------------------------------

describe("economy: production", () => {
  it("produces kapital when energy is sufficient", () => {
    const s = createInitialState();
    s.bld.solar = 1;
    s.bld.kapital = 1;
    const prod = calcProduction(s);
    // solarBase = 20*1*1.2^1 = 24; energyProd = floor(24*1) = 24
    // e_req = 10*1*1.1^1 = 11; energyFactor = min(1, 24/11) = 1
    // prodK = floor(30*1*1.1*1) = 33 per hour -> 33/3600 per second
    expect(prod.k).toBeCloseTo(33 / 3600, 10);
    expect(prod.m).toBe(0);
    expect(prod.s).toBe(0);
    expect(s.res.e).toBe(13); // 24 - 11
  });

  it("shuts down production when there is no energy", () => {
    const s = createInitialState();
    s.bld.kapital = 1;
    const prod = calcProduction(s);
    expect(prod.k).toBe(0);
    expect(s.res.e).toBe(-11); // 0 - 11
  });

  it("scales energy production with Energietechnik research", () => {
    const s = createInitialState();
    s.bld.solar = 1;
    s.tech.energy_tech = 1;
    const prod = calcProduction(s);
    // energyProd = floor(24 * 1.1) = 26; e_req = 0 -> factor = 1
    expect(s.res.e).toBe(26);
    expect(prod.k).toBe(0);
  });

  it("throttles production partially when energy is scarce", () => {
    const s = createInitialState();
    s.bld.solar = 1;
    s.bld.kapital = 2;
    const prod = calcProduction(s);
    // e_req = 10*2*1.1^2 ≈ 24.2; energyProd = 24; factor ≈ 0.9917 < 1
    expect(prod.k).toBeLessThan((30 * 2 * 1.21) / 3600);
    expect(s.res.e).toBeCloseTo(24 - 24.2, 5);
  });

  it("grows storage capacity with storage building levels", () => {
    expect(getStorageCapacity(0)).toBe(10000);
    expect(getStorageCapacity(1)).toBe(25000); // 10000 + 10000*1*1.5
    expect(getStorageCapacity(2)).toBe(55000); // 10000 + 10000*2*2.25
  });

  it("writes capacities onto state during calcProduction", () => {
    const s = createInitialState();
    s.bld.speicherK = 2;
    s.bld.speicherM = 1;
    s.bld.speicherS = 3;
    calcProduction(s);
    expect(s.res.maxK).toBe(55000);
    expect(s.res.maxM).toBe(25000);
    expect(s.res.maxS).toBe(111250); // 10000 + 10000*3*3.375
  });
});

// ---------------------------------------------------------------------------
// economy: score
// ---------------------------------------------------------------------------

describe("economy: score", () => {
  it("is zero for a fresh state", () => {
    const s = createInitialState();
    expect(getPoints(s)).toBe(0);
    expect(getBuiltFields(s)).toBe(0);
    expect(getTotalTechLevels(s)).toBe(0);
  });

  it("counts 10 points per building and 50 per research level", () => {
    const s = createInitialState();
    s.bld.hq = 2;
    s.tech.energy_tech = 1;
    expect(getBuiltFields(s)).toBe(2);
    expect(getTotalTechLevels(s)).toBe(1);
    expect(getPoints(s)).toBe(2 * 10 + 1 * 50);
  });
});

// ---------------------------------------------------------------------------
// research: unlock logic
// ---------------------------------------------------------------------------

describe("research: unlock logic", () => {
  it("requires the demanded building OR research level", () => {
    const s = createInitialState();
    // energy_tech requires labor 1
    expect(canResearch("energy_tech", s)).toBe(false);
    s.bld.labor = 1;
    expect(canResearch("energy_tech", s)).toBe(true);
    // a research level alone also satisfies building requirements
    const s2 = createInitialState();
    s2.tech.labor = 1;
    expect(checkReqs({ labor: 1 }, s2)).toBe(true);
    expect(checkReqs({ labor: 1 }, createInitialState())).toBe(false);
  });

  it("handles multi-key unit requirements", () => {
    const s = createInitialState();
    // bus requires agentur 2 AND drive_tech 2
    expect(canTrain("bus", s)).toBe(false);
    s.bld.agentur = 2;
    expect(canTrain("bus", s)).toBe(false); // drive_tech missing
    s.tech.drive_tech = 2;
    expect(canTrain("bus", s)).toBe(true);
  });

  it("allows buildings without requirements and trains units with agentur", () => {
    const s = createInitialState();
    expect(canBuild("hq", s)).toBe(true);
    expect(canTrain("promoter", s)).toBe(false); // requires agentur 1
    s.bld.agentur = 1;
    expect(canTrain("promoter", s)).toBe(true);
    s.bld.agentur = 3;
    s.tech.def_tech = 2;
    expect(canTrain("anwalt", s)).toBe(true);
  });

  it("treats undefined requirements as met", () => {
    expect(checkReqs(undefined, createInitialState())).toBe(true);
  });

  it("reports per-requirement status with display names", () => {
    const s = createInitialState();
    s.bld.agentur = 2;
    s.tech.drive_tech = 2;
    const status = getReqStatus(UNIT_DATA.bus.req, s);
    expect(status).toEqual([
      { key: "agentur", level: 2, has: true, name: "Marketing-Agentur" },
      { key: "drive_tech", level: 2, has: true, name: "Logistikmotoren" },
    ]);
    expect(getReqStatus(UNIT_DATA.bus.req, createInitialState())[0].has).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// guests: fleet logistics
// ---------------------------------------------------------------------------

describe("guests: fleet logistics", () => {
  it("computes route distance from coordinate deltas", () => {
    expect(calcDistance(1, 1, 1, 1)).toBe(10);
    expect(calcDistance(1, 1, 2, 1)).toBe(110);
    expect(calcDistance(1, 1, 1, 2)).toBe(20);
    expect(calcDistance(2, 3, 5, 9)).toBe(300 + 60 + 10);
  });

  it("computes flight time slowed by the slowest unit and boosted by drive tech", () => {
    // floor(110*3500 / 2000) = floor(192.5)
    expect(calcFlightTime(110, 2000, 0)).toBe(192);
    // floor(110*3500 / (2000*1.2)) = floor(160.4)
    expect(calcFlightTime(110, 2000, 1)).toBe(160);
  });

  it("computes fuel cost from unit count and distance", () => {
    expect(calcFuelCost(5, 110)).toBe(55); // floor(5*10*110/100)
    expect(calcFuelCost(3, 130)).toBe(39);
  });
});

// ---------------------------------------------------------------------------
// guests: combat & loot
// ---------------------------------------------------------------------------

describe("guests: combat & loot", () => {
  it("sums attack power with the PR tech bonus", () => {
    expect(calcAttackPower({ promoter: 2 }, 0)).toBe(20);
    expect(calcAttackPower({ promoter: 2 }, 1)).toBe(22); // 2*10*1.1
    expect(calcAttackPower({ influencer: 1 }, 0)).toBe(120);
  });

  it("sums cargo capacity", () => {
    expect(calcCargoCapacity({ promoter: 2, bus: 1 })).toBe(2 * 50 + 1500);
  });

  it("derives AI defense and loot from score", () => {
    expect(calcAiDefPower(100)).toBe(500);
    expect(calcAiLoot(100)).toEqual({ k: 1500, m: 1000 });
  });

  it("wins only when attack strictly exceeds defense", () => {
    expect(calcCombatOutcome(501, 500)).toBe("win");
    expect(calcCombatOutcome(500, 500)).toBe("loss");
    expect(calcCombatOutcome(499, 500)).toBe("loss");
  });

  it("caps loot at cargo capacity and overflows into material", () => {
    const aiLoot = { k: 1500, m: 1000 };
    expect(calcLoot(aiLoot, 2000)).toEqual({ k: 1500, m: 500 });
    expect(calcLoot(aiLoot, 100)).toEqual({ k: 100, m: 0 });
    expect(calcLoot(aiLoot, 0)).toEqual({ k: 0, m: 0 });
  });
});

// ---------------------------------------------------------------------------
// guests: universe generation
// ---------------------------------------------------------------------------

describe("guests: universe generation", () => {
  it("is deterministic for a fixed seed", () => {
    expect(createUniverse(mulberry32(42))).toEqual(createUniverse(mulberry32(42)));
  });

  it("places the player resort at 1:1", () => {
    const uni = createUniverse(mulberry32(1));
    expect(uni[1][1]).toEqual({ name: "Mein Resort", isAI: false, player: true });
  });

  it("spawns roughly 30% AI resorts with valid names and scores", () => {
    let aiCount = 0;
    const freeSlots = 50 * 5 * 15 - 50; // 50 seeds, minus the guaranteed player slot each
    for (let seed = 0; seed < 50; seed++) {
      const uni = createUniverse(mulberry32(seed));
      for (let s = 1; s <= 5; s++) {
        for (let p = 1; p <= 15; p++) {
          const slot = uni[s][p];
          if (slot && slot.isAI) {
            aiCount++;
            expect(slot.name).toMatch(/^AI Resort [A-Z]\d+$/);
            expect(slot.score).toBeGreaterThanOrEqual(200); // s*200 minimum
          }
        }
      }
    }
    const ratio = aiCount / freeSlots;
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.4);
  });
});

// ---------------------------------------------------------------------------
// save: schema, round-trip, validation, migration
// ---------------------------------------------------------------------------

describe("save: versioned schema", () => {
  it("stamps the current version on fresh states", () => {
    expect(SAVE_VERSION).toBe(3);
    expect(createInitialState().version).toBe(SAVE_VERSION);
  });

  it("round-trips a state through serialize/deserialize", () => {
    const s = createInitialState();
    s.bld.kapital = 3;
    s.tech.energy_tech = 2;
    s.universe = createUniverse(mulberry32(7));
    s.reports.push({ time: 123, title: "t", html: "h", type: "success" });
    const round = deserializeState(serializeState(s));
    expect(round).toEqual(s);
  });

  it("returns null for unparsable input", () => {
    expect(deserializeState("not json")).toBeNull();
    expect(deserializeState("")).toBeNull();
    expect(deserializeState(null)).toBeNull();
    expect(deserializeState(undefined)).toBeNull();
    expect(deserializeState(42)).toBeNull();
  });

  it("rejects states from a newer save version", () => {
    const future = { ...createInitialState(), version: SAVE_VERSION + 1 };
    expect(deserializeState(serializeState(future))).toBeNull();
  });

  it("migrates legacy saves, keeping known values and defaulting the rest", () => {
    const legacy = { version: 1, res: { k: 5 }, bld: { kapital: 2 } };
    const migrated = deserializeState(JSON.stringify(legacy));
    expect(migrated).not.toBeNull();
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.res.k).toBe(5);
    expect(migrated.res.m).toBe(1000); // defaulted
    expect(migrated.bld.kapital).toBe(2);
    expect(migrated.bld.hq).toBe(0); // defaulted
    expect(isValidState(migrated)).toBe(true);
  });

  it("validates well-formed states only", () => {
    expect(isValidState(createInitialState())).toBe(true);
    expect(isValidState(null)).toBe(false);
    expect(isValidState({})).toBe(false);
    expect(isValidState({ ...createInitialState(), version: 2 })).toBe(false);
    expect(isValidState({ ...createInitialState(), res: { k: 1 } })).toBe(false);
    expect(isValidState({ ...createInitialState(), bld: {} })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// data tables: integrity
// ---------------------------------------------------------------------------

describe("data tables", () => {
  it("exposes the expected ids", () => {
    expect(Object.keys(BLD_DATA)).toEqual([
      "hq",
      "kapital",
      "material",
      "schnee",
      "solar",
      "labor",
      "agentur",
      "speicherK",
      "speicherM",
      "speicherS",
    ]);
    expect(Object.keys(RES_DATA)).toEqual(["energy_tech", "drive_tech", "pr_tech", "def_tech"]);
    expect(Object.keys(UNIT_DATA)).toEqual(["promoter", "bus", "influencer", "security", "anwalt"]);
  });
});
