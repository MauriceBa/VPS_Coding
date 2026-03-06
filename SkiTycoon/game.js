const STORAGE_KEY = 'skitycoon_v4_wars';
const SAVE_VERSION = 4;
const TICK_MS = 1000; // 1 second real-time tick

// --- GAME CONFIGURATION ---

const BLD_DATA = {
  hq: { id: 'hq', name: 'Zentrale Verwaltung', icon: '🏢', desc: 'Verkürzt die Bauzeiten aller Anlagen erheblich.', baseK: 500, baseM: 200, fK: 1.5, fM: 1.5 },
  kapital: { id: 'kapital', name: 'Ticketzentrum', icon: '🎫', desc: 'Produziert Kapital (€).', baseK: 60, baseM: 15, fK: 1.5, fM: 1.5, baseProd: 30, prodF: 1.1, baseE: 10 },
  material: { id: 'material', name: 'Logistikzentrum', icon: '📦', desc: 'Produziert Baumaterial.', baseK: 48, baseM: 24, fK: 1.5, fM: 1.5, baseProd: 20, prodF: 1.1, baseE: 10 },
  schnee: { id: 'schnee', name: 'Schneekanonen-Netz', icon: '❄️', desc: 'Produziert Kunstschnee (Treibstoff für Flotten).', baseK: 200, baseM: 100, fK: 1.5, fM: 1.5, baseProd: 10, prodF: 1.1, baseE: 20 },
  solar: { id: 'solar', name: 'Solarkraftwerk', icon: '⚡', desc: 'Stellt Energie bereit. Anlagen ohne Energie produzieren langsamer.', baseK: 80, baseM: 30, fK: 1.5, fM: 1.5, baseProd: 20, prodF: 1.2 },
  labor: { id: 'labor', name: 'Forschungslabor', icon: '🔬', desc: 'Schaltet Forschungen frei und beschleunigt sie.', baseK: 200, baseM: 400, fK: 1.5, fM: 1.5 },
  agentur: { id: 'agentur', name: 'Marketing-Agentur', icon: '📢', desc: 'Rekrutiert Personal für Kampagnen (Einheiten).', baseK: 400, baseM: 200, fK: 1.5, fM: 1.5 },
  speicherK: { id: 'speicherK', name: 'Tresorraum', icon: '🏦', desc: 'Erhöht die maximale Kapazität für Kapital.', baseK: 1000, baseM: 0, fK: 2, fM: 1 },
  speicherM: { id: 'speicherM', name: 'Materiallager', icon: '🏗️', desc: 'Erhöht die maximale Kapazität für Baumaterial.', baseK: 0, baseM: 1000, fK: 1, fM: 2 },
  speicherS: { id: 'speicherS', name: 'Kühlbecken', icon: '🧊', desc: 'Erhöht die maximale Kapazität für Schnee.', baseK: 1000, baseM: 1000, fK: 2, fM: 2 }
};

const RES_DATA = {
  energy_tech: { id: 'energy_tech', name: 'Energietechnik', icon: '🔋', desc: 'Verbessert den Output des Solarkraftwerks.', req: { labor: 1 }, baseK: 800, baseM: 400, baseS: 0, f: 1.8 },
  drive_tech: { id: 'drive_tech', name: 'Logistikmotoren', icon: '🚌', desc: 'Macht Reisebusse und Kampagnen schneller.', req: { labor: 2 }, baseK: 400, baseM: 1000, baseS: 200, f: 2.0 },
  pr_tech: { id: 'pr_tech', name: 'PR-Psychologie', icon: '🧠', desc: 'Erhöht die Angriffsstärke (Gästeklau) deiner Kampagnen.', req: { labor: 4 }, baseK: 2000, baseM: 500, baseS: 500, f: 2.0 },
  def_tech: { id: 'def_tech', name: 'Krisenmanagement', icon: '🛡️', desc: 'Erhöht die Abwehrkraft deiner Sicherheitskräfte.', req: { labor: 4 }, baseK: 1000, baseM: 1500, baseS: 200, f: 2.0 }
};

