// ============================================================
// BEER STYLE EXPLORER — Main Application
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── TAB NAVIGATION ──────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ── STYLE EXPLORER ──────────────────────────────────────
  const grid = document.getElementById('style-grid');
  const filterCat = document.getElementById('filter-category');
  const filterIbu = document.getElementById('filter-ibu');
  const filterAbv = document.getElementById('filter-abv');
  const ibuVal = document.getElementById('ibu-val');
  const abvVal = document.getElementById('abv-val');

  function renderGrid() {
    const cat = filterCat.value;
    const maxIbu = +filterIbu.value;
    const maxAbv = +filterAbv.value;
    ibuVal.textContent = maxIbu;
    abvVal.textContent = maxAbv;

    const filtered = STYLES.filter(s =>
      (cat === 'all' || s.category === cat) &&
      s.ibu[0] <= maxIbu &&
      s.abv[0] <= maxAbv
    );

    grid.innerHTML = '';
    filtered.forEach(s => {
      const avgSrm = Math.round((s.srm[0] + s.srm[1]) / 2);
      const card = document.createElement('div');
      card.className = 'style-card';
      card.innerHTML = `
        <div class="card-header">
          <h3>${s.name}</h3>
          <span class="style-badge badge-${s.category}">${s.category}</span>
        </div>
        <div class="stats">
          <div class="stat-pill">ABV: <span>${s.abv[0]}–${s.abv[1]}%</span></div>
          <div class="stat-pill">IBU: <span>${s.ibu[0]}–${s.ibu[1]}</span></div>
          <div class="stat-pill">SRM: <span>${s.srm[0]}–${s.srm[1]}</span>
            <span class="color-swatch" style="background:${srmToHex(avgSrm)}"></span>
          </div>
          <div class="stat-pill">OG: <span>${s.og[0]}–${s.og[1]}</span></div>
          <div class="stat-pill">FG: <span>${s.fg[0]}–${s.fg[1]}</span></div>
          <div class="stat-pill">Ferm: <span>${s.fermentation}</span></div>
        </div>
        <div class="stat-pill" style="margin-bottom:0.5rem">🏆 WBC: <span style="color:var(--muted)">${s.wbc}</span></div>
        <div class="desc">${s.desc}</div>
        <details style="margin-top:0.75rem">
          <summary style="cursor:pointer;color:var(--accent);font-size:0.85rem">🌾 Ingredients</summary>
          <div style="font-size:0.8rem;color:var(--muted);margin-top:0.5rem;line-height:1.7">
            <b style="color:var(--text)">Grains:</b> ${s.ingredients.grains.join(', ')}<br/>
            <b style="color:var(--text)">Hops:</b> ${s.ingredients.hops.join(', ')}<br/>
            <b style="color:var(--text)">Yeast:</b> ${s.ingredients.yeast}<br/>
            <b style="color:var(--text)">Water:</b> ${s.ingredients.water}
          </div>
        </details>
      `;
      grid.appendChild(card);
    });
    if (filtered.length === 0) {
      grid.innerHTML = '<p style="color:var(--muted);padding:1rem">No styles match the current filters.</p>';
    }
  }

  filterCat.addEventListener('change', renderGrid);
  filterIbu.addEventListener('input', renderGrid);
  filterAbv.addEventListener('input', renderGrid);
  renderGrid();

  // ── COMPARE ─────────────────────────────────────────────
  const compareA = document.getElementById('compare-a');
  const compareB = document.getElementById('compare-b');
  let radarChart = null;

  function populateCompareSelects() {
    [compareA, compareB].forEach((sel, i) => {
      STYLES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        sel.appendChild(opt);
      });
    });
    compareB.value = STYLES[1].id;
  }
  populateCompareSelects();

  document.getElementById('btn-compare').addEventListener('click', () => {
    const sA = STYLES.find(s => s.id === compareA.value);
    const sB = STYLES.find(s => s.id === compareB.value);
    if (!sA || !sB) return;

    const res = document.getElementById('compare-result');
    const fields = [
      ['Category', s => s.category],
      ['ABV', s => `${s.abv[0]}–${s.abv[1]}%`],
      ['IBU', s => `${s.ibu[0]}–${s.ibu[1]}`],
      ['SRM (Color)', s => `${s.srm[0]}–${s.srm[1]}`],
      ['OG', s => `${s.og[0]}–${s.og[1]}`],
      ['FG', s => `${s.fg[0]}–${s.fg[1]}`],
      ['Fermentation', s => s.fermentation],
      ['WBC Category', s => s.wbc],
      ['Grains', s => s.ingredients.grains.join(', ')],
      ['Hops', s => s.ingredients.hops.join(', ')],
      ['Yeast', s => s.ingredients.yeast],
      ['Water Profile', s => s.ingredients.water],
    ];

    const makeCard = (style) => `
      <div class="compare-card">
        <h3>${style.name} <span class="style-badge badge-${style.category}">${style.category}</span></h3>
        ${fields.map(([label, fn]) => `
          <div class="compare-row">
            <span class="label">${label}</span>
            <span class="val">${fn(style)}</span>
          </div>
        `).join('')}
        <div style="margin-top:0.75rem;font-size:0.82rem;color:var(--muted)">${style.desc}</div>
      </div>
    `;
    res.innerHTML = makeCard(sA) + makeCard(sB);

    // Radar chart
    const normalize = (val, min, max) => ((val - min) / (max - min)) * 10;
    const dataA = [
      normalize((sA.abv[0]+sA.abv[1])/2, 2, 14),
      normalize((sA.ibu[0]+sA.ibu[1])/2, 0, 100),
      normalize((sA.srm[0]+sA.srm[1])/2, 1, 40),
      normalize((sA.og[0]+sA.og[1])/2*1000-1000, 28, 120),
      normalize(1-((sA.fg[0]+sA.fg[1])/2-(sA.og[0]+sA.og[1])/2*0.25), 0, 1),
    ];
    const dataB = [
      normalize((sB.abv[0]+sB.abv[1])/2, 2, 14),
      normalize((sB.ibu[0]+sB.ibu[1])/2, 0, 100),
      normalize((sB.srm[0]+sB.srm[1])/2, 1, 40),
      normalize((sB.og[0]+sB.og[1])/2*1000-1000, 28, 120),
      normalize(1-((sB.fg[0]+sB.fg[1])/2-(sB.og[0]+sB.og[1])/2*0.25), 0, 1),
    ];

    if (radarChart) radarChart.destroy();
    const ctx = document.getElementById('radarChart').getContext('2d');
    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['ABV', 'Bitterness (IBU)', 'Color (SRM)', 'Gravity (OG)', 'Attenuation'],
        datasets: [
          { label: sA.name, data: dataA, backgroundColor: 'rgba(245,166,35,0.2)', borderColor: '#f5a623', pointBackgroundColor: '#f5a623' },
          { label: sB.name, data: dataB, backgroundColor: 'rgba(232,99,42,0.2)', borderColor: '#e8632a', pointBackgroundColor: '#e8632a' }
        ]
      },
      options: {
        scales: { r: { beginAtZero: true, max: 10, grid: { color: '#2e3250' }, pointLabels: { color: '#e8eaf6' }, ticks: { display: false } } },
        plugins: { legend: { labels: { color: '#e8eaf6' } } }
      }
    });
  });

  // ── RECIPE BUILDER ──────────────────────────────────────
  const rStyleSel = document.getElementById('r-style');
  STYLES.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    rStyleSel.appendChild(opt);
  });

  let lastRecipe = null;

  document.getElementById('btn-build').addEventListener('click', () => {
    const style = STYLES.find(s => s.id === rStyleSel.value);
    if (!style) return;
    const name = document.getElementById('r-name').value || 'My Brew';
    const batch = +document.getElementById('r-batch').value || 20;
    const og = +document.getElementById('r-og').value || 1.065;
    const fg = +document.getElementById('r-fg').value || 1.012;
    const ibu = +document.getElementById('r-ibu').value || 45;
    const srm = +document.getElementById('r-srm').value || 6;
    const abv = ((og - fg) * 131.25).toFixed(1);
    const efficiency = 0.75;
    const points = (og - 1) * 1000;
    const grainLbs = ((points * batch) / (efficiency * 383)).toFixed(2);
    const grainKg = (grainLbs * 0.453592).toFixed(2);

    const grains = style.ingredients.grains;
    const hops = style.ingredients.hops;
    const yeast = style.ingredients.yeast;
    const water = style.ingredients.water;
    const avgSrm = (style.srm[0] + style.srm[1]) / 2;

    // Grain bill calculation
    const grainBill = grains.map((g, i) => {
      const pctMatch = g.match(/(\d+)[–-](\d+)%/);
      const pct = pctMatch ? (parseInt(pctMatch[1]) + parseInt(pctMatch[2])) / 200 : (i === 0 ? 0.85 : 0.1);
      const kg = (grainKg * pct).toFixed(2);
      return { grain: g.replace(/\s*\(.*\)/, ''), pct: Math.round(pct * 100), kg };
    });

    // Hop schedule
    const hopSchedule = [
      { hop: hops[0] || hops[0], amount: (ibu * 0.015 * batch / 1000 * 10).toFixed(1) + 'g', time: '60 min (bittering)', purpose: 'Bitterness' },
      { hop: hops[Math.min(1, hops.length-1)], amount: (ibu * 0.010 * batch / 1000 * 10).toFixed(1) + 'g', time: '15 min (flavor)', purpose: 'Flavor' },
      { hop: hops[Math.min(2, hops.length-1)], amount: (ibu * 0.020 * batch / 1000 * 10).toFixed(1) + 'g', time: '0 min / Dry-hop', purpose: 'Aroma' },
    ];

    const srmColor = srmToHex(srm);

    const warnings = [];
    if (og < style.og[0]) warnings.push(`⚠ OG ${og} is below style minimum (${style.og[0]}). Increase grain bill.`);
    if (og > style.og[1]) warnings.push(`⚠ OG ${og} exceeds style maximum (${style.og[1]}). Reduce grain bill.`);
    if (ibu < style.ibu[0]) warnings.push(`⚠ IBU ${ibu} is below style minimum (${style.ibu[0]}). Add more bittering hops.`);
    if (ibu > style.ibu[1]) warnings.push(`⚠ IBU ${ibu} exceeds style maximum (${style.ibu[1]}). Reduce hop load.`);
    if (srm < style.srm[0]) warnings.push(`⚠ SRM ${srm} is too light for this style (min ${style.srm[0]}). Add darker malts.`);
    if (srm > style.srm[1]) warnings.push(`⚠ SRM ${srm} exceeds style range (max ${style.srm[1]}). Reduce dark malts.`);

    lastRecipe = { name, style: style.name, batch, og, fg, ibu, srm, abv, grainKg, grainBill, hopSchedule, yeast, water };

    const out = document.getElementById('recipe-output');
    out.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <div>
          <h2 style="color:var(--accent)">${name}</h2>
          <div style="color:var(--muted);font-size:0.9rem">${style.name} — ${batch}L batch</div>
        </div>
        <div style="width:40px;height:40px;border-radius:50%;background:${srmColor};border:2px solid var(--border)"></div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">
        <div class="stat-pill">ABV: <span>~${abv}%</span></div>
        <div class="stat-pill">OG: <span>${og}</span></div>
        <div class="stat-pill">FG: <span>${fg}</span></div>
        <div class="stat-pill">IBU: <span>${ibu}</span></div>
        <div class="stat-pill">SRM: <span>${srm}</span></div>
        <div class="stat-pill">Grain Total: <span>${grainKg} kg</span></div>
      </div>

      ${warnings.length ? `<div style="margin-bottom:1rem">${warnings.map(w => `<div style="color:#ff7043;font-size:0.85rem;margin-bottom:0.3rem">${w}</div>`).join('')}</div>` : '<div style="color:#66bb6a;font-size:0.85rem;margin-bottom:1rem">✅ All parameters within style guidelines!</div>'}

      <div class="recipe-section">
        <h3>🌾 Grain Bill</h3>
        <table class="recipe-table">
          <thead><tr><th>Malt / Grain</th><th>%</th><th>kg (${batch}L)</th></tr></thead>
          <tbody>${grainBill.map(g => `<tr><td>${g.grain}</td><td>${g.pct}%</td><td>${g.kg} kg</td></tr>`).join('')}</tbody>
        </table>
      </div>

      <div class="recipe-section">
        <h3>🌿 Hop Schedule</h3>
        <table class="recipe-table">
          <thead><tr><th>Hop Variety</th><th>Amount</th><th>Addition Time</th><th>Purpose</th></tr></thead>
          <tbody>${hopSchedule.map(h => `<tr><td>${h.hop}</td><td>${h.amount}</td><td>${h.time}</td><td>${h.purpose}</td></tr>`).join('')}</tbody>
        </table>
      </div>

      <div class="recipe-section">
        <h3>🧫 Yeast & Fermentation</h3>
        <div style="font-size:0.88rem;line-height:1.8;color:var(--muted)">
          <b style="color:var(--text)">Yeast:</b> ${yeast}<br/>
          <b style="color:var(--text)">Water Profile:</b> ${water}<br/>
          <b style="color:var(--text)">Fermentation Type:</b> ${style.fermentation}
        </div>
      </div>

      <div class="tip-box">
        💡 <b>Competition Tip:</b> Enter this beer in the <i>${style.wbc}</i> category at World Beer Cup. Ensure your final beer falls within style parameters for best results.
      </div>
    `;
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    if (!lastRecipe) { alert('Generate a recipe first!'); return; }
    const r = lastRecipe;
    const wb = XLSX.utils.book_new();

    const overviewData = [
      ['Beer Name', r.name],
      ['Style', r.style],
      ['Batch Size (L)', r.batch],
      ['Target OG', r.og],
      ['Target FG', r.fg],
      ['Estimated ABV (%)', r.abv],
      ['Target IBU', r.ibu],
      ['Target SRM', r.srm],
      ['Total Grain (kg)', r.grainKg],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), 'Overview');

    const grainData = [['Malt / Grain', 'Percentage (%)', 'Amount (kg)'], ...r.grainBill.map(g => [g.grain, g.pct, g.kg])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grainData), 'Grain Bill');

    const hopData = [['Hop Variety', 'Amount', 'Addition Time', 'Purpose'], ...r.hopSchedule.map(h => [h.hop, h.amount, h.time, h.purpose])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hopData), 'Hop Schedule');

    const yeastData = [['Yeast', r.yeast], ['Water Profile', r.water]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(yeastData), 'Yeast & Water');

    const allStylesData = [['Style', 'Category', 'ABV Min', 'ABV Max', 'IBU Min', 'IBU Max', 'SRM Min', 'SRM Max', 'OG Min', 'OG Max', 'FG Min', 'FG Max', 'WBC Category']];
    STYLES.forEach(s => allStylesData.push([s.name, s.category, s.abv[0], s.abv[1], s.ibu[0], s.ibu[1], s.srm[0], s.srm[1], s.og[0], s.og[1], s.fg[0], s.fg[1], s.wbc]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allStylesData), 'All Styles Reference');

    XLSX.writeFile(wb, `${r.name.replace(/\s+/g, '_')}_recipe.xlsx`);
  });

  // ── STYLE DRIFT ANALYZER ────────────────────────────────
  let driftChart = null;

  function scoreStyle(style, abv, ibu, srm, og, fg, ferm) {
    let score = 0;
    const inRange = (val, min, max) => val >= min && val <= max;
    const proximity = (val, min, max) => {
      if (inRange(val, min, max)) return 10;
      const mid = (min + max) / 2;
      const range = (max - min) / 2 || 1;
      return Math.max(0, 10 - Math.abs(val - mid) / range * 5);
    };
    score += proximity(abv, style.abv[0], style.abv[1]) * 2;
    score += proximity(ibu, style.ibu[0], style.ibu[1]) * 2;
    score += proximity(srm, style.srm[0], style.srm[1]) * 1.5;
    score += proximity(og, style.og[0], style.og[1]) * 1.5;
    score += proximity(fg, style.fg[0], style.fg[1]) * 1;
    if (style.fermentation === ferm || (style.fermentation === 'mixed' && ferm === 'mixed')) score += 10;
    else if (style.fermentation === 'ale' && ferm === 'kveik') score += 6;
    return Math.round(score);
  }

  document.getElementById('btn-drift').addEventListener('click', () => {
    const abv = +document.getElementById('d-abv').value;
    const ibu = +document.getElementById('d-ibu').value;
    const srm = +document.getElementById('d-srm').value;
    const og = +document.getElementById('d-og').value;
    const fg = +document.getElementById('d-fg').value;
    const ferm = document.getElementById('d-ferm').value;

    const scores = STYLES.map(s => ({ style: s, score: scoreStyle(s, abv, ibu, srm, og, fg, ferm) }))
      .sort((a, b) => b.score - a.score);

    const maxScore = scores[0].score || 1;
    const top = scores.slice(0, 8);
    const best = scores[0].style;

    const driftRes = document.getElementById('drift-result');
    driftRes.innerHTML = `
      <h3 style="margin-bottom:1rem;color:var(--accent)">🎯 Style Match Results</h3>
      ${top.map(({ style, score }) => {
        const pct = Math.round((score / maxScore) * 100);
        return `
          <div class="drift-bar-wrap">
            <div class="drift-bar-label">
              <span>${style.name} <span class="style-badge badge-${style.category}">${style.category}</span></span>
              <span style="color:var(--accent)">${pct}%</span>
            </div>
            <div class="drift-bar-track"><div class="drift-bar-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('')}
    `;

    // Suggestions
    const suggestions = [];
    if (abv < best.abv[0]) suggestions.push(`<li><span>Increase ABV</span> to ≥${best.abv[0]}% — add more fermentable sugars or increase grain bill.</li>`);
    if (abv > best.abv[1]) suggestions.push(`<li><span>Reduce ABV</span> to ≤${best.abv[1]}% — reduce grain bill or dilute with water adjustment.</li>`);
    if (ibu < best.ibu[0]) suggestions.push(`<li><span>Increase IBU</span> to ≥${best.ibu[0]} — add bittering hops (60 min addition). Consider ${best.ingredients.hops[0]}.</li>`);
    if (ibu > best.ibu[1]) suggestions.push(`<li><span>Reduce IBU</span> to ≤${best.ibu[1]} — cut bittering hops, shift to whirlpool/dry-hop only.</li>`);
    if (srm < best.srm[0]) suggestions.push(`<li><span>Darken color</span> to SRM ≥${best.srm[0]} — add ${best.category === 'stout' ? 'Roasted Barley or Black Patent' : 'Crystal 80 or Chocolate Malt'}.</li>`);
    if (srm > best.srm[1]) suggestions.push(`<li><span>Lighten color</span> to SRM ≤${best.srm[1]} — remove dark malts, use lighter base malt.</li>`);
    if (best.fermentation !== ferm) suggestions.push(`<li><span>Change fermentation</span> to ${best.fermentation} — use ${best.ingredients.yeast}.</li>`);
    if (suggestions.length === 0) suggestions.push(`<li><span>You're on target!</span> This recipe fits ${best.name} very well. Fine-tune water profile: ${best.ingredients.water}.</li>`);

    // Special: hazy → west coast path
    const hazyScore = scores.find(s => s.style.id === 'hazy-ipa')?.score || 0;
    const wcScore = scores.find(s => s.style.id === 'westcoast-ipa')?.score || 0;
    if (hazyScore > wcScore && best.id !== 'westcoast-ipa') {
      suggestions.push(`<li><span>To shift Hazy → West Coast IPA:</span> Increase sulfate to 300–500 ppm SO4, lower chloride &lt;50 ppm, switch to US-05/WLP001, add more bittering hops (60 min), use Crystal 10 max 3%.</li>`);
    }
    if (wcScore > hazyScore && best.id !== 'hazy-ipa') {
      suggestions.push(`<li><span>To shift West Coast → Hazy IPA:</span> Add Flaked Oats (15–20%), Flaked Wheat (10%), switch to London Ale III (WY1318), increase chloride to 150–200 ppm, cut bittering hops, maximize dry-hop with Citra/Mosaic.</li>`);
    }

    // Cider sweet → dry
    const sweetCiderScore = scores.find(s => s.style.id === 'sweet-cider')?.score || 0;
    const dryCiderScore = scores.find(s => s.style.id === 'traditional-dry-cider')?.score || 0;
    if (sweetCiderScore > dryCiderScore) {
      suggestions.push(`<li><span>To shift Sweet → Bone-Dry Cider:</span> Use EC-1118 (Champagne yeast), ferment to completion (FG &lt; 1.003), add pectic enzyme, avoid back-sweetening. Cold crash at -1°C for clarity.</li>`);
    }

    driftRes.innerHTML += `
      <div class="drift-suggestions">
        <h3>🔧 Recipe Adjustment Suggestions → <i>${best.name}</i></h3>
        <ul>${suggestions.join('')}</ul>
      </div>
    `;

    // Chart
    if (driftChart) driftChart.destroy();
    const ctx = document.getElementById('driftChart').getContext('2d');
    driftChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top.map(s => s.style.name),
        datasets: [{
          label: 'Style Match Score',
          data: top.map(s => Math.round((s.score / maxScore) * 100)),
          backgroundColor: top.map((_, i) => i === 0 ? '#f5a623' : '#2e3250'),
          borderColor: top.map((_, i) => i === 0 ? '#f5a623' : '#4a5080'),
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { grid: { color: '#2e3250' }, ticks: { color: '#8890a8' }, max: 100 },
          y: { grid: { display: false }, ticks: { color: '#e8eaf6' } }
        },
        plugins: { legend: { display: false } }
      }
    });
  });

});
