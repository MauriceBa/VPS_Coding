/**
 * Pure game-economy math for the Bridle game: upgrade cost formulas, brick
 * hit points, offline-income estimates, hit rewards and prestige calculations.
 * No DOM access.
 */

/** Base hit points of a brick on level 1. */
const BRICK_BASE_HP = 10;

/** Multiplicative brick HP growth per level. */
const BRICK_HP_GROWTH = 1.15;

/** Fraction of theoretical DPS actually earned while offline. */
const OFFLINE_EFFICIENCY = 0.5;

/** Minimum seconds away before offline income is granted. */
export const OFFLINE_MIN_SECONDS = 60;

/** Probability that a ball hit is a critical hit. */
export const CRIT_CHANCE = 0.15;

/** Damage multiplier applied on a critical hit. */
const CRIT_MULTIPLIER = 3;

/** Level required before prestige becomes available. */
const PRESTIGE_MIN_LEVEL = 50;

/** Levels required per prestige gem. */
const PRESTIGE_GEMS_PER_LEVEL = 10;

/** Permanent damage multiplier granted per prestige gem. */
const PRESTIGE_MULTIPLIER_PER_GEM = 0.1;

/** Money granted per brick hit, before the income multiplier. */
const MONEY_PER_HIT = 1;

/** Bonus multiplier applied to a brick's value when it is destroyed. */
const BRICK_BONUS_MULTIPLIER = 10;

/** Fraction of the primary hit's damage dealt to bricks in splash range. */
const SPLASH_DAMAGE_FALLOFF = 0.5;

/** Extra radius (px) added to the splash range for the area check and effect. */
export const SPLASH_RADIUS_BONUS = 50;

/** Speed multiplier applied per Speed Up upgrade. */
export const SPEED_UPGRADE_FACTOR = 1.05;

/** Income multiplier applied per Gold Rush upgrade. */
export const INCOME_UPGRADE_FACTOR = 1.1;

/** Splash range (px) added per Splash Damage upgrade. */
export const SPLASH_RANGE_PER_LEVEL = 25;

/**
 * Static configuration for each purchasable upgrade.
 *
 * @type {Object<string, {baseCost: number, growthRate: number, initialLevel: number}>}
 */
export const UPGRADE_CONFIG = {
  balls: { baseCost: 10, growthRate: 1.5, initialLevel: 1 },
  power: { baseCost: 50, growthRate: 1.3, initialLevel: 1 },
  speed: { baseCost: 100, growthRate: 1.4, initialLevel: 1 },
  income: { baseCost: 200, growthRate: 1.4, initialLevel: 1 },
  splash: { baseCost: 1000, growthRate: 2.0, initialLevel: 0 },
};

/**
 * Computes the cost of the next level of an upgrade.
 *
 * @param {number} baseCost - The upgrade's base cost.
 * @param {number} level - The upgrade's current level.
 * @param {number} growthRate - The per-level cost growth rate.
 * @returns {number} The floored cost of the next upgrade level.
 */
export function nextUpgradeCost(baseCost, level, growthRate) {
  return Math.floor(baseCost * Math.pow(growthRate, level));
}

/**
 * Computes the hit points of bricks for a given level.
 *
 * @param {number} level - The current game level (1-based).
 * @returns {number} The brick hit points for that level.
 */
export function brickHpForLevel(level) {
  return Math.floor(BRICK_BASE_HP * Math.pow(BRICK_HP_GROWTH, level - 1));
}

/**
 * Computes the money value of a brick based on its hit points.
 *
 * @param {number} hp - The brick's hit points.
 * @returns {number} The brick's money value.
 */
export function brickValue(hp) {
  return Math.ceil(hp / 2);
}

/**
 * Computes the theoretical damage per second.
 *
 * @param {number} ballCount - The number of active balls.
 * @param {number} damage - The base damage per ball.
 * @param {number} prestigeMultiplier - The permanent prestige multiplier.
 * @returns {number} The damage per second.
 */
export function computeDps(ballCount, damage, prestigeMultiplier) {
  return ballCount * damage * prestigeMultiplier;
}

/**
 * Estimates the income earned while the player was away.
 *
 * @param {number} ballCount - The number of active balls.
 * @param {number} damage - The base damage per ball.
 * @param {number} prestigeMultiplier - The permanent prestige multiplier.
 * @param {number} incomeMult - The current income multiplier.
 * @param {number} secondsAway - The time away in seconds.
 * @returns {number} The estimated offline income.
 */
export function estimateOfflineIncome(
  ballCount,
  damage,
  prestigeMultiplier,
  incomeMult,
  secondsAway,
) {
  const dps = computeDps(ballCount, damage, prestigeMultiplier);
  return dps * secondsAway * OFFLINE_EFFICIENCY * incomeMult;
}

/**
 * Checks whether the player may prestige at the given level.
 *
 * @param {number} level - The current game level.
 * @returns {boolean} True if prestige is available.
 */
export function canPrestige(level) {
  return level >= PRESTIGE_MIN_LEVEL;
}

/**
 * Computes the gems earned for prestiging at the given level.
 *
 * @param {number} level - The current game level.
 * @returns {number} The number of prestige gems.
 */
export function prestigeGemsForLevel(level) {
  return Math.floor(level / PRESTIGE_GEMS_PER_LEVEL);
}

/**
 * Computes the permanent damage multiplier for a given gem count.
 *
 * @param {number} gemCount - The total prestige gems held.
 * @returns {number} The prestige damage multiplier.
 */
export function prestigeMultiplierForGems(gemCount) {
  return 1 + gemCount * PRESTIGE_MULTIPLIER_PER_GEM;
}

/**
 * Computes the damage of a single ball hit, including crits.
 *
 * @param {number} damage - The base damage per ball.
 * @param {number} prestigeMultiplier - The permanent prestige multiplier.
 * @param {boolean} isCrit - Whether the hit is a critical hit.
 * @returns {number} The total damage dealt.
 */
export function computeHitDamage(damage, prestigeMultiplier, isCrit) {
  let dmg = damage * prestigeMultiplier;
  if (isCrit) dmg *= CRIT_MULTIPLIER;
  return dmg;
}

/**
 * Computes the money granted for hitting a brick.
 *
 * @param {number} incomeMult - The current income multiplier.
 * @returns {number} The money granted.
 */
export function hitReward(incomeMult) {
  return MONEY_PER_HIT * incomeMult;
}

/**
 * Computes the money granted for destroying a brick.
 *
 * @param {number} value - The brick's base money value.
 * @param {number} incomeMult - The current income multiplier.
 * @returns {number} The money granted.
 */
export function brickKillReward(value, incomeMult) {
  return value * incomeMult * BRICK_BONUS_MULTIPLIER;
}

/**
 * Computes the splash damage dealt to nearby bricks.
 *
 * @param {number} amount - The primary hit's damage.
 * @returns {number} The splash damage.
 */
export function splashDamage(amount) {
  return amount * SPLASH_DAMAGE_FALLOFF;
}