const UNIT_DATA = {
  // Attackers (Marketing Fleet)
  promoter: { id: 'promoter', cat: 'fleet', name: 'Promoter', icon: '🚶', desc: 'Leichte Einheit zum Gästeklau.', req: { agentur: 1 }, costK: 300, costM: 100, costS: 10, atk: 10, hp: 10, cargo: 50, speed: 2000 },
  bus: { id: 'bus', cat: 'fleet', name: 'Reisebus', icon: '🚌', desc: 'Viel Frachtraum, sehr langsam.', req: { agentur: 2, drive_tech: 2 }, costK: 2000, costM: 2000, costS: 50, atk: 2, hp: 50, cargo: 1500, speed: 800 },
  influencer: { id: 'influencer', cat: 'fleet', name: 'Influencer', icon: '🤳', desc: 'Starke PR-Angriffskraft, teuer im Unterhalt (Schnee).', req: { agentur: 4, pr_tech: 3 }, costK: 4000, costM: 1000, costS: 200, atk: 120, hp: 150, cargo: 200, speed: 3000 },
  // Defenders
  security: { id: 'security', cat: 'def', name: 'Security', icon: '👮', desc: 'Basis-Abwehr gegen fremde Promoter.', req: { agentur: 1 }, costK: 200, costM: 100, costS: 0, atk: 15, hp: 20, cargo: 0, speed: 0 },
  anwalt: { id: 'anwalt', cat: 'def', name: 'PR-Anwalt', icon: '⚖️', desc: 'Schwere Abwehr gegen feindliche Influencer.', req: { agentur: 3, def_tech: 2 }, costK: 1500, costM: 1000, costS: 0, atk: 80, hp: 200, cargo: 0, speed: 0 }
};

// --- STATE MANAGEMENT ---

let state = null;
let loopHandle = null;

function createInitialState() {
  return {
    version: SAVE_VERSION,
    lastTick: Date.now(),
    coords: { sys: 1, pos: 1 },
    res: { k: 1500, m: 1000, s: 0, e: 0, maxK: 10000, maxM: 10000, maxS: 10000 },
    bld: Object.keys(BLD_DATA).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    tech: Object.keys(RES_DATA).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    units: Object.keys(UNIT_DATA).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
    buildQueue: null, // { type, id, end, costK, costM }
    unitQueue: [], // [{ id, count, end }]
    missions: [], // { id, type, from, to, units, start, arrive, return, cargo, phase }
    reports: [],
    universe: {}, // sys -> { pos: { name, isAI, score } }
    ui: { tab: 'overview', mapSys: 1, fleetTarget: { sys: 1, pos: 2 } }
  };
}

function initUniverse() {
  state.universe = {};
  for (let s = 1; s <= 5; s++) {
    state.universe[s] = {};
    for (let p = 1; p <= 15; p++) {
      if (s === 1 && p === 1) {
        state.universe[s][p] = { name: 'Mein Resort', isAI: false, player: true };
      } else if (Math.random() < 0.3) {
        state.universe[s][p] = { 
          name: `AI Resort ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${p}`, 
          isAI: true, 
          score: Math.floor(Math.random() * 500) + s * 200 
        };
      }
    }
  }
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === SAVE_VERSION) {
        state = parsed;
        return;
      }
    } catch (e) { console.error('Save parse error', e); }
  }
  state = createInitialState();
  initUniverse();
  saveGame();
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- MATH & FORMULAS ---

function getCost(type, category = 'bld') {
  if (category === 'bld') {
    const d = BLD_DATA[type];
    const lvl = state.bld[type];
    return { k: Math.floor(d.baseK * Math.pow(d.fK, lvl)), m: Math.floor(d.baseM * Math.pow(d.fM, lvl)), s: 0 };
  } else if (category === 'tech') {
    const d = RES_DATA[type];
    const lvl = state.tech[type];
    return { k: Math.floor(d.baseK * Math.pow(d.f, lvl)), m: Math.floor(d.baseM * Math.pow(d.f, lvl)), s: Math.floor(d.baseS * Math.pow(d.f, lvl)) };
  } else if (category === 'unit') {
    const d = UNIT_DATA[type];
    return { k: d.costK, m: d.costM, s: d.costS };
  }
}

