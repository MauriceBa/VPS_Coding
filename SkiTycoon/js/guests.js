/**
 * Guests module — pure, DOM-free "Gästeklau" (guest-stealing) simulation.
 *
 * Covers AI resort universe generation, campaign combat math and fleet
 * logistics (distance, flight time, fuel). The universe generator takes an
 * injectable RNG so it stays deterministic and testable. No DOM, no
 * localStorage — safe to import from Node.
 */

import {
  UNIT_DATA,
  PR_TECH_FACTOR,
  DRIVE_TECH_FACTOR,
  FUEL_PER_UNIT,
  FUEL_DISTANCE_DIVISOR,
  FLIGHT_TIME_FACTOR,
  SYS_DISTANCE_WEIGHT,
  POS_DISTANCE_WEIGHT,
  MIN_DISTANCE,
  AI_DEFENSE_FACTOR,
  AI_LOOT_KAPITAL_FACTOR,
  AI_LOOT_MATERIAL_FACTOR,
} from "./economy.js";

// ---------------------------------------------------------------------------
// Named constants
// ---------------------------------------------------------------------------

/** Number of star systems in the universe. */
const UNIVERSE_SYSTEMS = 5;
/** Number of resort slots per system. */
const UNIVERSE_POSITIONS = 15;
/** Probability that a free slot contains an AI resort. */
const AI_SPAWN_CHANCE = 0.3;
/** Number of letters available for the AI resort name prefix. */
const AI_NAME_LETTERS = 26;
/** Random score range (before the per-system bonus) for an AI resort. */
const AI_SCORE_BASE_RANGE = 500;
/** Score bonus per system index for an AI resort. */
const AI_SCORE_PER_SYSTEM = 200;
/** Outcome when the attacker's power strictly exceeds the defense. */
const OUTCOME_WIN = "win";
/** Outcome when the attacker's power is equal or lower. */
const OUTCOME_LOSS = "loss";

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32)
// ---------------------------------------------------------------------------

/**
 * Creates a deterministic pseudo-random generator (mulberry32).
 * @param {number} seed - 32-bit seed
 * @returns {() => number} function returning floats in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Universe generation
// ---------------------------------------------------------------------------

/**
 * Generates the resort universe. Slot 1:1 is always the player's home
 * resort; every other slot has a AI_SPAWN_CHANCE chance of holding an AI
 * resort with a random name and score.
 * @param {() => number} [rng=Math.random] - random source in [0, 1)
 * @returns {Object<number, Object<number, Object>>} universe: sys -> pos -> slot
 */
export function createUniverse(rng = Math.random) {
  const universe = {};
  for (let s = 1; s <= UNIVERSE_SYSTEMS; s++) {
    universe[s] = {};
    for (let p = 1; p <= UNIVERSE_POSITIONS; p++) {
      if (s === 1 && p === 1) {
        universe[s][p] = { name: "Mein Resort", isAI: false, player: true };
      } else if (rng() < AI_SPAWN_CHANCE) {
        universe[s][p] = {
          name: `AI Resort ${String.fromCharCode(65 + Math.floor(rng() * AI_NAME_LETTERS))}${p}`,
          isAI: true,
          score: Math.floor(rng() * AI_SCORE_BASE_RANGE) + s * AI_SCORE_PER_SYSTEM,
        };
      }
    }
  }
  return universe;
}

// ---------------------------------------------------------------------------
// Fleet logistics
// ---------------------------------------------------------------------------

/**
 * Calculates the distance between two coordinates.
 * @param {number} fromSys - starting system
 * @param {number} fromPos - starting position
 * @param {number} toSys - target system
 * @param {number} toPos - target position
 * @returns {number} abstract distance units
 */
export function calcDistance(fromSys, fromPos, toSys, toPos) {
  return (
    Math.abs(fromSys - toSys) * SYS_DISTANCE_WEIGHT +
    Math.abs(fromPos - toPos) * POS_DISTANCE_WEIGHT +
    MIN_DISTANCE
  );
}

