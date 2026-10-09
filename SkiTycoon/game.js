import {
  BLD_DATA,
  RES_DATA,
  UNIT_DATA,
  getCost,
  getBuildTime,
  getUnitCost,
  calcProduction,
  getPoints,
  getBuiltFields,
  MAX_BUILDABLE_FIELDS,
  AI_SCORE_DAMAGE,
  AI_MIN_SCORE,
} from "./js/economy.js";
import { checkReqs, canBuild, canResearch, canTrain } from "./js/research.js";
import {
  createUniverse,
  calcDistance,
  calcAttackPower,
  calcCargoCapacity,
  calcAiDefPower,
  calcAiLoot,
  calcCombatOutcome,
  calcLoot,
  calcFlightTime,
  calcFuelCost,
} from "./js/guests.js";
import { STORAGE_KEY, createInitialState, serializeState, deserializeState } from "./js/save.js";

const TICK_MS = 1000; // 1 second real-time tick

// --- STATE MANAGEMENT ---

let state = null;
let loopHandle = null;

function initUniverse() {
  state.universe = createUniverse(Math.random);
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const loaded = raw ? deserializeState(raw) : null;
  if (loaded) {
    state = loaded;
    return;
  }
  state = createInitialState();
  initUniverse();
  saveGame();
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, serializeState(state));
}

// --- ENGINE TICK ---

function doTick() {
  const now = Date.now();
  const deltaSec = (now - state.lastTick) / 1000;
  if (deltaSec <= 0) return;

  state.lastTick = now;

  // 1. Resources
  const prod = calcProduction(state);
  state.res.k = Math.min(state.res.maxK, state.res.k + prod.k * deltaSec);
  state.res.m = Math.min(state.res.maxM, state.res.m + prod.m * deltaSec);
  state.res.s = Math.min(state.res.maxS, state.res.s + prod.s * deltaSec);

  // 2. Build Queue
  if (state.buildQueue) {
    if (now >= state.buildQueue.end) {
      if (BLD_DATA[state.buildQueue.id]) state.bld[state.buildQueue.id]++;
      if (RES_DATA[state.buildQueue.id]) state.tech[state.buildQueue.id]++;
      addReport(
        "Ausbau abgeschlossen",
        `${state.buildQueue.name} wurde erfolgreich entwickelt.`,
        "success",
      );
      state.buildQueue = null;
      renderView(); // force update layout
    }
  }

  // 3. Unit Queue
  if (state.unitQueue.length > 0) {
    const q = state.unitQueue[0];
    if (now >= q.next) {
      state.units[q.id]++;
      q.count--;
      if (q.count <= 0) {
        state.unitQueue.shift();
      } else {
        q.next = now + q.unitTime * 1000;
      }
      if (state.ui.tab === "units" || state.ui.tab === "defense") renderView();
    }
  }

  // 4. Missions
  let missionUpdate = false;
  state.missions.forEach((m) => {
    if (m.phase === "out" && now >= m.arrive) {
      resolveCombat(m);
      m.phase = "return";
      missionUpdate = true;
    } else if (m.phase === "return" && now >= m.return) {
      resolveReturn(m);
      m.phase = "done";
      missionUpdate = true;
    }
  });
  if (missionUpdate) {
    state.missions = state.missions.filter((m) => m.phase !== "done");
    renderView();
  }

  // Dynamic DOM Updates (to not break inputs)
  document.getElementById("res-kapital").textContent = formatInt(state.res.k);
  document.getElementById("prod-kapital").textContent = `+${formatInt(prod.k * 3600)}/h`; // Show per hour for readability
  document.getElementById("res-material").textContent = formatInt(state.res.m);
  document.getElementById("prod-material").textContent = `+${formatInt(prod.m * 3600)}/h`;
  document.getElementById("res-schnee").textContent = formatInt(state.res.s);
  document.getElementById("prod-schnee").textContent = `+${formatInt(prod.s * 3600)}/h`;

  const elE = document.getElementById("res-energie");
  elE.textContent = formatInt(state.res.e);
  elE.className = "res-val " + (state.res.e < 0 ? "negative" : "");

  const gq = document.getElementById("global-queue");
  if (state.buildQueue) {
    gq.classList.remove("hidden");
    const left = Math.max(0, Math.floor((state.buildQueue.end - now) / 1000));
    gq.innerHTML = `<span>Baue: <strong>${state.buildQueue.name}</strong></span><span class="queue-timer">${formatTime(left)}</span>`;
  } else {
    gq.classList.add("hidden");
  }
}

// --- COMBAT ENGINE ---

