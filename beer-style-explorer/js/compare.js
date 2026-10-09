// ============================================================
// COMPARE — metric normalization for the radar chart
// (pure, DOM-free)
// ============================================================

/** Radar chart axis labels, in the order radarValuesForStyle returns them. */
export const RADAR_LABELS = [
  "ABV",
  "Bitterness (IBU)",
  "Color (SRM)",
  "Gravity (OG)",
  "Attenuation",
];

/** Radar chart scale maximum (the chart is configured with max: 10). */
export const RADAR_SCALE_MAX = 10;

/** Lower bound of each radar axis, in the order of RADAR_LABELS. */
const RADAR_MIN = { abv: 2, ibu: 0, srm: 1, gravity: 28, attenuation: 0 };

/** Upper bound of each radar axis, in the order of RADAR_LABELS. */
const RADAR_MAX = { abv: 14, ibu: 100, srm: 40, gravity: 120, attenuation: 1 };

/**
 * Linearly normalize a value into the 0–10 radar scale.
 * @param {number} value - raw metric value
 * @param {number} min - axis minimum
 * @param {number} max - axis maximum
 * @returns {number} normalized value (not clamped to the scale)
 */
export function normalizeMetric(value, min, max) {
  return ((value - min) / (max - min)) * RADAR_SCALE_MAX;
}

/**
 * Compute the five radar-chart values for a style, using the
 * midpoint of each style's range. Order matches RADAR_LABELS:
 * ABV, IBU, SRM, OG (as gravity points), attenuation.
 * @param {Object} style - a style object from the dataset
 * @returns {Array<number>} five normalized values
 */
export function radarValuesForStyle(style) {
  const avg = (range) => (range[0] + range[1]) / 2;
  const gravityPoints = avg(style.og) * 1000 - 1000;
  const attenuation = 1 - (avg(style.fg) - avg(style.og) * 0.25);
  return [
    normalizeMetric(avg(style.abv), RADAR_MIN.abv, RADAR_MAX.abv),
    normalizeMetric(avg(style.ibu), RADAR_MIN.ibu, RADAR_MAX.ibu),
    normalizeMetric(avg(style.srm), RADAR_MIN.srm, RADAR_MAX.srm),
    normalizeMetric(gravityPoints, RADAR_MIN.gravity, RADAR_MAX.gravity),
    normalizeMetric(attenuation, RADAR_MIN.attenuation, RADAR_MAX.attenuation),
  ];
}
