/**
 * Pure game-state data transforms for the Bridle game: initial state
 * creation, save serialization and save application. No DOM or storage access.
 */

import { UPGRADE_CONFIG } from "./economy.js";

/** Default damage per ball on a fresh game or after a prestige. */
const DEFAULT_DAMAGE = 1;

/** Default ball speed on a fresh game or after a prestige. */
const DEFAULT_SPEED = 4;

/** Default income multiplier on a fresh game or after a prestige. */
const DEFAULT_INCOME_MULT = 1;

/** Default prestige state on a fresh game. */
const DEFAULT_PRESTIGE = { count: 0, multiplier: 1.0 };

export { DEFAULT_DAMAGE, DEFAULT_SPEED, DEFAULT_INCOME_MULT };

/**
 * Creates the default upgrade state for a fresh game or after a prestige.
 *
 * @returns {Object} The default upgrades object.
 */
export function createInitialUpgrades() {
  const upgrades = {};
  for (const [key, cfg] of Object.entries(UPGRADE_CONFIG)) {
    upgrades[key] = { level: cfg.initialLevel, cost: cfg.baseCost, baseCost: cfg.baseCost };
  }
  return upgrades;
}

/**
 * Creates the initial game state for a brand-new game.
 *
 * @param {number} [now] - The current timestamp (ms). Defaults to Date.now().
 * @returns {Object} The initial game state.
 */
export function createInitialState(now = Date.now()) {
  return {
    money: 0,
    level: 1,
    damage: DEFAULT_DAMAGE,
    speed: DEFAULT_SPEED,
    incomeMult: DEFAULT_INCOME_MULT,
    splashRange: 0,
    balls: [],
    bricks: [],
    particles: [],
    floatingTexts: [],
    lastTime: now,
    prestige: { count: DEFAULT_PRESTIGE.count, multiplier: DEFAULT_PRESTIGE.multiplier },
    upgrades: createInitialUpgrades(),
  };
}

/**
 * Serializes the game state into a plain save object.
 *
 * @param {Object} state - The current game state.
 * @param {number} [now] - The current timestamp (ms). Defaults to Date.now().
 * @returns {Object} The save object.
 */
export function serializeState(state, now = Date.now()) {
  return {
    money: state.money,
    level: state.level,
    damage: state.damage,
    speed: state.speed,
    incomeMult: state.incomeMult,
    splashRange: state.splashRange,
    prestige: state.prestige,
    upgrades: state.upgrades,
    ballCount: state.balls.length,
    lastTime: now,
  };
}

/**
 * Applies a save object to the given state, returning a new state.
 * Scalar values fall back to defaults when missing from the save; the
 * arrays (balls, bricks, particles, floatingTexts) are carried over from
 * the current state and lastTime is reset to now.
 *
 * @param {Object} state - The current game state.
 * @param {Object} save - The parsed save object.
 * @param {number} [now] - The current timestamp (ms). Defaults to Date.now().
 * @returns {Object} A new state with the save applied.
 */
export function applySave(state, save, now = Date.now()) {
  return {
    ...state,
    money: save.money || 0,
    level: save.level || 1,
    damage: save.damage || DEFAULT_DAMAGE,
    speed: save.speed || DEFAULT_SPEED,
    incomeMult: save.incomeMult || DEFAULT_INCOME_MULT,
    splashRange: save.splashRange || 0,
    prestige: save.prestige || {
      count: DEFAULT_PRESTIGE.count,
      multiplier: DEFAULT_PRESTIGE.multiplier,
    },
    upgrades: save.upgrades || state.upgrades,
    lastTime: now,
  };
}
