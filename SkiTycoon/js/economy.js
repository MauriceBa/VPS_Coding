/**
 * Economy module — pure, DOM-free game math.
 *
 * Holds the static game data tables (buildings, research, units) plus all
 * resource / production / cost / capacity calculations. No DOM, no
 * localStorage, no timers — safe to import from Node (tests).
 */

// ---------------------------------------------------------------------------
// Named constants (formerly magic numbers scattered inside game.js)
// ---------------------------------------------------------------------------

/** Base storage capacity for every resource before storage buildings. */
const BASE_CAPACITY = 10000;
/** Additional capacity granted per storage building level (before growth). */
const STORAGE_CAPACITY = 10000;
/** Exponential growth factor for storage buildings. */
const STORAGE_GROWTH = 1.5;
/** Output bonus per level of the Energietechnik research. */
const ENERGY_TECH_FACTOR = 0.1;
/** Growth of the energy demand per producer building level. */
const ENERGY_DEMAND_GROWTH = 1.1;
/** Production is computed per hour, then divided by this to get per-second rates. */
const SECONDS_PER_HOUR = 3600;
/** Build time = combined cost / this divisor (buildings & research). */
const BUILD_TIME_COST_DIVISOR = 100;
/** Unit build time = combined cost / this divisor. */
const UNIT_BUILD_TIME_COST_DIVISOR = 500;
/** Lower bound for any build/train time in seconds. */
const MIN_BUILD_TIME_SECONDS = 2;
/** Speed bonus per level of the Zentrale Verwaltung (HQ). */
const HQ_SPEED_FACTOR = 1;
/** Speed bonus per level of the Forschungslabor. */
const LABOR_SPEED_FACTOR = 1.5;
/** Speed bonus per level of the Marketing-Agentur. */
const AGENTUR_SPEED_FACTOR = 1;
/** Attack bonus per level of the PR-Psychologie research. */
export const PR_TECH_FACTOR = 0.1;
/** Speed bonus per level of the Logistikmotoren research. */
export const DRIVE_TECH_FACTOR = 0.2;
/** Fuel consumed per unit aboard a fleet. */
export const FUEL_PER_UNIT = 10;
/** Fuel cost divisor based on travel distance. */
export const FUEL_DISTANCE_DIVISOR = 100;
/** Base flight-time factor: higher means slower fleets. */
export const FLIGHT_TIME_FACTOR = 3500;
/** Distance weight per system difference. */
export const SYS_DISTANCE_WEIGHT = 100;
/** Distance weight per position difference. */
export const POS_DISTANCE_WEIGHT = 10;
/** Flat distance added to every route. */
export const MIN_DISTANCE = 10;
/** AI defense power multiplier of the target score. */
export const AI_DEFENSE_FACTOR = 5;
/** AI kapital loot multiplier of the target score. */
export const AI_LOOT_KAPITAL_FACTOR = 15;
/** AI material loot multiplier of the target score. */
export const AI_LOOT_MATERIAL_FACTOR = 10;
/** Score damage dealt to an AI resort on a won campaign. */
export const AI_SCORE_DAMAGE = 10;
/** Floor for the AI score after damage. */
export const AI_MIN_SCORE = 10;
/** Player points per building level. */
const POINTS_PER_BUILDING = 10;
/** Player points per research level. */
const POINTS_PER_TECH = 50;
/** Maximum number of buildable fields on the home resort. */
export const MAX_BUILDABLE_FIELDS = 200;

// ---------------------------------------------------------------------------
// Static game data
// ---------------------------------------------------------------------------

