/**
 * Save module — pure, DOM-free save/load state transforms.
 *
 * Defines the versioned save schema (V3) plus (de)serialization, structural
 * validation and migration of legacy saves. localStorage access itself stays
 * in game.js so this module remains importable from Node (tests).
 */

import { BLD_DATA, RES_DATA, UNIT_DATA } from "./economy.js";

/** Current save-schema version written by this build. */
export const SAVE_VERSION = 3;
/** localStorage key the save is stored under. */
export const STORAGE_KEY = "skitycoon_v4_wars";
/** Numeric resource fields that must exist on a valid state. */
const RES_NUMERIC_KEYS = ["k", "m", "s", "e", "maxK", "maxM", "maxS"];

/**
 * Creates a fresh, valid game state with default values.
 * @returns {Object} initial state (versioned with SAVE_VERSION)
 */
export function createInitialState() {
  return {
    version: SAVE_VERSION,
    lastTick: Date.now(),
    coords: { sys: 1, pos: 1 },
    res: { k: 1500, m: 1000, s: 0, e: 0, maxK: 10000, maxM: 10000, maxS: 10000 },
    bld: Object.keys(BLD_DATA).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    tech: Object.keys(RES_DATA).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    units: Object.keys(UNIT_DATA).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    buildQueue: null, // { type, id, end, costK, costM }
    unitQueue: [], // [{ id, count, end }]
    missions: [], // { id, type, from, to, units, start, arrive, return, cargo, phase }
    reports: [],
    universe: {}, // sys -> { pos: { name, isAI, score } }
    ui: { tab: "overview", mapSys: 1, fleetTarget: { sys: 1, pos: 2 } },
  };
}

/**
 * Structurally validates a state object against the V3 schema.
 * @param {*} obj - candidate state
 * @returns {boolean} true when the object is a well-formed state
 */
export function isValidState(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  if (obj.version !== SAVE_VERSION) return false;
  if (!obj.res || typeof obj.res !== "object") return false;
  for (const key of RES_NUMERIC_KEYS) {
    if (typeof obj.res[key] !== "number") return false;
  }
  const sections = [
    [BLD_DATA, obj.bld],
    [RES_DATA, obj.tech],
    [UNIT_DATA, obj.units],
  ];
  for (const [table, section] of sections) {
    if (!section || typeof section !== "object") return false;
    for (const key of Object.keys(table)) {
      if (typeof section[key] !== "number") return false;
    }
  }
  if (!obj.coords || typeof obj.coords.sys !== "number" || typeof obj.coords.pos !== "number")
    return false;
  if (!obj.ui || typeof obj.ui.tab !== "string") return false;
  return true;
}

/**
 * Migrates a parsed legacy save to the current schema: missing sections are
 * filled with fresh defaults, missing keys inside sections are defaulted,
 * and the version stamp is raised to SAVE_VERSION.
 * @param {Object} obj - parsed save object (any version <= SAVE_VERSION)
 * @returns {Object} migrated state
 */
function migrateState(obj) {
  const base = createInitialState();
  return {
    ...base,
    ...obj,
    version: SAVE_VERSION,
    coords: { ...base.coords, ...(obj.coords || {}) },
    res: { ...base.res, ...(obj.res || {}) },
    bld: { ...base.bld, ...(obj.bld || {}) },
    tech: { ...base.tech, ...(obj.tech || {}) },
    units: { ...base.units, ...(obj.units || {}) },
    ui: { ...base.ui, ...(obj.ui || {}) },
  };
}

/**
 * Serializes a state to a JSON string (pure transform, no storage access).
 * @param {Object} state - game state
 * @returns {string} JSON representation
 */
export function serializeState(state) {
  return JSON.stringify(state);
}

/**
 * Parses, migrates and validates a raw save string.
 * @param {*} raw - raw string from storage (or anything else)
 * @returns {Object|null} migrated state, or null when the input is not a
 *   parseable save with a version <= SAVE_VERSION or fails validation
 */
export function deserializeState(raw) {
  if (typeof raw !== "string" || raw.length === 0) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  if (typeof parsed.version === "number" && parsed.version > SAVE_VERSION) return null;
  const migrated = migrateState(parsed);
  if (!isValidState(migrated)) return null;
  return migrated;
}