function resolveCombat(m) {
  const target = state.universe[m.to.sys][m.to.pos];
  if (!target || !target.isAI) {
    // Farm empty slot? No loot.
    addReport(`Kampagne nach ${m.to.sys}:${m.to.pos}`, "Die Kampagne lief ins Leere.", "warn");
    return;
  }

  // AI Power depends on their score
  const aiDefPower = calcAiDefPower(target.score);
  const aiLoot = calcAiLoot(target.score);

  // Player Power
  const atkPower = calcAttackPower(m.units, state.tech.pr_tech);
  const cargoCap = calcCargoCapacity(m.units);

  let reportHTML = `Dein Team traf in Resort ${target.name} ein.<br><br>`;

  if (calcCombatOutcome(atkPower, aiDefPower) === "win") {
    // Win
    m.loot = calcLoot(aiLoot, cargoCap);
    target.score = Math.max(AI_MIN_SCORE, target.score - AI_SCORE_DAMAGE); // Damage AI
    reportHTML += `<strong>Erfolg!</strong> Deine Kampagne war überlegen.<br>Beute gesichert: ${formatInt(m.loot.k)} Kapital, ${formatInt(m.loot.m)} Material.`;
    addReport(`Kampagne erfolgreich (${target.name})`, reportHTML, "attack_win");
  } else {
    // Loss
    m.units = {}; // Lost all
    m.loot = { k: 0, m: 0 };
    reportHTML += `<strong>Niederlage!</strong> Die gegnerischen PR-Anwälte haben deine Kampagne vernichtet. Totalverlust.`;
    addReport(`Kampagne gescheitert (${target.name})`, reportHTML, "attack_loss");
  }
}

function resolveReturn(m) {
  if (m.loot) {
    state.res.k += m.loot.k;
    state.res.m += m.loot.m;
  }
  Object.entries(m.units).forEach(([id, count]) => {
    state.units[id] += count;
  });
}

// --- ACTIONS ---

function startBuild(type, category) {
  if (state.buildQueue) return alert("Es läuft bereits ein Ausbau!");
  const cost = getCost(type, category, state);
  if (state.res.k < cost.k || state.res.m < cost.m || state.res.s < cost.s)
    return alert("Zu wenig Ressourcen!");

  // Check reqs
  const reqs = category === "bld" ? BLD_DATA[type].req : RES_DATA[type].req;
  if (reqs && !checkReqs(reqs, state)) return alert("Voraussetzungen nicht erfüllt!");

  state.res.k -= cost.k;
  state.res.m -= cost.m;
  state.res.s -= cost.s;

  const time = getBuildTime(cost.k, cost.m, category, state);
  state.buildQueue = {
    type: category,
    id: type,
    name: category === "bld" ? BLD_DATA[type].name : RES_DATA[type].name,
    end: Date.now() + time * 1000,
  };
  renderView();
}

function trainUnits(type, inputVal) {
  const count = parseInt(inputVal);
  if (isNaN(count) || count <= 0) return;
  const unit = UNIT_DATA[type];

  if (unit.req && !checkReqs(unit.req, state)) return alert("Voraussetzungen fehlen!");

  const cost = getUnitCost(type, count);
  if (state.res.k < cost.k || state.res.m < cost.m || state.res.s < cost.s)
    return alert("Zu wenig Ressourcen!");

  state.res.k -= cost.k;
  state.res.m -= cost.m;
  state.res.s -= cost.s;

  const timePerUnit = getBuildTime(unit.costK, unit.costM, "unit", state);
  state.unitQueue.push({
    id: type,
    name: unit.name,
    count: count,
    unitTime: timePerUnit,
    next: Date.now() + timePerUnit * 1000,
  });
  renderView();
}

function sendFleet(targetSys, targetPos, units) {
  let totalUnits = 0;
  let speed = 99999;

  const payload = {};
  Object.entries(units).forEach(([id, qty]) => {
    if (qty > 0 && state.units[id] >= qty) {
      payload[id] = qty;
      totalUnits += qty;
      if (UNIT_DATA[id].speed < speed) speed = UNIT_DATA[id].speed; // fleet travels at slowest ship speed
    }
  });

  if (totalUnits === 0) return alert("Keine Flotte ausgewählt.");

  // Calculate distance
  const dist = calcDistance(state.coords.sys, state.coords.pos, targetSys, targetPos);
  const flightTime = calcFlightTime(dist, speed, state.tech.drive_tech);
  const fuelCost = calcFuelCost(totalUnits, dist);

  if (state.res.s < fuelCost) return alert(`Zu wenig Kunstschnee! Benötigt: ${fuelCost}`);

  state.res.s -= fuelCost;
  Object.entries(payload).forEach(([id, qty]) => {
    state.units[id] -= qty;
  });

  const now = Date.now();
  state.missions.push({
    id: `m_${now}`,
    type: "attack",
    from: { ...state.coords },
    to: { sys: targetSys, pos: targetPos },
    units: payload,
    start: now,
    arrive: now + flightTime * 1000,
    return: now + flightTime * 2000,
    phase: "out",
  });

  alert(`Kampagne gestartet! Ankunft in ${formatTime(flightTime)}.`);
  state.ui.tab = "fleet";
  renderView();
}

