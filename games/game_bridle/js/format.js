/**
 * Pure number-formatting helpers for the Bridle game. No DOM access.
 */

/** Threshold at which amounts are displayed with a "B" (billions) suffix. */
const BILLION = 1e9;

/** Threshold at which amounts are displayed with an "M" (millions) suffix. */
const MILLION = 1e6;

/** Threshold at which amounts are displayed with a "k" (thousands) suffix. */
const THOUSAND = 1e3;

/**
 * Formats a money amount into a short human-readable string.
 *
 * @param {number} amount - The money amount to format.
 * @returns {string} The formatted amount, e.g. "$1.50k" or "$2.34M".
 */
export function formatMoney(amount) {
  if (amount >= BILLION) return "$" + (amount / BILLION).toFixed(2) + "B";
  if (amount >= MILLION) return "$" + (amount / MILLION).toFixed(2) + "M";
  if (amount >= THOUSAND) return "$" + (amount / THOUSAND).toFixed(2) + "k";
  return "$" + Math.floor(amount);
}