/**
 * Calculates the one-way flight time (in seconds) for a fleet.
 * @param {number} dist - distance (see calcDistance)
 * @param {number} speed - speed of the slowest unit in the fleet
 * @param {number} [driveTechLevel=0] - Logistikmotoren research level
 * @returns {number} flight time in seconds (floored)
 */
export function calcFlightTime(dist, speed, driveTechLevel = 0) {
  return Math.floor(
    (dist * FLIGHT_TIME_FACTOR) / (speed * (1 + driveTechLevel * DRIVE_TECH_FACTOR)),
  );
}

/**
 * Calculates the fuel (Kunstschnee) cost of a fleet for one leg.
 * @param {number} totalUnits - number of units aboard
 * @param {number} dist - distance (see calcDistance)
 * @returns {number} fuel cost (floored)
 */
export function calcFuelCost(totalUnits, dist) {
  return Math.floor((totalUnits * FUEL_PER_UNIT * dist) / FUEL_DISTANCE_DIVISOR);
}

// ---------------------------------------------------------------------------
// Combat / loot math
// ---------------------------------------------------------------------------

/**
 * Calculates the total attack power of a fleet payload.
 * @param {Object<string, number>} units - map of unit id -> count
 * @param {number} [prTechLevel=0] - PR-Psychologie research level
 * @returns {number} total attack power
 */
export function calcAttackPower(units, prTechLevel = 0) {
  let atkPower = 0;
  Object.entries(units).forEach(([id, count]) => {
    atkPower += count * UNIT_DATA[id].atk * (1 + prTechLevel * PR_TECH_FACTOR);
  });
  return atkPower;
}

/**
 * Calculates the total cargo capacity of a fleet payload.
 * @param {Object<string, number>} units - map of unit id -> count
 * @returns {number} total cargo capacity
 */
export function calcCargoCapacity(units) {
  let cargoCap = 0;
  Object.entries(units).forEach(([id, count]) => {
    cargoCap += count * UNIT_DATA[id].cargo;
  });
  return cargoCap;
}

/**
 * Calculates the defense power of an AI resort from its score.
 * @param {number} aiScore - current score of the AI resort
 * @returns {number} defense power
 */
export function calcAiDefPower(aiScore) {
  return aiScore * AI_DEFENSE_FACTOR;
}

/**
 * Calculates the loot an AI resort yields from its score.
 * @param {number} aiScore - current score of the AI resort
 * @returns {{k: number, m: number}} loot in Kapital and Material
 */
export function calcAiLoot(aiScore) {
  return { k: aiScore * AI_LOOT_KAPITAL_FACTOR, m: aiScore * AI_LOOT_MATERIAL_FACTOR };
}

/**
 * Determines the combat outcome from attack and defense power.
 * @param {number} atkPower - total attack power of the fleet
 * @param {number} aiDefPower - defense power of the target
 * @returns {'win'|'loss'} OUTCOME_WIN when atkPower > aiDefPower, else OUTCOME_LOSS
 */
export function calcCombatOutcome(atkPower, aiDefPower) {
  return atkPower > aiDefPower ? OUTCOME_WIN : OUTCOME_LOSS;
}

/**
 * Calculates the secured loot, limited by the fleet's cargo capacity.
 * Leftover capacity after Kapital is spent on Material.
 * @param {{k: number, m: number}} aiLoot - available loot (see calcAiLoot)
 * @param {number} cargoCap - total cargo capacity of the fleet
 * @returns {{k: number, m: number}} secured loot
 */
export function calcLoot(aiLoot, cargoCap) {
  const lootK = Math.min(aiLoot.k, cargoCap);
  const lootM = Math.min(aiLoot.m, Math.max(0, cargoCap - lootK));
  return { k: lootK, m: lootM };
}