function getBuildTime(costK, costM, type = 'bld') {
  // Speed factor: 1 hour in real game = 1 minute here (highly accelerated)
  const totalCost = costK + costM;
  let baseSeconds = totalCost / 100;
  if (type === 'bld') {
    baseSeconds /= (1 + state.bld.hq);
  } else if (type === 'tech') {
    baseSeconds /= (1 + state.bld.labor * 1.5);
  } else if (type === 'unit') {
    baseSeconds = totalCost / 500;
    baseSeconds /= (1 + state.bld.agentur);
  }
  return Math.max(2, Math.floor(baseSeconds));
}

function calcProduction() {
  const b = state.bld;
  const e_tech = state.tech.energy_tech;
  
  const solarBase = BLD_DATA.solar.baseProd * b.solar * Math.pow(BLD_DATA.solar.prodF, b.solar);
  const energyProd = Math.floor(solarBase * (1 + e_tech * 0.1));
  
  const e_req = (BLD_DATA.kapital.baseE * b.kapital * Math.pow(1.1, b.kapital)) +
                (BLD_DATA.material.baseE * b.material * Math.pow(1.1, b.material)) +
                (BLD_DATA.schnee.baseE * b.schnee * Math.pow(1.1, b.schnee));
  
  const energyFactor = e_req > 0 ? Math.min(1, energyProd / e_req) : 1;
  state.res.e = energyProd - e_req;
  
  const prodK = Math.floor(BLD_DATA.kapital.baseProd * b.kapital * Math.pow(BLD_DATA.kapital.prodF, b.kapital) * energyFactor);
  const prodM = Math.floor(BLD_DATA.material.baseProd * b.material * Math.pow(BLD_DATA.material.prodF, b.material) * energyFactor);
  const prodS = Math.floor(BLD_DATA.schnee.baseProd * b.schnee * Math.pow(BLD_DATA.schnee.prodF, b.schnee) * energyFactor);
  
  // Update capacities
  state.res.maxK = 10000 + (b.speicherK ? 10000 * b.speicherK * Math.pow(1.5, b.speicherK) : 0);
  state.res.maxM = 10000 + (b.speicherM ? 10000 * b.speicherM * Math.pow(1.5, b.speicherM) : 0);
  state.res.maxS = 10000 + (b.speicherS ? 10000 * b.speicherS * Math.pow(1.5, b.speicherS) : 0);
  
  return { 
    k: prodK / 3600, // per second instead of per hour
    m: prodM / 3600, 
    s: prodS / 3600 
  };
}

// --- ENGINE TICK ---

