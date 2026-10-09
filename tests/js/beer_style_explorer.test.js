// ============================================================
// BEER STYLE EXPLORER — pure-module unit tests
// (imports only the DOM-free ES modules under beer-style-explorer/js/)
// ============================================================

import { describe, it, expect } from "vitest";
import { STYLES } from "../../beer-style-explorer/js/style-data.js";
import {
  filterStyles,
  getStyleById,
  searchStyles,
  getCategories,
} from "../../beer-style-explorer/js/styles.js";
import {
  normalizeMetric,
  radarValuesForStyle,
  RADAR_LABELS,
} from "../../beer-style-explorer/js/compare.js";
import {
  estimateAbv,
  totalGrainKg,
  buildGrainBill,
  buildHopSchedule,
  buildRecipe,
  buildRecipeWarnings,
} from "../../beer-style-explorer/js/recipe.js";
import {
  scoreStyle,
  rankStylesByDrift,
  buildDriftSuggestions,
} from "../../beer-style-explorer/js/drift.js";
import { srmToHex } from "../../beer-style-explorer/js/color.js";

const americanIpa = getStyleById(STYLES, "american-ipa");
const hazyIpa = getStyleById(STYLES, "hazy-ipa");
const berlinerWeisse = getStyleById(STYLES, "berliner-weisse");
const americanStout = getStyleById(STYLES, "american-stout");
const sweetCider = getStyleById(STYLES, "sweet-cider");

describe("style-data", () => {
  it("contains the full style catalog", () => {
    expect(STYLES).toHaveLength(23);
  });

  it("has unique ids and the expected category spread", () => {
    const ids = STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(STYLES.length);
    expect(getCategories(STYLES).sort()).toEqual(["cider", "ipa", "lager", "mixed", "stout"]);
  });

  it("gives every style a complete shape", () => {
    for (const s of STYLES) {
      expect(s.name).toBeTruthy();
      expect(s.desc).toBeTruthy();
      expect(s.wbc).toBeTruthy();
      expect(s.fermentation).toMatch(/^(ale|lager|mixed)$/);
      for (const key of ["abv", "ibu", "srm", "og", "fg"]) {
        expect(s[key]).toHaveLength(2);
        expect(s[key][0]).toBeLessThanOrEqual(s[key][1]);
      }
      expect(s.ingredients.grains.length).toBeGreaterThan(0);
      expect(s.ingredients.hops.length).toBeGreaterThan(0);
      expect(s.ingredients.yeast).toBeTruthy();
      expect(s.ingredients.water).toBeTruthy();
    }
  });
});

describe("color", () => {
  it("maps SRM to the first/last table entries at the bounds", () => {
    expect(srmToHex(1)).toBe("#F3F993");
    expect(srmToHex(30)).toBe("#160B03");
  });

  it("clamps out-of-range SRM values", () => {
    expect(srmToHex(0)).toBe("#F3F993");
    expect(srmToHex(-5)).toBe("#F3F993");
    expect(srmToHex(45)).toBe("#160B03");
  });

  it("rounds fractional SRM before indexing", () => {
    expect(srmToHex(2.4)).toBe("#F5F75C"); // rounds to 2 → index 1
    expect(srmToHex(2.6)).toBe("#F6F513"); // rounds to 3 → index 2
  });
});

describe("styles — access & filtering", () => {
  it("finds a style by id", () => {
    expect(getStyleById(STYLES, "hazy-ipa").name).toBe("Hazy IPA (NEIPA)");
    expect(getStyleById(STYLES, "does-not-exist")).toBeUndefined();
  });

  it("filters by category", () => {
    const ipas = filterStyles(STYLES, { category: "ipa" });
    expect(ipas).toHaveLength(5);
    expect(ipas.every((s) => s.category === "ipa")).toBe(true);
  });

  it('returns everything for category "all"', () => {
    expect(filterStyles(STYLES, { category: "all" })).toHaveLength(STYLES.length);
  });

  it("filters by max IBU using lower range bounds", () => {
    const mild = filterStyles(STYLES, { maxIbu: 10 });
    expect(mild.length).toBeGreaterThan(0);
    expect(mild.every((s) => s.ibu[0] <= 10)).toBe(true);
    expect(mild.map((s) => s.id)).toEqual(
      expect.arrayContaining(["gueuze", "berliner-weisse", "hopped-cider"]),
    );
  });

  it("combines category and max ABV filters", () => {
    const sessionableCiders = filterStyles(STYLES, { category: "cider", maxAbv: 5 });
    expect(sessionableCiders.map((s) => s.id).sort()).toEqual(
      ["hopped-cider", "sweet-cider", "traditional-dry-cider"].sort(),
    );
  });

  it("searches case-insensitively across text fields", () => {
    expect(searchStyles(STYLES, "cider")).toHaveLength(4);
    expect(searchStyles(STYLES, "CIDER")).toHaveLength(4);
    expect(searchStyles(STYLES, "lambic")).toHaveLength(1);
  });

  it("returns all styles for a blank query", () => {
    expect(searchStyles(STYLES, "")).toHaveLength(STYLES.length);
    expect(searchStyles(STYLES, "   ")).toHaveLength(STYLES.length);
  });
});