export const BLD_DATA = {
  hq: {
    id: "hq",
    name: "Zentrale Verwaltung",
    icon: "🏢",
    desc: "Verkürzt die Bauzeiten aller Anlagen erheblich.",
    baseK: 500,
    baseM: 200,
    fK: 1.5,
    fM: 1.5,
  },
  kapital: {
    id: "kapital",
    name: "Ticketzentrum",
    icon: "🎫",
    desc: "Produziert Kapital (€).",
    baseK: 60,
    baseM: 15,
    fK: 1.5,
    fM: 1.5,
    baseProd: 30,
    prodF: 1.1,
    baseE: 10,
  },
  material: {
    id: "material",
    name: "Logistikzentrum",
    icon: "📦",
    desc: "Produziert Baumaterial.",
    baseK: 48,
    baseM: 24,
    fK: 1.5,
    fM: 1.5,
    baseProd: 20,
    prodF: 1.1,
    baseE: 10,
  },
  schnee: {
    id: "schnee",
    name: "Schneekanonen-Netz",
    icon: "❄️",
    desc: "Produziert Kunstschnee (Treibstoff für Flotten).",
    baseK: 200,
    baseM: 100,
    fK: 1.5,
    fM: 1.5,
    baseProd: 10,
    prodF: 1.1,
    baseE: 20,
  },
  solar: {
    id: "solar",
    name: "Solarkraftwerk",
    icon: "⚡",
    desc: "Stellt Energie bereit. Anlagen ohne Energie produzieren langsamer.",
    baseK: 80,
    baseM: 30,
    fK: 1.5,
    fM: 1.5,
    baseProd: 20,
    prodF: 1.2,
  },
  labor: {
    id: "labor",
    name: "Forschungslabor",
    icon: "🔬",
    desc: "Schaltet Forschungen frei und beschleunigt sie.",
    baseK: 200,
    baseM: 400,
    fK: 1.5,
    fM: 1.5,
  },
  agentur: {
    id: "agentur",
    name: "Marketing-Agentur",
    icon: "📢",
    desc: "Rekrutiert Personal für Kampagnen (Einheiten).",
    baseK: 400,
    baseM: 200,
    fK: 1.5,
    fM: 1.5,
  },
  speicherK: {
    id: "speicherK",
    name: "Tresorraum",
    icon: "🏦",
    desc: "Erhöht die maximale Kapazität für Kapital.",
    baseK: 1000,
    baseM: 0,
    fK: 2,
    fM: 1,
  },
  speicherM: {
    id: "speicherM",
    name: "Materiallager",
    icon: "🏗️",
    desc: "Erhöht die maximale Kapazität für Baumaterial.",
    baseK: 0,
    baseM: 1000,
    fK: 1,
    fM: 2,
  },
  speicherS: {
    id: "speicherS",
    name: "Kühlbecken",
    icon: "🧊",
    desc: "Erhöht die maximale Kapazität für Schnee.",
    baseK: 1000,
    baseM: 1000,
    fK: 2,
    fM: 2,
  },
};

export const RES_DATA = {
  energy_tech: {
    id: "energy_tech",
    name: "Energietechnik",
    icon: "🔋",
    desc: "Verbessert den Output des Solarkraftwerks.",
    req: { labor: 1 },
    baseK: 800,
    baseM: 400,
    baseS: 0,
    f: 1.8,
  },
  drive_tech: {
    id: "drive_tech",
    name: "Logistikmotoren",
    icon: "🚌",
    desc: "Macht Reisebusse und Kampagnen schneller.",
    req: { labor: 2 },
    baseK: 400,
    baseM: 1000,
    baseS: 200,
    f: 2.0,
  },
  pr_tech: {
    id: "pr_tech",
    name: "PR-Psychologie",
    icon: "🧠",
    desc: "Erhöht die Angriffsstärke (Gästeklau) deiner Kampagnen.",
    req: { labor: 4 },
    baseK: 2000,
    baseM: 500,
    baseS: 500,
    f: 2.0,
  },
  def_tech: {
    id: "def_tech",
    name: "Krisenmanagement",
    icon: "🛡️",
    desc: "Erhöht die Abwehrkraft deiner Sicherheitskräfte.",
    req: { labor: 4 },
    baseK: 1000,
    baseM: 1500,
    baseS: 200,
    f: 2.0,
  },
};