function doTick() {
  const now = Date.now();
  const deltaSec = (now - state.lastTick) / 1000;
  if (deltaSec <= 0) return;
  
  state.lastTick = now;
  
  // 1. Resources
  const prod = calcProduction();
  state.res.k = Math.min(state.res.maxK, state.res.k + prod.k * deltaSec);
  state.res.m = Math.min(state.res.maxM, state.res.m + prod.m * deltaSec);
  state.res.s = Math.min(state.res.maxS, state.res.s + prod.s * deltaSec);
  
  // 2. Build Queue
  if (state.buildQueue) {
    if (now >= state.buildQueue.end) {
      if (BLD_DATA[state.buildQueue.id]) state.bld[state.buildQueue.id]++;
      if (RES_DATA[state.buildQueue.id]) state.tech[state.buildQueue.id]++;
      addReport('Ausbau abgeschlossen', `${state.buildQueue.name} wurde erfolgreich entwickelt.`, 'success');
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
      if (state.ui.tab === 'units' || state.ui.tab === 'defense') renderView();
    }
  }

  // 4. Missions
  let missionUpdate = false;
  state.missions.forEach(m => {
    if (m.phase === 'out' && now >= m.arrive) {
      resolveCombat(m);
      m.phase = 'return';
      missionUpdate = true;
    } else if (m.phase === 'return' && now >= m.return) {
      resolveReturn(m);
      m.phase = 'done';
      missionUpdate = true;
    }
  });
  if (missionUpdate) {
    state.missions = state.missions.filter(m => m.phase !== 'done');
    renderView();
  }

  // Dynamic DOM Updates (to not break inputs)
  document.getElementById('res-kapital').textContent = formatInt(state.res.k);
  document.getElementById('prod-kapital').textContent = `+${formatInt(prod.k * 3600)}/h`; // Show per hour for readability
  document.getElementById('res-material').textContent = formatInt(state.res.m);
  document.getElementById('prod-material').textContent = `+${formatInt(prod.m * 3600)}/h`;
  document.getElementById('res-schnee').textContent = formatInt(state.res.s);
  document.getElementById('prod-schnee').textContent = `+${formatInt(prod.s * 3600)}/h`;
  
  const elE = document.getElementById('res-energie');
  elE.textContent = formatInt(state.res.e);
  elE.className = 'res-val ' + (state.res.e < 0 ? 'negative' : '');
  
  const gq = document.getElementById('global-queue');
  if (state.buildQueue) {
    gq.classList.remove('hidden');
    const left = Math.max(0, Math.floor((state.buildQueue.end - now) / 1000));
    gq.innerHTML = `<span>Baue: <strong>${state.buildQueue.name}</strong></span><span class="queue-timer">${formatTime(left)}</span>`;
  } else {
    gq.classList.add('hidden');
  }
}

// --- COMBAT ENGINE ---