describe("compare — radar normalization", () => {
  it("normalizes into the 0–10 scale", () => {
    expect(normalizeMetric(0, 0, 100)).toBe(0);
    expect(normalizeMetric(100, 0, 100)).toBe(10);
    expect(normalizeMetric(5, 2, 14)).toBeCloseTo(2.5, 10);
    expect(normalizeMetric(2, 2, 14)).toBe(0);
    expect(normalizeMetric(14, 2, 14)).toBe(10);
  });

  it("exposes five labeled radar axes", () => {
    expect(RADAR_LABELS).toHaveLength(5);
    expect(RADAR_LABELS[0]).toBe("ABV");
    expect(RADAR_LABELS[4]).toBe("Attenuation");
  });

  it("computes radar values from range midpoints", () => {
    const values = radarValuesForStyle(americanIpa);
    expect(values).toHaveLength(5);
    // ABV midpoint 6.9 → (6.9 − 2) / (14 − 2) × 10
    expect(values[0]).toBeCloseTo(4.0833333, 5);
    // IBU midpoint 60 → 6
    expect(values[1]).toBe(6);
    // SRM midpoint 10 → (10 − 1) / (40 − 1) × 10
    expect(values[2]).toBeCloseTo(2.3076923, 5);
    // OG midpoint 1.0675 → 67.5 gravity points → (67.5 − 28) / (120 − 28) × 10
    expect(values[3]).toBeCloseTo(4.2934783, 5);
    // Attenuation: 1 − (1.011 − 1.0675 × 0.25) → × 10
    expect(values[4]).toBeCloseTo(2.55875, 5);
  });
});

describe("recipe — generation", () => {
  it("estimates ABV from OG/FG", () => {
    expect(estimateAbv(1.065, 1.012)).toBe("7.0");
    expect(estimateAbv(1.05, 1.01)).toBe("5.3");
  });

  it("computes total grain mass in kg", () => {
    expect(totalGrainKg(1.065, 20)).toBe("2.05");
  });

  it("builds a grain bill from range percentages", () => {
    const bill = buildGrainBill(americanIpa, "2.05");
    expect(bill).toHaveLength(3);
    expect(bill[0]).toEqual({ grain: "2-Row Pale Malt", pct: 88, kg: "1.79" });
    expect(bill[1]).toEqual({ grain: "Vienna or Crystal 20", pct: 8, kg: "0.15" });
    expect(bill[2]).toEqual({ grain: "Carapils", pct: 4, kg: "0.07" });
  });

  it("falls back to 85%/10% shares when grains have no range", () => {
    const bill = buildGrainBill(berlinerWeisse, "2.00");
    expect(bill[0]).toEqual({ grain: "Pilsner Malt", pct: 85, kg: "1.70" });
    expect(bill[1]).toEqual({ grain: "Wheat Malt", pct: 10, kg: "0.20" });
  });

  it("builds a three-addition hop schedule", () => {
    const schedule = buildHopSchedule(americanIpa, 45, 20);
    expect(schedule.map((h) => h.hop)).toEqual(["Centennial", "Cascade", "Columbus (CTZ)"]);
    expect(schedule.map((h) => h.purpose)).toEqual(["Bitterness", "Flavor", "Aroma"]);
    expect(schedule.map((h) => h.time)).toEqual([
      "60 min (bittering)",
      "15 min (flavor)",
      "0 min / Dry-hop",
    ]);
    expect(schedule[0].amount).toMatch(/g$/);
  });

  it("assembles a full recipe", () => {
    const recipe = buildRecipe(americanIpa, {
      name: "Test Brew",
      batch: 20,
      og: 1.065,
      fg: 1.012,
      ibu: 45,
      srm: 6,
    });
    expect(recipe.style).toBe("American IPA");
    expect(recipe.abv).toBe("7.0");
    expect(recipe.grainKg).toBe("2.05");
    expect(recipe.grainBill).toHaveLength(3);
    expect(recipe.hopSchedule).toHaveLength(3);
    expect(recipe.yeast).toBe("American Ale (WY1056 / US-05)");
    // IBU 45 is below the American IPA minimum of 50
    expect(recipe.warnings).toHaveLength(1);
    expect(recipe.warnings[0]).toContain("IBU 45 is below style minimum");
  });

  it("warns when parameters fall outside style ranges", () => {
    expect(buildRecipeWarnings(hazyIpa, 1.065, 40, 5)).toEqual([]);
    const low = buildRecipeWarnings(hazyIpa, 1.03, 10, 1);
    expect(low).toHaveLength(3);
    expect(low[0]).toContain("below style minimum");
    expect(low[2]).toContain("too light");
    const high = buildRecipeWarnings(hazyIpa, 1.09, 60, 9);
    expect(high).toHaveLength(3);
    expect(high[0]).toContain("exceeds style maximum");
    expect(high[2]).toContain("exceeds style range");
  });
});