export const UNIT_DATA = {
  // Attackers (Marketing Fleet)
  promoter: {
    id: "promoter",
    cat: "fleet",
    name: "Promoter",
    icon: "🚶",
    desc: "Leichte Einheit zum Gästeklau.",
    req: { agentur: 1 },
    costK: 300,
    costM: 100,
    costS: 10,
    atk: 10,
    hp: 10,
    cargo: 50,
    speed: 2000,
  },
  bus: {
    id: "bus",
    cat: "fleet",
    name: "Reisebus",
    icon: "🚌",
    desc: "Viel Frachtraum, sehr langsam.",
    req: { agentur: 2, drive_tech: 2 },
    costK: 2000,
    costM: 2000,
    costS: 50,
    atk: 2,
    hp: 50,
    cargo: 1500,
    speed: 800,
  },
  influencer: {
    id: "influencer",
    cat: "fleet",
    name: "Influencer",
    icon: "🤳",
    desc: "Starke PR-Angriffskraft, teuer im Unterhalt (Schnee).",
    req: { agentur: 4, pr_tech: 3 },
    costK: 4000,
    costM: 1000,
    costS: 200,
    atk: 120,
    hp: 150,
    cargo: 200,
    speed: 3000,
  },
  // Defenders
  security: {
    id: "security",
    cat: "def",
    name: "Security",
    icon: "👮",
    desc: "Basis-Abwehr gegen fremde Promoter.",
    req: { agentur: 1 },
    costK: 200,
    costM: 100,
    costS: 0,
    atk: 15,
    hp: 20,
    cargo: 0,
    speed: 0,
  },
  anwalt: {
    id: "anwalt",
    cat: "def",
    name: "PR-Anwalt",
    icon: "⚖️",
    desc: "Schwere Abwehr gegen feindliche Influencer.",
    req: { agentur: 3, def_tech: 2 },
    costK: 1500,
    costM: 1000,
    costS: 0,
    atk: 80,
    hp: 200,
    cargo: 0,
    speed: 0,
  },
};

// ---------------------------------------------------------------------------
// Costs & build times
// ---------------------------------------------------------------------------

/**
 * Calculates the resource cost of the next level of a building, research or unit.
 * @param {string} type - id of the building/research/unit
 * @param {string} [category='bld'] - 'bld' | 'tech' | 'unit'
 * @param {Object} state - game state (reads current levels)
 * @returns {{k: number, m: number, s: number}} cost in Kapital, Material, Schnee
 */
export function getCost(type, category = "bld", state) {
  if (category === "bld") {
    const d = BLD_DATA[type];
    const lvl = state.bld[type];
    return {
      k: Math.floor(d.baseK * Math.pow(d.fK, lvl)),
      m: Math.floor(d.baseM * Math.pow(d.fM, lvl)),
      s: 0,
    };
  } else if (category === "tech") {
    const d = RES_DATA[type];
    const lvl = state.tech[type];
    return {
      k: Math.floor(d.baseK * Math.pow(d.f, lvl)),
      m: Math.floor(d.baseM * Math.pow(d.f, lvl)),
      s: Math.floor(d.baseS * Math.pow(d.f, lvl)),
    };
  } else if (category === "unit") {
    const d = UNIT_DATA[type];
    return { k: d.costK, m: d.costM, s: d.costS };
  }
}

/**
 * Calculates the build/train time (in seconds) for a given cost.
 * @param {number} costK - Kapital part of the cost
 * @param {number} costM - Material part of the cost
 * @param {string} [type='bld'] - 'bld' | 'tech' | 'unit'
 * @param {Object} state - game state (reads HQ / Labor / Agentur levels)
 * @returns {number} build time in seconds (minimum MIN_BUILD_TIME_SECONDS)
 */
export function getBuildTime(costK, costM, type = "bld", state) {
  // Speed factor: 1 hour in real game = 1 minute here (highly accelerated)
  const totalCost = costK + costM;
  let baseSeconds = totalCost / BUILD_TIME_COST_DIVISOR;
  if (type === "bld") {
    baseSeconds /= 1 + state.bld.hq * HQ_SPEED_FACTOR;
  } else if (type === "tech") {
    baseSeconds /= 1 + state.bld.labor * LABOR_SPEED_FACTOR;
  } else if (type === "unit") {
    baseSeconds = totalCost / UNIT_BUILD_TIME_COST_DIVISOR;
    baseSeconds /= 1 + state.bld.agentur * AGENTUR_SPEED_FACTOR;
  }
  return Math.max(MIN_BUILD_TIME_SECONDS, Math.floor(baseSeconds));
}

