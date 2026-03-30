// ============================================================
// BEER & CIDER STYLE DATA
// Based on Brewers Association Beer Style Guidelines 2026
// & World Beer Cup 2026 Categories
// ============================================================

const STYLES = [
  // ── IPA ──────────────────────────────────────────────────
  {
    id: 'american-ipa',
    name: 'American IPA',
    category: 'ipa',
    abv: [6.3, 7.5],
    ibu: [50, 70],
    srm: [6, 14],
    og: [1.060, 1.075],
    fg: [1.008, 1.014],
    fermentation: 'ale',
    wbc: 'American-Style India Pale Ale',
    ingredients: {
      grains: ['2-Row Pale Malt (85–90%)', 'Vienna or Crystal 20 (5–10%)', 'Carapils (2–5%)'],
      hops: ['Centennial', 'Cascade', 'Columbus (CTZ)', 'Simcoe'],
      yeast: 'American Ale (WY1056 / US-05)',
      water: 'High sulfate (200–400 ppm SO4), low chloride (<50 ppm)'
    },
    desc: 'Assertive hop bitterness, flavor and aroma. Resinous, piney, citrusy hop character. Clean fermentation profile. Medium-bodied.'
  },
  {
    id: 'hazy-ipa',
    name: 'Hazy IPA (NEIPA)',
    category: 'ipa',
    abv: [6.0, 7.5],
    ibu: [25, 50],
    srm: [3, 7],
    og: [1.060, 1.075],
    fg: [1.010, 1.016],
    fermentation: 'ale',
    wbc: 'Juicy or Hazy India Pale Ale',
    ingredients: {
      grains: ['2-Row or Pilsner Malt (55–65%)', 'Flaked Oats (15–20%)', 'Wheat Malt (10–20%)', 'Flaked Wheat (5–10%)'],
      hops: ['Citra', 'Mosaic', 'Sabro', 'El Dorado', 'Galaxy'],
      yeast: 'London Ale III (WY1318) / Verdant IPA',
      water: 'Balanced to chloride-forward (150–200 ppm Cl), low sulfate (<100 ppm)'
    },
    desc: 'Hazy to opaque appearance, juicy tropical and citrus hop aroma. Soft mouthfeel from oats/wheat. Low perceived bitterness despite high dry-hop rates.'
  },
  {
    id: 'westcoast-ipa',
    name: 'West Coast IPA',
    category: 'ipa',
    abv: [6.0, 7.5],
    ibu: [45, 75],
    srm: [4, 10],
    og: [1.060, 1.075],
    fg: [1.006, 1.012],
    fermentation: 'ale',
    wbc: 'American-Style India Pale Ale',
    ingredients: {
      grains: ['2-Row Pale Malt (90–95%)', 'Crystal 10–20 (2–5%)', 'Carapils (2–5%)'],
      hops: ['Simcoe', 'Mosaic', 'Citra', 'Centennial', 'Columbus'],
      yeast: 'California Ale (WY1056 / WLP001 / US-05)',
      water: 'High sulfate (300–500 ppm SO4), very low chloride (<50 ppm)'
    },
    desc: 'Crystal clear, resinous and piney. Assertive bitterness with dry finish. High attenuation. Clean fermentation, no esters.'
  },
  {
    id: 'double-ipa',
    name: 'Double IPA',
    category: 'ipa',
    abv: [7.5, 10.5],
    ibu: [65, 100],
    srm: [5, 12],
    og: [1.075, 1.100],
    fg: [1.008, 1.016],
    fermentation: 'ale',
    wbc: 'Imperial India Pale Ale',
    ingredients: {
      grains: ['2-Row Pale Malt (90%)', 'Corn Sugar/Dextrose (5–8%)', 'Crystal 10 (2–5%)'],
      hops: ['Columbus', 'Centennial', 'Simcoe', 'Citra'],
      yeast: 'California Ale (WY1056) or Vermont Ale (WY1318)',
      water: 'High sulfate (250–400 ppm SO4)'
    },
    desc: 'Intensified hop bitterness and aroma relative to standard IPA. Rich malt backbone to balance. Medium-high alcohol.'
  },
  {
    id: 'session-ipa',
    name: 'Session IPA',
    category: 'ipa',
    abv: [3.7, 5.0],
    ibu: [30, 50],
    srm: [3, 9],
    og: [1.035, 1.052],
    fg: [1.006, 1.010],
    fermentation: 'ale',
    wbc: 'Session India Pale Ale',
    ingredients: {
      grains: ['2-Row Pale Malt (88–93%)', 'Flaked Barley (5%)', 'Carapils (2–5%)'],
      hops: ['Citra', 'Mosaic', 'Amarillo'],
      yeast: 'US-05 / WLP001',
      water: 'Moderate sulfate (150–250 ppm SO4)'
    },
    desc: 'Lower alcohol version retaining IPA hop character. Light body, highly drinkable. Hop-forward aroma and flavor.'
  },

  // ── STOUT ────────────────────────────────────────────────
  {
    id: 'american-stout',
    name: 'American Stout',
    category: 'stout',
    abv: [5.0, 8.9],
    ibu: [35, 60],
    srm: [35, 40],
    og: [1.050, 1.085],
    fg: [1.010, 1.022],
    fermentation: 'ale',
    wbc: 'American-Style Stout',
    ingredients: {
      grains: ['Pale Malt (70%)', 'Roasted Barley (8–10%)', 'Chocolate Malt (5%)', 'Crystal 80 (5%)', 'Black Patent (2–3%)'],
      hops: ['Centennial', 'Columbus', 'Chinook'],
      yeast: 'American Ale (US-05 / WLP001)',
      water: 'Moderate sulfate and chloride balance'
    },
    desc: 'Dark, opaque, roasty. Strong coffee and dark chocolate notes. Assertive American hop bitterness. Full body.'
  },
  {
    id: 'imperial-stout',
    name: 'Imperial / Russian Imperial Stout',
    category: 'stout',
    abv: [8.0, 12.0],
    ibu: [50, 90],
    srm: [35, 40],
    og: [1.080, 1.120],
    fg: [1.016, 1.030],
    fermentation: 'ale',
    wbc: 'Imperial Stout',
    ingredients: {
      grains: ['Maris Otter or 2-Row (65%)', 'Crystal 120 (8%)', 'Chocolate Malt (7%)', 'Roasted Barley (7%)', 'Black Patent (3%)'],
      hops: ['Magnum', 'Columbus', 'East Kent Goldings'],
      yeast: 'English Ale (WY1028) or American Ale (WY1056)',
      water: 'Soft to moderate mineral content'
    },
    desc: 'Very complex, full-bodied, very dark. Rich chocolate, espresso, dark fruit. High warming alcohol. Excellent aging potential.'
  },
  {
    id: 'oatmeal-stout',
    name: 'Oatmeal Stout',
    category: 'stout',
    abv: [3.8, 6.0],
    ibu: [20, 40],
    srm: [20, 40],
    og: [1.038, 1.065],
    fg: [1.008, 1.018],
    fermentation: 'ale',
    wbc: 'Oatmeal Stout',
    ingredients: {
      grains: ['Pale Malt (65%)', 'Flaked Oats (10–15%)', 'Roasted Barley (8%)', 'Crystal 80 (7%)'],
      hops: ['Fuggle', 'East Kent Goldings'],
      yeast: 'English Ale (WY1968 / WLP002)',
      water: 'Soft, moderate sulfate'
    },
    desc: 'Silky smooth mouthfeel from oats. Mild roastiness, some sweetness. Medium body. Less bitter than American stout.'
  },
  {
    id: 'milk-stout',
    name: 'Milk / Sweet Stout',
    category: 'stout',
    abv: [3.2, 6.0],
    ibu: [15, 35],
    srm: [30, 40],
    og: [1.040, 1.065],
    fg: [1.012, 1.020],
    fermentation: 'ale',
    wbc: 'Sweet Stout or Cream Stout',
    ingredients: {
      grains: ['Pale Malt (65%)', 'Lactose (10%)', 'Roasted Barley (8%)', 'Crystal 120 (7%)'],
      hops: ['Fuggle', 'Goldings'],
      yeast: 'English Ale (WLP002 / WY1968)',
      water: 'Soft water'
    },
    desc: 'Sweet, creamy, and low in bitterness. Lactose provides residual sweetness. Coffee and chocolate with a smooth finish.'
  },

  // ── LAGER ────────────────────────────────────────────────
  {
    id: 'german-pilsner',
    name: 'German Pilsner',
    category: 'lager',
    abv: [4.6, 5.3],
    ibu: [25, 40],
    srm: [2, 4],
    og: [1.044, 1.055],
    fg: [1.006, 1.012],
    fermentation: 'lager',
    wbc: 'German-Style Pilsener',
    ingredients: {
      grains: ['German Pilsner Malt (95–100%)', 'Carapils (0–3%)'],
      hops: ['Hallertau Mittelfrueh', 'Tettnang', 'Saaz'],
      yeast: 'German Lager (WY2124 / WLP830)',
      water: 'Very soft (low mineral) to moderate sulfate'
    },
    desc: 'Pale golden, clear. Floral noble hop aroma, clean malt character. Crisp, dry finish. Classic European lager bitterness.'
  },
  {
    id: 'czech-pilsner',
    name: 'Bohemian / Czech Pilsner',
    category: 'lager',
    abv: [4.1, 5.1],
    ibu: [30, 45],
    srm: [3, 6],
    og: [1.044, 1.056],
    fg: [1.013, 1.017],
    fermentation: 'lager',
    wbc: 'Bohemian-Style Pilsener',
    ingredients: {
      grains: ['Bohemian Pilsner Malt (95–100%)'],
      hops: ['Saaz (whole hops preferred)'],
      yeast: 'Bohemian Lager (WY2001 / WLP800)',
      water: 'Very soft water (Pilsen profile, <30 ppm hardness)'
    },
    desc: 'Rich golden color, creamy white head. Spicy Saaz hops, biscuity malt. Soft body, full carbonation. The original pilsner.'
  },
  {
    id: 'american-lager',
    name: 'American Lager',
    category: 'lager',
    abv: [3.8, 5.0],
    ibu: [5, 15],
    srm: [2, 4],
    og: [1.040, 1.050],
    fg: [1.006, 1.010],
    fermentation: 'lager',
    wbc: 'American-Style Lager',
    ingredients: {
      grains: ['2-Row Pale Malt (60–70%)', 'Corn/Maize (20–30%)', 'Rice (optional 10%)'],
      hops: ['Cluster', 'Liberty', 'Hallertau (low)'],
      yeast: 'American Lager (WY2035 / WLP840)',
      water: 'Very soft, neutral mineral profile'
    },
    desc: 'Very pale, highly carbonated. Very light body from adjuncts. Minimal hop character. Clean, refreshing, highly drinkable.'
  },
  {
    id: 'munich-helles',
    name: 'Munich Helles',
    category: 'lager',
    abv: [4.7, 5.4],
    ibu: [16, 22],
    srm: [3, 5],
    og: [1.045, 1.052],
    fg: [1.008, 1.012],
    fermentation: 'lager',
    wbc: 'Munich-Style Helles',
    ingredients: {
      grains: ['German Pilsner Malt (95%)', 'Munich Malt (5%)'],
      hops: ['Hallertau Mittelfrueh', 'Tettnang'],
      yeast: 'German Lager (WY2124)',
      water: 'Munich water profile (moderate bicarbonate)'
    },
    desc: 'Pale gold, malt-forward. Bready, grainy sweetness with subtle noble hop presence. Soft, clean, well-balanced.'
  },
  {
    id: 'schwarzbier',
    name: 'Schwarzbier',
    category: 'lager',
    abv: [3.8, 5.0],
    ibu: [22, 32],
    srm: [25, 30],
    og: [1.044, 1.052],
    fg: [1.010, 1.016],
    fermentation: 'lager',
    wbc: 'Schwarzbier',
    ingredients: {
      grains: ['Pilsner Malt (55%)', 'Munich Malt (20%)', 'Carafa Special II (15%)', 'Chocolate Malt (10%)'],
      hops: ['Hallertau', 'Tettnang'],
      yeast: 'German Lager (WY2124)',
      water: 'Munich profile'
    },
    desc: 'Black lager. Mild roast character without astringency (dehusked roast malt). Smooth, clean lager finish. Low bitterness.'
  },

  // ── MIXED FERMENTATION ───────────────────────────────────
  {
    id: 'american-wild-ale',
    name: 'American Wild Ale',
    category: 'mixed',
    abv: [4.0, 8.0],
    ibu: [5, 30],
    srm: [4, 20],
    og: [1.040, 1.080],
    fg: [1.002, 1.010],
    fermentation: 'mixed',
    wbc: 'American-Style Wild Ale',
    ingredients: {
      grains: ['Pilsner/Pale Malt (60–80%)', 'Wheat Malt (10–20%)', 'Oats (optional)', 'Adjuncts/Fruit (variable)'],
      hops: ['Aged hops (low alpha)', 'Styrian Goldings'],
      yeast: 'Mixed: Saccharomyces + Brettanomyces + Lactobacillus + Pediococcus',
      water: 'Variable, often soft'
    },
    desc: 'Complex, tart, funky. Brett-driven earthy and barnyard notes. Lactic acidity. Often aged in oak barrels. Highly variable character.'
  },
  {
    id: 'gueuze',
    name: 'Gueuze / Lambic',
    category: 'mixed',
    abv: [5.0, 8.0],
    ibu: [0, 10],
    srm: [3, 9],
    og: [1.044, 1.060],
    fg: [1.000, 1.010],
    fermentation: 'mixed',
    wbc: 'Traditional Belgian-Style Gueuze',
    ingredients: {
      grains: ['Pilsner Malt (60–70%)', 'Unmalted Wheat (30–40%)'],
      hops: ['Aged hops (3+ years) for preservation only'],
      yeast: 'Spontaneous: Brettanomyces, Pediococcus, Enterobacteriaceae (natural microflora)',
      water: 'Soft Brussels water'
    },
    desc: 'Spontaneously fermented. Intensely sour, dry, complex. Horse blanket, musty, lemon, green apple. No added sugar or fruit.'
  },
  {
    id: 'flanders-red',
    name: 'Flanders Red Ale',
    category: 'mixed',
    abv: [4.8, 6.6],
    ibu: [10, 25],
    srm: [10, 16],
    og: [1.048, 1.065],
    fg: [1.002, 1.012],
    fermentation: 'mixed',
    wbc: 'Flanders Red Ale',
    ingredients: {
      grains: ['Vienna Malt (40%)', 'Munich Malt (20%)', 'Crystal 60 (15%)', 'Caramunich (10%)', 'Special B (5%)'],
      hops: ['East Kent Goldings', 'Styrian Goldings (low)'],
      yeast: 'Mixed: Saccharomyces + Acetobacter + Lactobacillus (Roeselare blend WY3763)',
      water: 'Moderate mineral'
    },
    desc: 'Vinous, complex, tart red ale. Blended from young and old. Sour cherry, plum, balsamic notes. Aged in large oak foeder.'
  },
  {
    id: 'berliner-weisse',
    name: 'Berliner Weisse',
    category: 'mixed',
    abv: [2.8, 3.8],
    ibu: [3, 8],
    srm: [2, 4],
    og: [1.028, 1.040],
    fg: [1.003, 1.006],
    fermentation: 'mixed',
    wbc: 'Berliner-Style Weisse',
    ingredients: {
      grains: ['Pilsner Malt (60%)', 'Wheat Malt (40%)'],
      hops: ['Hallertau (minimal)'],
      yeast: 'Lacto (Lactobacillus plantarum) + Ale yeast (WY1007)',
      water: 'Soft Berlin water'
    },
    desc: 'Very low ABV, sharply sour. Clean lactic acidity. Pale, slightly hazy. Traditionally served with sweet syrup (Waldmeister or Himbeer).'
  },
  {
    id: 'saison',
    name: 'Saison / Farmhouse Ale',
    category: 'mixed',
    abv: [4.4, 8.0],
    ibu: [20, 40],
    srm: [4, 14],
    og: [1.048, 1.080],
    fg: [1.002, 1.012],
    fermentation: 'ale',
    wbc: 'Classic French & Belgian-Style Saison',
    ingredients: {
      grains: ['Pilsner Malt (70%)', 'Vienna Malt (10%)', 'Wheat Malt (10%)', 'Spelt (optional 10%)'],
      hops: ['Styrian Goldings', 'Saaz', 'East Kent Goldings'],
      yeast: 'Saison (WY3724 / WLP565 / Dupont)',
      water: 'Soft to moderate mineral'
    },
    desc: 'Highly attenuated, spicy, fruity, dry. Peppery and citrusy yeast character. Rustic and complex. Variable by season and brewer.'
  },

  // ── CIDER ────────────────────────────────────────────────
  {
    id: 'traditional-dry-cider',
    name: 'Traditional Dry Cider',
    category: 'cider',
    abv: [5.0, 9.0],
    ibu: [0, 0],
    srm: [1, 5],
    og: [1.045, 1.070],
    fg: [0.999, 1.004],
    fermentation: 'ale',
    wbc: 'Traditional Cider',
    ingredients: {
      grains: ['Apple juice/cider apples (100%)', 'Acid-blend (optional)'],
      hops: ['None'],
      yeast: 'Champagne yeast (EC-1118) or Cider Yeast (Lalvin 71B)',
      water: 'N/A — apple juice'
    },
    desc: 'Bone-dry to off-dry. Crisp, tannic, tart. Complex apple character. Can be still or sparkling. Traditional English or French style.'
  },
  {
    id: 'sweet-cider',
    name: 'Sweet / Dessert Cider',
    category: 'cider',
    abv: [4.0, 7.0],
    ibu: [0, 0],
    srm: [2, 6],
    og: [1.050, 1.080],
    fg: [1.010, 1.020],
    fermentation: 'ale',
    wbc: 'Sweet Cider',
    ingredients: {
      grains: ['Dessert apple juice (sweet varieties)', 'Honey (optional)', 'Back-sweetening sugar'],
      hops: ['None'],
      yeast: 'Cider yeast (71B) — arrested fermentation or back-sweetened',
      water: 'N/A'
    },
    desc: 'Residual sweetness dominant. Fresh apple flavor. Soft tannins. Can be still or carbonated. Often lower ABV due to stopped fermentation.'
  },
  {
    id: 'farmhouse-cider',
    name: 'Farmhouse / Heritage Cider',
    category: 'cider',
    abv: [5.5, 8.5],
    ibu: [0, 0],
    srm: [3, 10],
    og: [1.050, 1.080],
    fg: [1.000, 1.008],
    fermentation: 'mixed',
    wbc: 'Specialty Cider & Perry',
    ingredients: {
      grains: ['Bittersweet/bittersharp apple varieties', 'Wild/native yeasts', 'Tannin additions optional'],
      hops: ['None'],
      yeast: 'Wild/spontaneous or mixed culture',
      water: 'N/A'
    },
    desc: 'Complex, tannic, rustic. Often cloudy. Fermented with wild or mixed cultures. Barnyard and funk notes possible. Highly variable.'
  },
  {
    id: 'hopped-cider',
    name: 'Hopped Cider',
    category: 'cider',
    abv: [5.0, 8.0],
    ibu: [5, 25],
    srm: [2, 8],
    og: [1.050, 1.070],
    fg: [1.000, 1.008],
    fermentation: 'ale',
    wbc: 'Specialty Cider & Perry',
    ingredients: {
      grains: ['Apple juice base', 'Dry-hop additions'],
      hops: ['Citra', 'Mosaic', 'Galaxy (dry-hop only)'],
      yeast: 'Champagne or Cider yeast',
      water: 'N/A'
    },
    desc: 'Dry cider base infused with hop aroma. Citrus and tropical notes over crisp apple. Increasingly popular craft category.'
  }
];

// SRM to hex color approximation
function srmToHex(srm) {
  const colors = [
    '#F3F993','#F5F75C','#F6F513','#EAE615','#E0D01B',
    '#D5BC26','#CDAA37','#C1963C','#BE8C3A','#BE823A',
    '#C17A37','#BF7138','#BC6733','#B26033','#A85839',
    '#985336','#8D4C32','#7C452D','#6B3A24','#5D341A',
    '#4B2F12','#42280F','#3D250D','#361F0B','#2E1A08',
    '#291608','#241309','#1F1007','#1A0D04','#160B03'
  ];
  const idx = Math.min(Math.max(Math.round(srm) - 1, 0), colors.length - 1);
  return colors[idx];
}