describe("drift — scoring & suggestions", () => {
  it("scores a perfect in-range match at 90", () => {
    expect(scoreStyle(americanIpa, 6.9, 60, 10, 1.0675, 1.011, "ale")).toBe(90);
  });

  it("gives kveik a partial bonus on an ale style", () => {
    expect(scoreStyle(americanIpa, 6.9, 60, 10, 1.0675, 1.011, "kveik")).toBe(86);
  });

  it("decays the score for out-of-range metrics", () => {
    // ABV 20 is far outside [6.3, 7.5] → contributes 0 instead of 20
    expect(scoreStyle(americanIpa, 20, 60, 10, 1.0675, 1.011, "ale")).toBe(70);
  });

  it("ranks styles best-match first, descending", () => {
    const scores = rankStylesByDrift(STYLES, 6.9, 60, 10, 1.0675, 1.011, "ale");
    expect(scores[0].style.id).toBe("american-ipa");
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i].score).toBeGreaterThanOrEqual(scores[i + 1].score);
    }
  });

  it("suggests an on-target message when everything matches", () => {
    const suggestions = buildDriftSuggestions(
      americanIpa,
      [{ style: americanIpa, score: 90 }],
      6.9,
      60,
      10,
      "ale",
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toContain("You're on target!");
    expect(suggestions[0]).toContain("American IPA");
  });

  it("suggests directional adjustments toward the best style", () => {
    const suggestions = buildDriftSuggestions(
      americanIpa,
      [{ style: americanIpa, score: 90 }],
      5.0,
      20,
      20,
      "lager",
    );
    expect(suggestions).toHaveLength(4);
    expect(suggestions[0]).toContain("Increase ABV");
    expect(suggestions[0]).toContain("≥6.3%");
    expect(suggestions[1]).toContain("Increase IBU");
    expect(suggestions[1]).toContain("≥50");
    expect(suggestions[1]).toContain("Centennial");
    expect(suggestions[2]).toContain("Lighten color");
    expect(suggestions[2]).toContain("≤14");
    expect(suggestions[3]).toContain("Change fermentation");
    expect(suggestions[3]).toContain("ale");
  });

  it("recommends roasted malts when darkening a stout", () => {
    const suggestions = buildDriftSuggestions(
      americanStout,
      [{ style: americanStout, score: 80 }],
      6.0,
      45,
      10,
      "ale",
    );
    expect(suggestions.some((s) => s.includes("Darken color"))).toBe(true);
    expect(suggestions.some((s) => s.includes("Roasted Barley or Black Patent"))).toBe(true);
  });

  it("adds the Hazy → West Coast shift tip when hazy scores higher", () => {
    const suggestions = buildDriftSuggestions(
      hazyIpa,
      [
        { style: hazyIpa, score: 80 },
        { style: americanIpa, score: 70 },
      ],
      6.5,
      40,
      5,
      "ale",
    );
    expect(suggestions.some((s) => s.includes("To shift Hazy → West Coast IPA"))).toBe(true);
  });

  it("adds the Sweet → Dry cider tip when sweet cider scores higher", () => {
    const suggestions = buildDriftSuggestions(
      sweetCider,
      [{ style: sweetCider, score: 75 }],
      5.0,
      0,
      4,
      "ale",
    );
    expect(suggestions.some((s) => s.includes("To shift Sweet → Bone-Dry Cider"))).toBe(true);
  });
});