function resolveCombat(m) {
  const target = state.universe[m.to.sys][m.to.pos];
  if (!target || !target.isAI) {
    // Farm empty slot? No loot.
    addReport(`Kampagne nach ${m.to.sys}:${m.to.pos}`, 'Die Kampagne lief ins Leere.', 'warn');
    return;
  }
  
  // AI Power depends on their score
  const aiScore = target.score;
  const aiDefPower = aiScore * 5; 
  const aiLootK = aiScore * 15;
  const aiLootM = aiScore * 10;
  
  // Player Power
  let atkPower = 0;
  let cargoCap = 0;
  Object.entries(m.units).forEach(([id, count]) => {
    atkPower += count * UNIT_DATA[id].atk * (1 + state.tech.pr_tech * 0.1);
    cargoCap += count * UNIT_DATA[id].cargo;
  });
  
  let reportHTML = `Dein Team traf in Resort ${target.name} ein.<br><br>`;
  
  if (atkPower > aiDefPower) {
    // Win
    const lootK = Math.min(aiLootK, cargoCap);
    const lootM = Math.min(aiLootM, Math.max(0, cargoCap - lootK));
    m.loot = { k: lootK, m: lootM };
    target.score = Math.max(10, target.score - 10); // Damage AI
    reportHTML += `<strong>Erfolg!</strong> Deine Kampagne war überlegen.<br>Beute gesichert: ${formatInt(lootK)} Kapital, ${formatInt(lootM)} Material.`;
    addReport(`Kampagne erfolgreich (${target.name})`, reportHTML, 'attack_win');
  } else {
    // Loss
    m.units = {}; // Lost all
    m.loot = { k: 0, m: 0 };
    reportHTML += `<strong>Niederlage!</strong> Die gegnerischen PR-Anwälte haben deine Kampagne vernichtet. Totalverlust.`;
    addReport(`Kampagne gescheitert (${target.name})`, reportHTML, 'attack_loss');
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
  if (state.buildQueue) return alert('Es läuft bereits ein Ausbau!');
  const cost = getCost(type, category);
  if (state.res.k < cost.k || state.res.m < cost.m || state.res.s < cost.s) return alert('Zu wenig Ressourcen!');
  
  // Check reqs
  const reqs = (category === 'bld') ? BLD_DATA[type].req : RES_DATA[type].req;
  if (reqs) {
    for (const [r, lvl] of Object.entries(reqs)) {
      if ((state.bld[r] || 0) < lvl && (state.tech[r] || 0) < lvl) return alert('Voraussetzungen nicht erfüllt!');
    }
  }

  state.res.k -= cost.k;
  state.res.m -= cost.m;
  state.res.s -= cost.s;
  
  const time = getBuildTime(cost.k, cost.m, category);
  state.buildQueue = {
    type: category,
    id: type,
    name: category === 'bld' ? BLD_DATA[type].name : RES_DATA[type].name,
    end: Date.now() + time * 1000
  };
  renderView();
}

function trainUnits(type, inputVal) {
  const count = parseInt(inputVal);
  if (isNaN(count) || count <= 0) return;
  const unit = UNIT_DATA[type];
  
  if (unit.req) {
    for (const [r, lvl] of Object.entries(unit.req)) {
      if ((state.bld[r] || 0) < lvl && (state.tech[r] || 0) < lvl) return alert('Voraussetzungen fehlen!');
    }
  }

  const costK = unit.costK * count;
  const costM = unit.costM * count;
  const costS = unit.costS * count;
  if (state.res.k < costK || state.res.m < costM || state.res.s < costS) return alert('Zu wenig Ressourcen!');
  
  state.res.k -= costK;
  state.res.m -= costM;
  state.res.s -= costS;
  
  const timePerUnit = getBuildTime(unit.costK, unit.costM, 'unit');
  state.unitQueue.push({
    id: type,
    name: unit.name,
    count: count,
    unitTime: timePerUnit,
    next: Date.now() + timePerUnit * 1000
  });
  renderView();
}

function sendFleet(targetSys, targetPos, units) {
  let totalUnits = 0;
  let fuel = 0;
  let speed = 99999;
  
  const payload = {};
  Object.entries(units).forEach(([id, qty]) => {
    if (qty > 0 && state.units[id] >= qty) {
      payload[id] = qty;
      totalUnits += qty;
      fuel += qty * 10; // base fuel cost
      if (UNIT_DATA[id].speed < speed) speed = UNIT_DATA[id].speed; // fleet travels at slowest ship speed
    }
  });
  
  if (totalUnits === 0) return alert('Keine Flotte ausgewählt.');
  
  // Calculate distance
  const dist = Math.abs(state.coords.sys - targetSys) * 100 + Math.abs(state.coords.pos - targetPos) * 10 + 10;
  const flightTime = Math.floor(dist * 3500 / (speed * (1 + state.tech.drive_tech * 0.2)));
  const fuelCost = Math.floor(fuel * dist / 100);
  
  if (state.res.s < fuelCost) return alert(`Zu wenig Kunstschnee! Benötigt: ${fuelCost}`);
  
  state.res.s -= fuelCost;
  Object.entries(payload).forEach(([id, qty]) => { state.units[id] -= qty; });
  
  const now = Date.now();
  state.missions.push({
    id: `m_${now}`,
    type: 'attack',
    from: { ...state.coords },
    to: { sys: targetSys, pos: targetPos },
    units: payload,
    start: now,
    arrive: now + flightTime * 1000,
    return: now + flightTime * 2000,
    phase: 'out'
  });
  
  alert(`Kampagne gestartet! Ankunft in ${formatTime(flightTime)}.`);
  state.ui.tab = 'fleet';
  renderView();
}

function addReport(title, html, type) {
  state.reports.unshift({ time: Date.now(), title, html, type });
  if (state.reports.length > 50) state.reports.pop();
  if (state.ui.tab !== 'reports') {
    const b = document.getElementById('report-badge');
    b.textContent = parseInt(b.textContent) + 1;
    b.classList.remove('hidden');
  }
}

// --- RENDERERS ---

function checkReqHTML(reqs) {
  if (!reqs) return '';
  const lines = Object.entries(reqs).map(([r, lvl]) => {
    const has = (state.bld[r] || 0) >= lvl || (state.tech[r] || 0) >= lvl;
    const name = BLD_DATA[r]?.name || RES_DATA[r]?.name || r;
    return `<span class="${has ? 'cost-green' : 'cost-red'}">${name} Lvl ${lvl}</span>`;
  });
  return `<div class="cost-req">Benötigt: ${lines.join(', ')}</div>`;
}

function renderTable(dataObj, category) {
  let html = `<table class="ogame-table">
    <tr><th>Anlage</th><th>Beschreibung</th><th>Kosten</th><th>Aktion</th></tr>`;
  
  Object.values(dataObj).forEach(item => {
    const lvl = category === 'bld' ? state.bld[item.id] : state.tech[item.id];
    const cost = getCost(item.id, category);
    const time = getBuildTime(cost.k, cost.m, category);
    const reqText = checkReqHTML(item.req);
    
    let canBuild = true;
    if (item.req) {
      for (const [r, l] of Object.entries(item.req)) {
        if ((state.bld[r] || 0) < l && (state.tech[r] || 0) < l) canBuild = false;
      }
    }
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
          <span class="${state.res.k >= cost.k ? '' : 'cost-red'}">K: ${formatInt(cost.k)}</span>
          <span class="${state.res.m >= cost.m ? '' : 'cost-red'}">M: ${formatInt(cost.m)}</span>
          ${cost.s > 0 ? `<span class="${state.res.s >= cost.s ? '' : 'cost-red'}">S: ${formatInt(cost.s)}</span>` : ''}
        </div>
        <div class="muted" style="font-size:0.8rem; margin-top:4px;">Dauer: ${formatTime(time)}</div>
      </td>
      <td>
        <button class="primary-btn" data-action="build" data-id="${item.id}" data-cat="${category}" ${(!canBuild || !affordable || busy) ? 'disabled' : ''}>Ausbauen</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  return html;
}

function renderUnits(catFilter) {
  let html = `<table class="ogame-table">
    <tr><th>Einheit</th><th>Stats</th><th>Kosten</th><th>Rekrutieren</th></tr>`;
  
  Object.values(UNIT_DATA).filter(u => u.cat === catFilter).forEach(item => {
    const count = state.units[item.id];
    const reqText = checkReqHTML(item.req);
    
    let canBuild = true;
    if (item.req) {
      for (const [r, l] of Object.entries(item.req)) {
        if ((state.bld[r] || 0) < l && (state.tech[r] || 0) < l) canBuild = false;
      }
    }
    const time = getBuildTime(item.costK, item.costM, 'unit');
    
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
          <span class="${state.res.k >= item.costK ? '' : 'cost-red'}">K: ${formatInt(item.costK)}</span>
          <span class="${state.res.m >= item.costM ? '' : 'cost-red'}">M: ${formatInt(item.costM)}</span>
          ${item.costS > 0 ? `<span class="${state.res.s >= item.costS ? '' : 'cost-red'}">S: ${formatInt(item.costS)}</span>` : ''}
        </div>
        <div class="muted" style="font-size:0.8rem; margin-top:4px;">Dauer: ${formatTime(time)} pro Stück</div>
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <input type="number" id="inp_${item.id}" min="1" value="1" style="width:70px;" ${!canBuild ? 'disabled' : ''}>
          <button class="primary-btn" data-action="train" data-id="${item.id}" ${!canBuild ? 'disabled' : ''}>Bauen</button>
        </div>
      </td>
    </tr>`;
  });
  html += `</table>`;
  
  if (state.unitQueue.length > 0) {
    html += `<div class="card" style="margin-top:16px;"><h3>Warteschlange</h3>`;
    state.unitQueue.forEach(q => {
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
        
  Object.values(UNIT_DATA).filter(u => u.cat === 'fleet').forEach(u => {
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
      
  if (state.missions.length === 0) html += `<div class="muted">Keine aktiven Flottenbewegungen.</div>`;
  
  state.missions.forEach(m => {
    const isReturn = m.phase === 'return';
    const targetTime = isReturn ? m.return : m.arrive;
    const left = Math.max(0, Math.floor((targetTime - Date.now())/1000));
    const title = isReturn ? `Rückkehr von ${m.to.sys}:${m.to.pos}` : `Angriff auf ${m.to.sys}:${m.to.pos}`;
    html += `<div class="event-banner">
      <div class="event-meta"><strong>${title}</strong><span class="tag ${isReturn?'good':'warn'}">${formatTime(left)}</span></div>
      <p class="muted">Phase: ${isReturn ? 'Rückflug' : 'Hinflug'}</p>
    </div>`;
  });
      
  html += `</div></div></div>`;
  return html;
}

function renderReports() {
  document.getElementById('report-badge').classList.add('hidden');
  document.getElementById('report-badge').textContent = '0';
  
  if (state.reports.length === 0) return `<div class="card"><p class="muted">Keine Berichte vorhanden.</p></div>`;
  
  let html = ``;
  state.reports.forEach(r => {
    const date = new Date(r.time).toLocaleString('de-DE');
    html += `<div class="report-card ${r.type}">
      <div class="report-meta"><span>${date}</span></div>
      <div class="report-title">${r.title}</div>
      <div>${r.html}</div>
    </div>`;
  });
  return html;
}

function renderOverview() {
  const points = Object.values(state.bld).reduce((a,b)=>a+b,0) * 10 + Object.values(state.tech).reduce((a,b)=>a+b,0) * 50;
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
          <div class="detail-item"><span>Bebaute Felder</span><strong>${Object.values(state.bld).reduce((a,b)=>a+b,0)} / 200</strong></div>
        </div>
      </div>
    </div>
  `;
}

function renderView() {
  const view = document.getElementById('view');
  const tab = state.ui.tab;
  
  if (tab === 'buildings') view.innerHTML = renderTable(BLD_DATA, 'bld');
  else if (tab === 'research') view.innerHTML = renderTable(RES_DATA, 'tech');
  else if (tab === 'units') view.innerHTML = renderUnits('fleet');
  else if (tab === 'defense') view.innerHTML = renderUnits('def');
  else if (tab === 'map') view.innerHTML = renderMap();
  else if (tab === 'fleet') view.innerHTML = renderFleet();
  else if (tab === 'reports') view.innerHTML = renderReports();
  else if (tab === 'settings') view.innerHTML = `<div class="card"><button class="ghost-btn" data-action="reset">Account löschen & Neustart</button></div>`;
  else view.innerHTML = renderOverview();
  
  // Update Tab UI
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
}

// --- UTILS ---

function formatInt(v) { return new Intl.NumberFormat('de-DE').format(Math.floor(v)); }
function formatTime(sec) {
  if (sec < 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// --- EVENTS ---

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const a = btn.dataset.action;
  
  if (a === 'tab') {
    state.ui.tab = btn.dataset.tab;
    renderView();
  }
  else if (a === 'build') {
    startBuild(btn.dataset.id, btn.dataset.cat);
  }
  else if (a === 'train') {
    const id = btn.dataset.id;
    const inp = document.getElementById(`inp_${id}`);
    trainUnits(id, inp ? inp.value : 1);
  }
  else if (a === 'map-sys') {
    state.ui.mapSys = parseInt(btn.dataset.sys);
    renderView();
  }
  else if (a === 'prep-attack') {
    state.ui.fleetTarget.sys = parseInt(btn.dataset.sys);
    state.ui.fleetTarget.pos = parseInt(btn.dataset.pos);
    state.ui.tab = 'fleet';
    renderView();
  }
  else if (a === 'send-fleet') {
    const sys = parseInt(document.getElementById('fl_sys').value);
    const pos = parseInt(document.getElementById('fl_pos').value);
    const payload = {};
    Object.keys(UNIT_DATA).filter(k=>UNIT_DATA[k].cat==='fleet').forEach(k => {
      const v = parseInt(document.getElementById(`fl_amt_${k}`).value) || 0;
      if (v > 0) payload[k] = v;
    });
    sendFleet(sys, pos, payload);
  }
  else if (a === 'reset') {
    if (confirm('Willst du deinen kompletten Account resetten?')) {
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