function addReport(title, html, type) {
  state.reports.unshift({ time: Date.now(), title, html, type });
  if (state.reports.length > 50) state.reports.pop();
  if (state.ui.tab !== "reports") {
    const b = document.getElementById("report-badge");
    b.textContent = parseInt(b.textContent) + 1;
    b.classList.remove("hidden");
  }
}

// --- RENDERERS ---

function checkReqHTML(reqs) {
  if (!reqs) return "";
  const lines = Object.entries(reqs).map(([r, lvl]) => {
    const has = (state.bld[r] || 0) >= lvl || (state.tech[r] || 0) >= lvl;
    const name = BLD_DATA[r]?.name || RES_DATA[r]?.name || r;
    return `<span class="${has ? "cost-green" : "cost-red"}">${name} Lvl ${lvl}</span>`;
  });
  return `<div class="cost-req">Benötigt: ${lines.join(", ")}</div>`;
}

function renderTable(dataObj, category) {
  let html = `<table class="ogame-table">
    <tr><th>Anlage</th><th>Beschreibung</th><th>Kosten</th><th>Aktion</th></tr>`;

  Object.values(dataObj).forEach((item) => {
    const lvl = category === "bld" ? state.bld[item.id] : state.tech[item.id];
    const cost = getCost(item.id, category, state);
    const time = getBuildTime(cost.k, cost.m, category, state);
    const reqText = checkReqHTML(item.req);

    const reqsMet = category === "bld" ? canBuild(item.id, state) : canResearch(item.id, state);
    const affordable = state.res.k >= cost.k && state.res.m >= cost.m && state.res.s >= cost.s;
    const busy = state.buildQueue !== null;

    html += `<tr>
      <td>
        <span class="item-icon">${item.icon}</span>
        <div>
          <div class="item-title">${item.name}</div>
          <div class="item-level">Stufe ${lvl}</div>
        </div>
      </td>
      <td>
        <div class="item-desc">${item.desc}</div>
        ${reqText}
      </td>
      <td>
        <div class="cost-req">
          <span class="${state.res.k >= cost.k ? "" : "cost-red"}">K: ${formatInt(cost.k)}</span>
          <span class="${state.res.m >= cost.m ? "" : "cost-red"}">M: ${formatInt(cost.m)}</span>
          ${cost.s > 0 ? `<span class="${state.res.s >= cost.s ? "" : "cost-red"}">S: ${formatInt(cost.s)}</span>` : ""}
        </div>
        <div class="muted" style="font-size:0.8rem; margin-top:4px;">Dauer: ${formatTime(time)}</div>
      </td>
      <td>
        <button class="primary-btn" data-action="build" data-id="${item.id}" data-cat="${category}" ${!reqsMet || !affordable || busy ? "disabled" : ""}>Ausbauen</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  return html;
}

function renderUnits(catFilter) {
  let html = `<table class="ogame-table">
    <tr><th>Einheit</th><th>Stats</th><th>Kosten</th><th>Rekrutieren</th></tr>`;

  Object.values(UNIT_DATA)
    .filter((u) => u.cat === catFilter)
    .forEach((item) => {
      const count = state.units[item.id];
      const reqText = checkReqHTML(item.req);

      const reqsMet = canTrain(item.id, state);
      const time = getBuildTime(item.costK, item.costM, "unit", state);

      html += `<tr>
      <td>
        <span class="item-icon">${item.icon}</span>
        <div>
          <div class="item-title">${item.name}</div>
          <div class="item-level">Verfügbar: ${count}</div>
        </div>
      </td>
      <td>
        <div class="item-desc">${item.desc}</div>
        <div class="muted" style="font-size:0.8rem;">Atk: ${item.atk} | HP: ${item.hp} | Fracht: ${item.cargo}</div>
        ${reqText}
      </td>
      <td>
        <div class="cost-req">
          <span class="${state.res.k >= item.costK ? "" : "cost-red"}">K: ${formatInt(item.costK)}</span>
          <span class="${state.res.m >= item.costM ? "" : "cost-red"}">M: ${formatInt(item.costM)}</span>
          ${item.costS > 0 ? `<span class="${state.res.s >= item.costS ? "" : "cost-red"}">S: ${formatInt(item.costS)}</span>` : ""}
        </div>
        <div class="muted" style="font-size:0.8rem; margin-top:4px;">Dauer: ${formatTime(time)} pro Stück</div>
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <input type="number" id="inp_${item.id}" min="1" value="1" style="width:70px;" ${!reqsMet ? "disabled" : ""}>
          <button class="primary-btn" data-action="train" data-id="${item.id}" ${!reqsMet ? "disabled" : ""}>Bauen</button>
        </div>
      </td>
    </tr>`;
    });
  html += `</table>`;

  if (state.unitQueue.length > 0) {
    html += `<div class="card" style="margin-top:16px;"><h3>Warteschlange</h3>`;
    state.unitQueue.forEach((q) => {
      html += `<div>${q.count}x ${q.name}</div>`;
    });
    html += `</div>`;
  }

  return html;
}

function renderMap() {
  let html = `
    <div class="map-toolbar">
      <span>Betrachte Tal:</span>
      <button class="ghost-btn" data-action="map-sys" data-sys="${Math.max(1, state.ui.mapSys - 1)}">&lt;</button>
      <strong>System ${state.ui.mapSys}</strong>
      <button class="ghost-btn" data-action="map-sys" data-sys="${Math.min(5, state.ui.mapSys + 1)}">&gt;</button>
    </div>
    <div class="map-grid">
      <div class="map-row header">
        <div>Pos</div><div>Name</div><div>Status</div><div>Aktion</div>
      </div>
  `;

  for (let p = 1; p <= 15; p++) {
    const slot = state.universe[state.ui.mapSys][p];
    if (slot) {
      if (slot.player) {
        html += `<div class="map-row">
          <div class="slot-num">${p}</div>
          <div class="slot-player">${slot.name} (Du)</div>
          <div>Hauptquartier</div>
          <div></div>
        </div>`;
      } else {
        html += `<div class="map-row">
          <div class="slot-num">${p}</div>
          <div class="slot-ai">${slot.name}</div>
          <div>Punkte: ${slot.score}</div>
          <div><button class="secondary-btn" data-action="prep-attack" data-sys="${state.ui.mapSys}" data-pos="${p}">Angreifen</button></div>
        </div>`;
      }
    } else {
      html += `<div class="map-row">
        <div class="slot-num">${p}</div>
        <div class="slot-empty">Unbesiedeltes Gebiet</div>
        <div></div><div></div>
      </div>`;
    }
  }
  html += `</div>`;
  return html;
}

function renderFleet() {
  const ts = state.ui.fleetTarget;
  let html = `<div class="grid-2">
    <div class="card">
      <div class="card-title"><h3>Flotte entsenden</h3></div>
      <div class="fleet-controls">
        <div style="display:flex; gap:12px; align-items:center;">
          <span>Zielkoordinaten:</span>
          <input type="number" id="fl_sys" value="${ts.sys}" style="width:60px;"> :
          <input type="number" id="fl_pos" value="${ts.pos}" style="width:60px;">
        </div>
        <hr style="border-color:rgba(255,255,255,0.05);">
        <h4>Einheiten:</h4>`;

  Object.values(UNIT_DATA)
    .filter((u) => u.cat === "fleet")
    .forEach((u) => {
      html += `<div class="fleet-row">
      <span>${u.icon} ${u.name} (Verfügbar: ${state.units[u.id]})</span>
      <input type="number" id="fl_amt_${u.id}" class="fleet-input" value="0" min="0" max="${state.units[u.id]}">
    </div>`;
    });

  html += `
        <button class="primary-btn" data-action="send-fleet" style="margin-top:16px;">Kampagne starten</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><h3>Aktive Missionen</h3><span class="tag">${state.missions.length}</span></div>
      <div class="banner-list">`;

  if (state.missions.length === 0)
    html += `<div class="muted">Keine aktiven Flottenbewegungen.</div>`;

  state.missions.forEach((m) => {
    const isReturn = m.phase === "return";
    const targetTime = isReturn ? m.return : m.arrive;
    const left = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
    const title = isReturn
      ? `Rückkehr von ${m.to.sys}:${m.to.pos}`
      : `Angriff auf ${m.to.sys}:${m.to.pos}`;
    html += `<div class="event-banner">
      <div class="event-meta"><strong>${title}</strong><span class="tag ${isReturn ? "good" : "warn"}">${formatTime(left)}</span></div>
      <p class="muted">Phase: ${isReturn ? "Rückflug" : "Hinflug"}</p>
    </div>`;
  });

  html += `</div></div></div>`;
  return html;
}

function renderReports() {
  document.getElementById("report-badge").classList.add("hidden");
  document.getElementById("report-badge").textContent = "0";

  if (state.reports.length === 0)
    return `<div class="card"><p class="muted">Keine Berichte vorhanden.</p></div>`;

  let html = ``;
  state.reports.forEach((r) => {
    const date = new Date(r.time).toLocaleString("de-DE");
    html += `<div class="report-card ${r.type}">
      <div class="report-meta"><span>${date}</span></div>
      <div class="report-title">${r.title}</div>
      <div>${r.html}</div>
    </div>`;
  });
  return html;
}

function renderOverview() {
  const points = getPoints(state);
  return `
    <section class="card">
      <h2>Willkommen bei SkiWars</h2>
      <p class="muted" style="margin-top:8px;">Das ultimative Ski-Resort-Echtzeit-Strategiespiel. Baue deine Anlagen aus, erforsche neue Technologien und entsende Marketing-Kampagnen (Flotten), um der Konkurrenz die Gäste und Ressourcen zu klauen.</p>
    </section>
    <div class="grid-2" style="margin-top:16px;">
      <div class="card">
        <h3>Dein Imperium</h3>
        <div class="detail-list" style="margin-top:16px;">
          <div class="detail-item"><span>Punkte</span><strong>${formatInt(points)}</strong></div>
          <div class="detail-item"><span>Planet (Resort)</span><strong>Tal ${state.coords.sys} : Hang ${state.coords.pos}</strong></div>
          <div class="detail-item"><span>Bebaute Felder</span><strong>${getBuiltFields(state)} / ${MAX_BUILDABLE_FIELDS}</strong></div>
        </div>
      </div>
    </div>
  `;
}

function renderView() {
  const view = document.getElementById("view");
  const tab = state.ui.tab;

  if (tab === "buildings") view.innerHTML = renderTable(BLD_DATA, "bld");
  else if (tab === "research") view.innerHTML = renderTable(RES_DATA, "tech");
  else if (tab === "units") view.innerHTML = renderUnits("fleet");
  else if (tab === "defense") view.innerHTML = renderUnits("def");
  else if (tab === "map") view.innerHTML = renderMap();
  else if (tab === "fleet") view.innerHTML = renderFleet();
  else if (tab === "reports") view.innerHTML = renderReports();
  else if (tab === "settings")
    view.innerHTML = `<div class="card"><button class="ghost-btn" data-action="reset">Account löschen & Neustart</button></div>`;
  else view.innerHTML = renderOverview();

  // Update Tab UI
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
}

// --- UTILS ---

function formatInt(v) {
  return new Intl.NumberFormat("de-DE").format(Math.floor(v));
}
function formatTime(sec) {
  if (sec < 0) return "0s";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// --- EVENTS ---

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const a = btn.dataset.action;

  if (a === "tab") {
    state.ui.tab = btn.dataset.tab;
    renderView();
  } else if (a === "build") {
    startBuild(btn.dataset.id, btn.dataset.cat);
  } else if (a === "train") {
    const id = btn.dataset.id;
    const inp = document.getElementById(`inp_${id}`);
    trainUnits(id, inp ? inp.value : 1);
  } else if (a === "map-sys") {
    state.ui.mapSys = parseInt(btn.dataset.sys);
    renderView();
  } else if (a === "prep-attack") {
    state.ui.fleetTarget.sys = parseInt(btn.dataset.sys);
    state.ui.fleetTarget.pos = parseInt(btn.dataset.pos);
    state.ui.tab = "fleet";
    renderView();
  } else if (a === "send-fleet") {
    const sys = parseInt(document.getElementById("fl_sys").value);
    const pos = parseInt(document.getElementById("fl_pos").value);
    const payload = {};
    Object.keys(UNIT_DATA)
      .filter((k) => UNIT_DATA[k].cat === "fleet")
      .forEach((k) => {
        const v = parseInt(document.getElementById(`fl_amt_${k}`).value) || 0;
        if (v > 0) payload[k] = v;
      });
    sendFleet(sys, pos, payload);
  } else if (a === "reset") {
    if (confirm("Willst du deinen kompletten Account resetten?")) {
      state = createInitialState();
      initUniverse();
      saveGame();
      renderView();
    }
  }
});

// --- INIT ---

loadGame();
renderView();

if (loopHandle) clearInterval(loopHandle);
loopHandle = setInterval(() => {
  doTick();
}, TICK_MS);

// Save every 10 seconds
setInterval(saveGame, 10000);
