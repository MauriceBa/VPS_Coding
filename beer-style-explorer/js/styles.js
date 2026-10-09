// ============================================================
// STYLES — style data access, filtering and search
// (pure, DOM-free)
// ============================================================

/**
 * Find a single style by its id.
 * @param {Array<Object>} styles - style collection (e.g. STYLES)
 * @param {string} id - style id, e.g. 'hazy-ipa'
 * @returns {Object|undefined} the matching style, or undefined if not found
 */
export function getStyleById(styles, id) {
  return styles.find((s) => s.id === id);
}

/**
 * Filter styles by category, max IBU and max ABV — same predicate
 * the Style Explorer grid uses (compares against each style's
 * lower range bounds).
 * @param {Array<Object>} styles - style collection (e.g. STYLES)
 * @param {Object} [filters] - filter criteria
 * @param {string} [filters.category] - category to keep, or 'all' for every category
 * @param {number} [filters.maxIbu] - keep styles whose lower IBU bound is ≤ this value
 * @param {number} [filters.maxAbv] - keep styles whose lower ABV bound is ≤ this value
 * @returns {Array<Object>} filtered styles (same order as input)
 */
export function filterStyles(
  styles,
  { category = "all", maxIbu = Infinity, maxAbv = Infinity } = {},
) {
  return styles.filter(
    (s) =>
      (category === "all" || s.category === category) && s.ibu[0] <= maxIbu && s.abv[0] <= maxAbv,
  );
}

/**
 * Case-insensitive text search across name, category, WBC category
 * and description.
 * @param {Array<Object>} styles - style collection (e.g. STYLES)
 * @param {string} query - free-text query; empty/whitespace returns all styles
 * @returns {Array<Object>} matching styles (same order as input)
 */
export function searchStyles(styles, query) {
  const q = query.trim().toLowerCase();
  if (!q) return styles;
  return styles.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.wbc.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q),
  );
}

/**
 * List the distinct categories present in the collection,
 * in order of first appearance.
 * @param {Array<Object>} styles - style collection (e.g. STYLES)
 * @returns {Array<string>} unique category names
 */
export function getCategories(styles) {
  return [...new Set(styles.map((s) => s.category))];
}
