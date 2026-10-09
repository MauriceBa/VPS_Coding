// ============================================================
// BEER STYLE EXPLORER — Main Application (browser entry)
// DOM, Chart.js and XLSX wiring only; all pure logic lives in
// the ES modules under ./js/.
// ============================================================

import { STYLES } from "./js/style-data.js";
import { filterStyles, getStyleById } from "./js/styles.js";
import { RADAR_LABELS, radarValuesForStyle } from "./js/compare.js";
import { RECIPE_DEFAULTS, buildRecipe } from "./js/recipe.js";
import { rankStylesByDrift, buildDriftSuggestions } from "./js/drift.js";
import { srmToHex } from "./js/color.js";

document.addEventListener("DOMContentLoaded", () => {
  // ── TAB NAVIGATION ──────────────────────────────────────
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ── STYLE EXPLORER ──────────────────────────────────────
  const grid = document.getElementById("style-grid");
  const filterCat = document.getElementById("filter-category");
  const filterIbu = document.getElementById("filter-ibu");
  const filterAbv = document.getElementById("filter-abv");
  const ibuVal = document.getElementById("ibu-val");
  const abvVal = document.getElementById("abv-val");

  function renderGrid() {
    const cat = filterCat.value;
    const maxIbu = +filterIbu.value;
    const maxAbv = +filterAbv.value;
    ibuVal.textContent = maxIbu;
    abvVal.textContent = maxAbv;

    const filtered = filterStyles(STYLES, { category: cat, maxIbu, maxAbv });

    grid.innerHTML = "";
    filtered.forEach((s) => {
      const avgSrm = Math.round((s.srm[0] + s.srm[1]) / 2);
      const card = document.createElement("div");
      card.className = "style-card";
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
            <b style="color:var(--text)">Grains:</b> ${s.ingredients.grains.join(", ")}<br/>
            <b style="color:var(--text)">Hops:</b> ${s.ingredients.hops.join(", ")}<br/>
            <b style="color:var(--text)">Yeast:</b> ${s.ingredients.yeast}<br/>
            <b style="color:var(--text)">Water:</b> ${s.ingredients.water}
          </div>
        </details>
      `;
      grid.appendChild(card);
    });
    if (filtered.length === 0) {
      grid.innerHTML =
        '<p style="color:var(--muted);padding:1rem">No styles match the current filters.</p>';
    }
  }

  filterCat.addEventListener("change", renderGrid);
  filterIbu.addEventListener("input", renderGrid);
  filterAbv.addEventListener("input", renderGrid);
  renderGrid();

  // ── COMPARE ─────────────────────────────────────────────
  const compareA = document.getElementById("compare-a");
  const compareB = document.getElementById("compare-b");
  let radarChart = null;

  function populateCompareSelects() {
    [compareA, compareB].forEach((sel) => {
      STYLES.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        sel.appendChild(opt);
      });
    });
    compareB.value = STYLES[1].id;
  }
  populateCompareSelects();

  document.getElementById("btn-compare").addEventListener("click", () => {
    const sA = getStyleById(STYLES, compareA.value);
    const sB = getStyleById(STYLES, compareB.value);
    if (!sA || !sB) return;

    const res = document.getElementById("compare-result");
    const fields = [
      ["Category", (s) => s.category],
      ["ABV", (s) => `${s.abv[0]}–${s.abv[1]}%`],
      ["IBU", (s) => `${s.ibu[0]}–${s.ibu[1]}`],
      ["SRM (Color)", (s) => `${s.srm[0]}–${s.srm[1]}`],
      ["OG", (s) => `${s.og[0]}–${s.og[1]}`],
      ["FG", (s) => `${s.fg[0]}–${s.fg[1]}`],
      ["Fermentation", (s) => s.fermentation],
      ["WBC Category", (s) => s.wbc],
      ["Grains", (s) => s.ingredients.grains.join(", ")],
      ["Hops", (s) => s.ingredients.hops.join(", ")],
      ["Yeast", (s) => s.ingredients.yeast],
      ["Water Profile", (s) => s.ingredients.water],
    ];

    const makeCard = (style) => `
      <div class="compare-card">
        <h3>${style.name} <span class="style-badge badge-${style.category}">${style.category}</span></h3>
        ${fields
          .map(
            ([label, fn]) => `
          <div class="compare-row">
            <span class="label">${label}</span>
            <span class="val">${fn(style)}</span>
          </div>
        `,
          )
          .join("")}
        <div style="margin-top:0.75rem;font-size:0.82rem;color:var(--muted)">${style.desc}</div>
      </div>
    `;
    res.innerHTML = makeCard(sA) + makeCard(sB);

    // Radar chart
    const dataA = radarValuesForStyle(sA);
    const dataB = radarValuesForStyle(sB);

    if (radarChart) radarChart.destroy();
    const ctx = document.getElementById("radarChart").getContext("2d");
    radarChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: RADAR_LABELS,
        datasets: [
          {
            label: sA.name,
            data: dataA,
            backgroundColor: "rgba(245,166,35,0.2)",
            borderColor: "#f5a623",
            pointBackgroundColor: "#f5a623",
          },
          {
            label: sB.name,
            data: dataB,
            backgroundColor: "rgba(232,99,42,0.2)",
            borderColor: "#e8632a",
            pointBackgroundColor: "#e8632a",
          },
        ],
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            grid: { color: "#2e3250" },
            pointLabels: { color: "#e8eaf6" },
            ticks: { display: false },
          },
        },
        plugins: { legend: { labels: { color: "#e8eaf6" } } },
      },
    });
  });

  // ── RECIPE BUILDER ──────────────────────────────────────
  const rStyleSel = document.getElementById("r-style");
  STYLES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    rStyleSel.appendChild(opt);
  });

  let lastRecipe = null;

  document.getElementById("btn-build").addEventListener("click", () => {
    const style = getStyleById(STYLES, rStyleSel.value);
    if (!style) return;
    const name = document.getElementById("r-name").value || RECIPE_DEFAULTS.name;
    const batch = +document.getElementById("r-batch").value || RECIPE_DEFAULTS.batch;
    const og = +document.getElementById("r-og").value || RECIPE_DEFAULTS.og;
    const fg = +document.getElementById("r-fg").value || RECIPE_DEFAULTS.fg;
    const ibu = +document.getElementById("r-ibu").value || RECIPE_DEFAULTS.ibu;
    const srm = +document.getElementById("r-srm").value || RECIPE_DEFAULTS.srm;

    const recipe = buildRecipe(style, { name, batch, og, fg, ibu, srm });
    const { grainBill, hopSchedule, warnings } = recipe;
    const srmColor = srmToHex(srm);

    lastRecipe = recipe;

    const out = document.getElementById("recipe-output");
    out.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <div>
          <h2 style="color:var(--accent)">${name}</h2>
          <div style="color:var(--muted);font-size:0.9rem">${style.name} — ${batch}L batch</div>
        </div>
        <div style="width:40px;height:40px;border-radius:50%;background:${srmColor};border:2px solid var(--border)"></div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.5rem">
        <div class="stat-pill">ABV: <span>~${recipe.abv}%</span></div>
        <div class="stat-pill">OG: <span>${og}</span></div>
        <div class="stat-pill">FG: <span>${fg}</span></div>
        <div class="stat-pill">IBU: <span>${ibu}</span></div>
        <div class="stat-pill">SRM: <span>${srm}</span></div>
        <div class="stat-pill">Grain Total: <span>${recipe.grainKg} kg</span></div>
      </div>

      ${warnings.length ? `<div style="margin-bottom:1rem">${warnings.map((w) => `<div style="color:#ff7043;font-size:0.85rem;margin-bottom:0.3rem">${w}</div>`).join("")}</div>` : '<div style="color:#66bb6a;font-size:0.85rem;margin-bottom:1rem">✅ All parameters within style guidelines!</div>'}

      <div class="recipe-section">
        <h3>🌾 Grain Bill</h3>
        <table class="recipe-table">
          <thead><tr><th>Malt / Grain</th><th>%</th><th>kg (${batch}L)</th></tr></thead>
          <tbody>${grainBill.map((g) => `<tr><td>${g.grain}</td><td>${g.pct}%</td><td>${g.kg} kg</td></tr>`).join("")}</tbody>
        </table>
      </div>

      <div class="recipe-section">
        <h3>🌿 Hop Schedule</h3>
        <table class="recipe-table">
          <thead><tr><th>Hop Variety</th><th>Amount</th><th>Addition Time</th><th>Purpose</th></tr></thead>
          <tbody>${hopSchedule.map((h) => `<tr><td>${h.hop}</td><td>${h.amount}</td><td>${h.time}</td><td>${h.purpose}</td></tr>`).join("")}</tbody>
        </table>
      </div>

      <div class="recipe-section">
        <h3>🧫 Yeast & Fermentation</h3>
        <div style="font-size:0.88rem;line-height:1.8;color:var(--muted)">
          <b style="color:var(--text)">Yeast:</b> ${recipe.yeast}<br/>
          <b style="color:var(--text)">Water Profile:</b> ${recipe.water}<br/>
          <b style="color:var(--text)">Fermentation Type:</b> ${style.fermentation}
        </div>
      </div>

      <div class="tip-box">
        💡 <b>Competition Tip:</b> Enter this beer in the <i>${style.wbc}</i> category at World Beer Cup. Ensure your final beer falls within style parameters for best results.
      </div>
    `;
  });

  document.getElementById("btn-export").addEventListener("click", () => {
    if (!lastRecipe) {
      alert("Generate a recipe first!");
      return;
    }
    const r = lastRecipe;
    const wb = XLSX.utils.book_new();

    const overviewData = [
      ["Beer Name", r.name],
      ["Style", r.style],
      ["Batch Size (L)", r.batch],
      ["Target OG", r.og],
      ["Target FG", r.fg],
      ["Estimated ABV (%)", r.abv],
      ["Target IBU", r.ibu],
      ["Target SRM", r.srm],
      ["Total Grain (kg)", r.grainKg],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), "Overview");

    const grainData = [
      ["Malt / Grain", "Percentage (%)", "Amount (kg)"],
      ...r.grainBill.map((g) => [g.grain, g.pct, g.kg]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grainData), "Grain Bill");

    const hopData = [
      ["Hop Variety", "Amount", "Addition Time", "Purpose"],
      ...r.hopSchedule.map((h) => [h.hop, h.amount, h.time, h.purpose]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hopData), "Hop Schedule");

    const yeastData = [
      ["Yeast", r.yeast],
      ["Water Profile", r.water],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(yeastData), "Yeast & Water");

    const allStylesData = [
      [
        "Style",
        "Category",
        "ABV Min",
        "ABV Max",
        "IBU Min",
        "IBU Max",
        "SRM Min",
        "SRM Max",
        "OG Min",
        "OG Max",
        "FG Min",
        "FG Max",
        "WBC Category",
      ],
    ];
    STYLES.forEach((s) =>
      allStylesData.push([
        s.name,
        s.category,
        s.abv[0],
        s.abv[1],
        s.ibu[0],
        s.ibu[1],
        s.srm[0],
        s.srm[1],
        s.og[0],
        s.og[1],
        s.fg[0],
        s.fg[1],
        s.wbc,
      ]),
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(allStylesData),
      "All Styles Reference",
    );

    XLSX.writeFile(wb, `${r.name.replace(/\s+/g, "_")}_recipe.xlsx`);
  });

  // ── STYLE DRIFT ANALYZER ────────────────────────────────
  let driftChart = null;

  document.getElementById("btn-drift").addEventListener("click", () => {
    const abv = +document.getElementById("d-abv").value;
    const ibu = +document.getElementById("d-ibu").value;
    const srm = +document.getElementById("d-srm").value;
    const og = +document.getElementById("d-og").value;
    const fg = +document.getElementById("d-fg").value;
    const ferm = document.getElementById("d-ferm").value;

    const scores = rankStylesByDrift(STYLES, abv, ibu, srm, og, fg, ferm);

    const maxScore = scores[0].score || 1;
    const top = scores.slice(0, 8);
    const best = scores[0].style;

    const driftRes = document.getElementById("drift-result");
    driftRes.innerHTML = `
      <h3 style="margin-bottom:1rem;color:var(--accent)">🎯 Style Match Results</h3>
      ${top
        .map(({ style, score }) => {
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
        })
        .join("")}
    `;

    // Suggestions
    const suggestions = buildDriftSuggestions(best, scores, abv, ibu, srm, ferm);

    driftRes.innerHTML += `
      <div class="drift-suggestions">
        <h3>🔧 Recipe Adjustment Suggestions → <i>${best.name}</i></h3>
        <ul>${suggestions.join("")}</ul>
      </div>
    `;

    // Chart
    if (driftChart) driftChart.destroy();
    const ctx = document.getElementById("driftChart").getContext("2d");
    driftChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: top.map((s) => s.style.name),
        datasets: [
          {
            label: "Style Match Score",
            data: top.map((s) => Math.round((s.score / maxScore) * 100)),
            backgroundColor: top.map((_, i) => (i === 0 ? "#f5a623" : "#2e3250")),
            borderColor: top.map((_, i) => (i === 0 ? "#f5a623" : "#4a5080")),
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: {
          x: { grid: { color: "#2e3250" }, ticks: { color: "#8890a8" }, max: 100 },
          y: { grid: { display: false }, ticks: { color: "#e8eaf6" } },
        },
        plugins: { legend: { display: false } },
      },
    });
  });
});
