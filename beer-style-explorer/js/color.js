// ============================================================
// COLOR — pure SRM → hex helpers (no DOM dependencies)
// ============================================================

const SRM_COLORS = [
  "#F3F993",
  "#F5F75C",
  "#F6F513",
  "#EAE615",
  "#E0D01B",
  "#D5BC26",
  "#CDAA37",
  "#C1963C",
  "#BE8C3A",
  "#BE823A",
  "#C17A37",
  "#BF7138",
  "#BC6733",
  "#B26033",
  "#A85839",
  "#985336",
  "#8D4C32",
  "#7C452D",
  "#6B3A24",
  "#5D341A",
  "#4B2F12",
  "#42280F",
  "#3D250D",
  "#361F0B",
  "#2E1A08",
  "#291608",
  "#241309",
  "#1F1007",
  "#1A0D04",
  "#160B03",
];

/**
 * Map an SRM color value to an approximate hex color.
 * Values below 1 clamp to the lightest color; values above the
 * table clamp to the darkest.
 * @param {number} srm - SRM value (typically 1–40)
 * @returns {string} hex color string, e.g. '#F3F993'
 */
export function srmToHex(srm) {
  const idx = Math.min(Math.max(Math.round(srm) - 1, 0), SRM_COLORS.length - 1);
  return SRM_COLORS[idx];
}
