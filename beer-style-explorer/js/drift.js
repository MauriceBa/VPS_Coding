// ============================================================
// DRIFT — style-drift scoring and adjustment suggestions
// (pure, DOM-free)
// ============================================================

/** Per-metric score weights (a metric inside its range scores 10 × weight). */
const SCORE_WEIGHTS = { abv: 2, ibu: 2, srm: 1.5, og: 1.5, fg: 1 };

/** Bonus when the fermentation type matches the style exactly. */
const FERM_MATCH_SCORE = 10;

/** Partial bonus when an ale is fermented with kveik. */
const FERM_KVEIK_SCORE = 6;

/**
 * Score how closely a set of recipe metrics matches a style.
 * Each metric contributes up to 10 × its weight when inside the
 * style's range, decaying linearly outside it; fermentation type
 * adds a flat bonus.
 * @param {Object} style - a style object from the dataset
 * @param {number} abv - actual ABV percent
 * @param {number} ibu - actual IBU
 * @param {number} srm - actual color (SRM)
 * @param {number} og - actual original gravity
 * @param {number} fg - actual final gravity
 * @param {string} ferm - fermentation type ('ale' | 'lager' | 'mixed' | 'kveik')
 * @returns {number} rounded drift score
 */
export function scoreStyle(style, abv, ibu, srm, og, fg, ferm) {
  const inRange = (val, min, max) => val >= min && val <= max;
  const proximity = (val, min, max) => {
    if (inRange(val, min, max)) return 10;
    const mid = (min + max) / 2;
    const range = (max - min) / 2 || 1;
    return Math.max(0, 10 - (Math.abs(val - mid) / range) * 5);
  };
  let score = 0;
  score += proximity(abv, style.abv[0], style.abv[1]) * SCORE_WEIGHTS.abv;
  score += proximity(ibu, style.ibu[0], style.ibu[1]) * SCORE_WEIGHTS.ibu;
  score += proximity(srm, style.srm[0], style.srm[1]) * SCORE_WEIGHTS.srm;
  score += proximity(og, style.og[0], style.og[1]) * SCORE_WEIGHTS.og;
  score += proximity(fg, style.fg[0], style.fg[1]) * SCORE_WEIGHTS.fg;
  if (style.fermentation === ferm || (style.fermentation === "mixed" && ferm === "mixed"))
    score += FERM_MATCH_SCORE;
  else if (style.fermentation === "ale" && ferm === "kveik") score += FERM_KVEIK_SCORE;
  return Math.round(score);
}

/**
 * Score every style against the given metrics and sort best-match first.
 * @param {Array<Object>} styles - style collection (e.g. STYLES)
 * @param {number} abv - actual ABV percent
 * @param {number} ibu - actual IBU
 * @param {number} srm - actual color (SRM)
 * @param {number} og - actual original gravity
 * @param {number} fg - actual final gravity
 * @param {string} ferm - fermentation type ('ale' | 'lager' | 'mixed' | 'kveik')
 * @returns {Array<{style: Object, score: number}>} styles with scores, descending
 */
export function rankStylesByDrift(styles, abv, ibu, srm, og, fg, ferm) {
  return styles
    .map((s) => ({ style: s, score: scoreStyle(s, abv, ibu, srm, og, fg, ferm) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Build HTML adjustment suggestions steering a recipe toward the
 * best-matching style, plus cross-style shift tips (Hazy ↔ West
 * Coast IPA, Sweet → Dry Cider) when the scores call for them.
 * @param {Object} best - the top-matching style object
 * @param {Array<{style: Object, score: number}>} sortedScores - full ranked list from rankStylesByDrift
 * @param {number} abv - actual ABV percent
 * @param {number} ibu - actual IBU
 * @param {number} srm - actual color (SRM)
 * @param {string} ferm - fermentation type ('ale' | 'lager' | 'mixed' | 'kveik')
 * @returns {Array<string>} HTML list-item suggestion strings
 */
export function buildDriftSuggestions(best, sortedScores, abv, ibu, srm, ferm) {
  const suggestions = [];
  if (abv < best.abv[0])
    suggestions.push(
      `<li><span>Increase ABV</span> to ≥${best.abv[0]}% — add more fermentable sugars or increase grain bill.</li>`,
    );
  if (abv > best.abv[1])
    suggestions.push(
      `<li><span>Reduce ABV</span> to ≤${best.abv[1]}% — reduce grain bill or dilute with water adjustment.</li>`,
    );
  if (ibu < best.ibu[0])
    suggestions.push(
      `<li><span>Increase IBU</span> to ≥${best.ibu[0]} — add bittering hops (60 min addition). Consider ${best.ingredients.hops[0]}.</li>`,
    );
  if (ibu > best.ibu[1])
    suggestions.push(
      `<li><span>Reduce IBU</span> to ≤${best.ibu[1]} — cut bittering hops, shift to whirlpool/dry-hop only.</li>`,
    );
  if (srm < best.srm[0])
    suggestions.push(
      `<li><span>Darken color</span> to SRM ≥${best.srm[0]} — add ${best.category === "stout" ? "Roasted Barley or Black Patent" : "Crystal 80 or Chocolate Malt"}.</li>`,
    );
  if (srm > best.srm[1])
    suggestions.push(
      `<li><span>Lighten color</span> to SRM ≤${best.srm[1]} — remove dark malts, use lighter base malt.</li>`,
    );
  if (best.fermentation !== ferm)
    suggestions.push(
      `<li><span>Change fermentation</span> to ${best.fermentation} — use ${best.ingredients.yeast}.</li>`,
    );
  if (suggestions.length === 0)
    suggestions.push(
      `<li><span>You're on target!</span> This recipe fits ${best.name} very well. Fine-tune water profile: ${best.ingredients.water}.</li>`,
    );

  // Special: hazy → west coast path
  const hazyScore = sortedScores.find((s) => s.style.id === "hazy-ipa")?.score || 0;
  const wcScore = sortedScores.find((s) => s.style.id === "westcoast-ipa")?.score || 0;
  if (hazyScore > wcScore && best.id !== "westcoast-ipa") {
    suggestions.push(
      `<li><span>To shift Hazy → West Coast IPA:</span> Increase sulfate to 300–500 ppm SO4, lower chloride &lt;50 ppm, switch to US-05/WLP001, add more bittering hops (60 min), use Crystal 10 max 3%.</li>`,
    );
  }
  if (wcScore > hazyScore && best.id !== "hazy-ipa") {
    suggestions.push(
      `<li><span>To shift West Coast → Hazy IPA:</span> Add Flaked Oats (15–20%), Flaked Wheat (10%), switch to London Ale III (WY1318), increase chloride to 150–200 ppm, cut bittering hops, maximize dry-hop with Citra/Mosaic.</li>`,
    );
  }

  // Cider sweet → dry
  const sweetCiderScore = sortedScores.find((s) => s.style.id === "sweet-cider")?.score || 0;
  const dryCiderScore =
    sortedScores.find((s) => s.style.id === "traditional-dry-cider")?.score || 0;
  if (sweetCiderScore > dryCiderScore) {
    suggestions.push(
      `<li><span>To shift Sweet → Bone-Dry Cider:</span> Use EC-1118 (Champagne yeast), ferment to completion (FG &lt; 1.003), add pectic enzyme, avoid back-sweetening. Cold crash at -1°C for clarity.</li>`,
    );
  }

  return suggestions;
}
