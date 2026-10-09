// ============================================================
// RECIPE — recipe / grain-bill / hop-schedule generation
// (pure, DOM-free)
// ============================================================

/** Default recipe parameters (used when form fields are empty). */
export const RECIPE_DEFAULTS = {
  name: "My Brew",
  batch: 20,
  og: 1.065,
  fg: 1.012,
  ibu: 45,
  srm: 6,
};

/** Brewhouse efficiency used for the grain-bill estimate. */
export const EFFICIENCY = 0.75;

/** Grain potential points per pound, per gallon (PPG). */
export const GRAIN_PPG = 383;

/** Multiplier converting (OG − FG) to ABV percent. */
export const ABV_FACTOR = 131.25;

/** Pounds → kilograms conversion factor. */
export const LBS_PER_KG = 0.453592;

/**
 * Estimate ABV from original and final gravity.
 * @param {number} og - original gravity, e.g. 1.065
 * @param {number} fg - final gravity, e.g. 1.012
 * @returns {string} ABV percent, one decimal place, e.g. '7.0'
 */
export function estimateAbv(og, fg) {
  return ((og - fg) * ABV_FACTOR).toFixed(1);
}

/**
 * Total grain needed for a batch, in kilograms (2-decimal string,
 * matching the original calculation's rounding chain).
 * @param {number} og - original gravity, e.g. 1.065
 * @param {number} batch - batch size in litres
 * @returns {string} grain mass in kg, e.g. '2.05'
 */
export function totalGrainKg(og, batch) {
  const points = (og - 1) * 1000;
  const grainLbs = ((points * batch) / (EFFICIENCY * GRAIN_PPG)).toFixed(2);
  return (grainLbs * LBS_PER_KG).toFixed(2);
}

/**
 * Build the grain bill for a style. Each grain's share comes from
 * the "min–max%" range in its name (midpoint); grains without a
 * range default to 85% for the first grain and 10% for the rest.
 * @param {Object} style - a style object from the dataset
 * @param {string|number} grainTotalKg - total grain mass in kg (as returned by totalGrainKg)
 * @returns {Array<{grain: string, pct: number, kg: string}>} grain bill entries
 */
export function buildGrainBill(style, grainTotalKg) {
  const grains = style.ingredients.grains;
  return grains.map((g, i) => {
    const pctMatch = g.match(/(\d+)[–-](\d+)%/);
    const pct = pctMatch
      ? (parseInt(pctMatch[1]) + parseInt(pctMatch[2])) / 200
      : i === 0
        ? 0.85
        : 0.1;
    const kg = (grainTotalKg * pct).toFixed(2);
    return { grain: g.replace(/\s*\(.*\)/, ""), pct: Math.round(pct * 100), kg };
  });
}

/**
 * Build the three-addition hop schedule (bittering / flavor / aroma)
 * for a style, scaling hop amounts with IBU target and batch size.
 * @param {Object} style - a style object from the dataset
 * @param {number} ibu - target IBU
 * @param {number} batch - batch size in litres
 * @returns {Array<{hop: string, amount: string, time: string, purpose: string}>} hop additions
 */
export function buildHopSchedule(style, ibu, batch) {
  const hops = style.ingredients.hops;
  return [
    {
      hop: hops[0] || hops[0],
      amount: (((ibu * 0.015 * batch) / 1000) * 10).toFixed(1) + "g",
      time: "60 min (bittering)",
      purpose: "Bitterness",
    },
    {
      hop: hops[Math.min(1, hops.length - 1)],
      amount: (((ibu * 0.01 * batch) / 1000) * 10).toFixed(1) + "g",
      time: "15 min (flavor)",
      purpose: "Flavor",
    },
    {
      hop: hops[Math.min(2, hops.length - 1)],
      amount: (((ibu * 0.02 * batch) / 1000) * 10).toFixed(1) + "g",
      time: "0 min / Dry-hop",
      purpose: "Aroma",
    },
  ];
}

/**
 * Generate a full recipe for a style and a set of target parameters.
 * @param {Object} style - a style object from the dataset
 * @param {Object} params - recipe parameters
 * @param {string} params.name - beer name
 * @param {number} params.batch - batch size in litres
 * @param {number} params.og - target original gravity
 * @param {number} params.fg - target final gravity
 * @param {number} params.ibu - target IBU
 * @param {number} params.srm - target color (SRM)
 * @returns {{name: string, style: string, batch: number, og: number, fg: number, ibu: number, srm: number, abv: string, grainKg: string, grainBill: Array<Object>, hopSchedule: Array<Object>, yeast: string, water: string}} the generated recipe
 */
export function buildRecipe(style, { name, batch, og, fg, ibu, srm }) {
  const abv = estimateAbv(og, fg);
  const grainKg = totalGrainKg(og, batch);
  const grainBill = buildGrainBill(style, grainKg);
  const hopSchedule = buildHopSchedule(style, ibu, batch);
  const warnings = buildRecipeWarnings(style, og, ibu, srm);
  return {
    name,
    style: style.name,
    batch,
    og,
    fg,
    ibu,
    srm,
    abv,
    grainKg,
    grainBill,
    hopSchedule,
    yeast: style.ingredients.yeast,
    water: style.ingredients.water,
    warnings,
  };
}

/**
 * Compare target parameters against a style's guideline ranges and
 * produce human-readable warnings for anything out of range.
 * @param {Object} style - a style object from the dataset
 * @param {number} og - target original gravity
 * @param {number} ibu - target IBU
 * @param {number} srm - target color (SRM)
 * @returns {Array<string>} warning messages (empty when all parameters are in range)
 */
export function buildRecipeWarnings(style, og, ibu, srm) {
  const warnings = [];
  if (og < style.og[0])
    warnings.push(`⚠ OG ${og} is below style minimum (${style.og[0]}). Increase grain bill.`);
  if (og > style.og[1])
    warnings.push(`⚠ OG ${og} exceeds style maximum (${style.og[1]}). Reduce grain bill.`);
  if (ibu < style.ibu[0])
    warnings.push(
      `⚠ IBU ${ibu} is below style minimum (${style.ibu[0]}). Add more bittering hops.`,
    );
  if (ibu > style.ibu[1])
    warnings.push(`⚠ IBU ${ibu} exceeds style maximum (${style.ibu[1]}). Reduce hop load.`);
  if (srm < style.srm[0])
    warnings.push(
      `⚠ SRM ${srm} is too light for this style (min ${style.srm[0]}). Add darker malts.`,
    );
  if (srm > style.srm[1])
    warnings.push(`⚠ SRM ${srm} exceeds style range (max ${style.srm[1]}). Reduce dark malts.`);
  return warnings;
}