/**
 * Calculates the resource cost of training `count` units of a type.
 * @param {string} unitId - id of the unit
 * @param {number} count - number of units
 * @returns {{k: number, m: number, s: number}} total cost
 */
export function getUnitCost(unitId, count) {
  const d = UNIT_DATA[unitId];
  return { k: d.costK * count, m: d.costM * count, s: d.costS * count };
}

// ---------------------------------------------------------------------------
// Production & capacity
// ---------------------------------------------------------------------------

/**
 * Calculates production per second and updates energy balance and storage
 * capacities on the passed state (mutates state.res).
 * @param {Object} state - game state (reads buildings & research, writes res.e/maxK/maxM/maxS)
 * @returns {{k: number, m: number, s: number}} production per second
 */
export function calcProduction(state) {
  const b = state.bld;
  const e_tech = state.tech.energy_tech;

  const solarBase = BLD_DATA.solar.baseProd * b.solar * Math.pow(BLD_DATA.solar.prodF, b.solar);
  const energyProd = Math.floor(solarBase * (1 + e_tech * ENERGY_TECH_FACTOR));

  const e_req =
    BLD_DATA.kapital.baseE * b.kapital * Math.pow(ENERGY_DEMAND_GROWTH, b.kapital) +
    BLD_DATA.material.baseE * b.material * Math.pow(ENERGY_DEMAND_GROWTH, b.material) +
    BLD_DATA.schnee.baseE * b.schnee * Math.pow(ENERGY_DEMAND_GROWTH, b.schnee);

  const energyFactor = e_req > 0 ? Math.min(1, energyProd / e_req) : 1;
  state.res.e = energyProd - e_req;

  const prodK = Math.floor(
    BLD_DATA.kapital.baseProd *
      b.kapital *
      Math.pow(BLD_DATA.kapital.prodF, b.kapital) *
      energyFactor,
  );
  const prodM = Math.floor(
    BLD_DATA.material.baseProd *
      b.material *
      Math.pow(BLD_DATA.material.prodF, b.material) *
      energyFactor,
  );
  const prodS = Math.floor(
    BLD_DATA.schnee.baseProd * b.schnee * Math.pow(BLD_DATA.schnee.prodF, b.schnee) * energyFactor,
  );

  // Update capacities
  state.res.maxK = getStorageCapacity(b.speicherK);
  state.res.maxM = getStorageCapacity(b.speicherM);
  state.res.maxS = getStorageCapacity(b.speicherS);

  return {
    k: prodK / SECONDS_PER_HOUR, // per second instead of per hour
    m: prodM / SECONDS_PER_HOUR,
    s: prodS / SECONDS_PER_HOUR,
  };
}

/**
 * Calculates the storage capacity for a resource given the storage building level.
 * @param {number} level - storage building level (0 = base capacity)
 * @returns {number} maximum storable amount
 */
export function getStorageCapacity(level) {
  return BASE_CAPACITY + STORAGE_CAPACITY * level * Math.pow(STORAGE_GROWTH, level);
}

// ---------------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------------

/**
 * Total number of building levels across all buildings.
 * @param {Object} state - game state
 * @returns {number} sum of all building levels
 */
export function getBuiltFields(state) {
  return Object.values(state.bld).reduce((a, b) => a + b, 0);
}

/**
 * Total number of research levels across all technologies.
 * @param {Object} state - game state
 * @returns {number} sum of all research levels
 */
export function getTotalTechLevels(state) {
  return Object.values(state.tech).reduce((a, b) => a + b, 0);
}

/**
 * Calculates the player's score from building and research levels.
 * @param {Object} state - game state
 * @returns {number} points
 */
export function getPoints(state) {
  return getBuiltFields(state) * POINTS_PER_BUILDING + getTotalTechLevels(state) * POINTS_PER_TECH;
}
