/**
 * SkiTycoon - Das Ultimative Retro Browsergame
 * Enthält Mechaniken aus: OGame, Travian, Die Stämme, Pennergame, Torn City
 */

// --- 1. CORE GAME STATE ---
const game = {
    money: 200,
    snow: 50,
    level: 1,
    xp: 0,
    xpToNext: 100,
    
    // Torn City: Energie & Nerven
    energy: 100,
    maxEnergy: 100,
    nerve: 50,
    maxNerve: 50,
    crimeExp: 0, // Hidden Stat
    
    // OGame/Travian: Lagerlimits & Upkeep
    maxMoney: 1000,
    maxSnow: 500,
    power: 500,
    maxPower: 500,
    water: 500,
    maxWater: 500,
    isBlackout: false,
    
    // Pennergame: Schwarzmarkt (Pfandflaschen)
    flyers: 0,
    flyerPrice: 5,
    
    // Pennergame: Haustiere (Pets)
    petActive: false,
    petTimer: 0,
    
    // Pennergame: Weiterbildung
    skillLevel: 0,
    skillActive: false,
    skillTimer: 0,
    
    // Tribal Wars / OGame: Bau-Warteschlange & Fleetsave
    buildQueue: null,
    fleetsaveActive: false,
    fleetsaveMoney: 0,
    
    // Torn City: Travel API Lock
    isTraveling: false,
    
    buildings: {}
};

// --- 2. TECH-TREE & GEBÄUDE (OGame / Tribal Wars) ---
// Formeln: Kosten = baseCost * 1.5^level | Produktion = baseInc * level * 1.1^level
const buildingTypes = [
    { id: 'hq', name: 'Verwaltung', icon: '🏢', desc: 'Beschleunigt Bauzeiten um 20% pro Level.', baseCost: 100, baseInc: 0, baseTime: 5, req: null },
    { id: 'tresor', name: 'Bank-Tresor', icon: '🏦', desc: 'Erhöht das Geld-Lagerlimit massiv.', baseCost: 300, baseInc: 0, baseTime: 10, req: { hq: 1 } },
    { id: 'depot', name: 'Schneedepot', icon: '🧊', desc: 'Erhöht das Schnee-Lagerlimit.', baseCost: 200, baseInc: 0, baseTime: 8, req: { hq: 1 } },
    { id: 'draglift', name: 'Schlepplift', icon: '⛓️', desc: 'Generiert Einkommen. Kostet Strom.', baseCost: 150, baseInc: 2, baseTime: 15, req: { hq: 1 } },
    { id: 'snowcannon', name: 'Schneekanone', icon: '❄️', desc: 'Generiert Schnee. Kostet Wasser.', baseCost: 500, baseInc: 0, baseTime: 25, req: { hq: 2, draglift: 1 } },
    { id: 'chairlift', name: '2er Sessellift', icon: '🪑', desc: 'Besseres Einkommen.', baseCost: 1000, baseInc: 10, baseTime: 45, req: { hq: 3, draglift: 3 } },
    { id: 'gondola', name: 'Gondelbahn', icon: '🚠', desc: 'Premium Einkommen.', baseCost: 5000, baseInc: 50, baseTime: 120, req: { hq: 5, chairlift: 5 } }
];

// --- 3. DOM ELEMENTE ---
const elements = {
    money: document.getElementById('money'),
    maxMoney: document.getElementById('max-money'),
    snow: document.getElementById('snow'),
    maxSnow: document.getElementById('max-snow'),
    income: document.getElementById('income'),
    level: document.getElementById('level'),
    xpFill: document.getElementById('xp-fill'),
    
    // Torn
    energyVal: document.getElementById('energy-val'),
    energyFill: document.getElementById('energy-fill'),
    nerveVal: document.getElementById('nerve-val'),
    nerveFill: document.getElementById('nerve-fill'),
    ceVal: document.getElementById('ce-val'),
    btnShovel: document.getElementById('btn-shovel'),
    btnGroom: document.getElementById('btn-groom'),
    btnCrime: document.getElementById('btn-crime'),
    
    // Pennergame
    flyersVal: document.getElementById('flyers-val'),
    flyerPrice: document.getElementById('flyer-price'),
    btnSellFlyers: document.getElementById('btn-sell-flyers'),
    petStatus: document.getElementById('pet-status'),
    petFill: document.getElementById('pet-fill'),
    btnPet: document.getElementById('btn-pet'),
    skillStatus: document.getElementById('skill-status'),
    skillFill: document.getElementById('skill-fill'),
    btnSkill: document.getElementById('btn-skill'),
    
    // UI & Hardcore
    buildingsList: document.getElementById('buildings-list'),
    inventoryList: document.getElementById('inventory-list'),
    newsFeed: document.getElementById('news-feed'),
    powerVal: document.getElementById('power-val'),
    waterVal: document.getElementById('water-val'),
    blackoutWarning: document.getElementById('blackout-warning'),
    btnPromo: document.getElementById('btn-promo'),
    btnFleetsave: document.getElementById('btn-fleetsave'),
    fsStatus: document.getElementById('fleetsave-status'),
    fsTime: document.getElementById('fs-time'),
    btnAdelstrain: document.getElementById('btn-adelstrain'),
    takeoverLog: document.getElementById('takeover-log'),
    btnTravel: document.getElementById('btn-travel'),
    travelOverlay: document.getElementById('travel-overlay'),
    travelTimer: document.getElementById('travel-timer'),
    helicopter: document.getElementById('helicopter'),
    
    // Queue
    queueContainer: document.getElementById('build-queue-container'),
    bqName: document.getElementById('bq-name'),
    bqTime: document.getElementById('bq-time'),
    bqFill: document.getElementById('bq-fill')
};

// --- INITIALISIERUNG ---
document.addEventListener('DOMContentLoaded', () => {
    buildingTypes.forEach(t => { if(game.buildings[t.id] === undefined) game.buildings[t.id] = 0; });
    setupEventListeners();
    renderBuildings();
    updateUI();
    setInterval(gameLoop, 1000);
});

// --- EVENT LISTENERS (Actions) ---
function setupEventListeners() {
    // 1. Torn City Action System (Energy / Nerve)
    elements.btnShovel.addEventListener('click', (e) => {
        if(game.energy >= 10) {
            game.energy -= 10;
            const amt = 2 + Math.floor(Math.random() * 3);
            game.snow = Math.min(game.maxSnow, game.snow + amt);
            showFeedback(e, `+${amt} Schnee`);
            updateUI();
        } else { showFeedback(e, 'Zu wenig Energie!', true); }
    });
    
    elements.btnGroom.addEventListener('click', (e) => {
        if(game.energy >= 15) {
            game.energy -= 15;
            game.money = Math.min(game.maxMoney, game.money + 15);
            addXP(2);
            showFeedback(e, '+15 €');
            updateUI();
        } else { showFeedback(e, 'Zu wenig Energie!', true); }
    });
    
    elements.btnCrime.addEventListener('click', (e) => {
        if(game.nerve >= 10) {
            game.nerve -= 10;
            // Success chance based on Hidden CE
            const chance = 0.4 + (game.crimeExp * 0.01);
            if(Math.random() < chance) {
                game.crimeExp++;
                const loot = 50 + Math.floor(Math.random() * 100);
                game.money = Math.min(game.maxMoney, game.money + loot);
                addNews(`🥷 Kasse geknackt! +${loot}€`);
                showFeedback(e, `+${loot} €`);
            } else {
                game.crimeExp = Math.max(0, game.crimeExp - 2);
                addNews("🚔 Erwischt! Du hast Nerven & Erfahrung verloren.", true);
                showFeedback(e, 'Fehlschlag!', true);
            }
            updateUI();
        } else { showFeedback(e, 'Zu wenig Nerven!', true); }
    });

    // 2. Pennergame Schwarzmarkt
    elements.btnSellFlyers.addEventListener('click', () => {
        if(game.flyers > 0) {
            const profit = game.flyers * game.flyerPrice;
            game.money = Math.min(game.maxMoney, game.money + profit);
            addNews(`📉 ${game.flyers} Pässe für ${profit}€ verkauft!`);
            game.flyers = 0;
            updateUI();
        }
    });

    // 3. Pennergame Pets
    elements.btnPet.addEventListener('click', () => {
        if(!game.petActive) {
            game.petActive = true;
            game.petTimer = 60; // 60 sekunden
            addNews("🐕 Hund Rex ist auf Patrouille...");
            updateUI();
        }
    });

    // 4. Pennergame Weiterbildung
    elements.btnSkill.addEventListener('click', () => {
        if(!game.skillActive && game.money >= 500) {
            game.money -= 500;
            game.skillActive = true;
            game.skillTimer = 120; // 2 Minuten
            addNews("📚 Studium gestartet. Dauert 2 Minuten.");
            updateUI();
        }
    });

    // 5. Promo Link (Pennergame)
    elements.btnPromo.addEventListener('click', (e) => {
        game.money = Math.min(game.maxMoney, game.money + 50);
        addNews("Jemand hat deinen Spendenlink geklickt! +50 €");
        showFeedback(e, '+50 €');
        updateUI();
    });

    // 6. Fleetsave (OGame)
    elements.btnFleetsave.addEventListener('click', () => {
        if(game.fleetsaveActive || game.money <= 0) return;
        game.fleetsaveActive = true;
        game.fleetsaveMoney = Math.floor(game.money * 0.9);
        game.money -= game.fleetsaveMoney;
        
        elements.helicopter.style.display = 'block';
        setTimeout(() => elements.helicopter.classList.add('flying'), 50);
        elements.fsStatus.style.display = 'block';
        
        let tl = 10;
        elements.fsTime.textContent = tl;
        let fsInt = setInterval(() => {
            tl--; elements.fsTime.textContent = tl;
            if(tl <= 0) {
                clearInterval(fsInt);
                game.money = Math.min(game.maxMoney, game.money + game.fleetsaveMoney);
                game.fleetsaveActive = false;
                elements.helicopter.classList.remove('flying');
                setTimeout(() => elements.helicopter.style.display='none', 500);
                elements.fsStatus.style.display = 'none';
                addNews("🚁 Fleetsave beendet. Geld ist sicher.");
                updateUI();
            }
        }, 1000);
        updateUI();
    });

    // 7. Adelstrain (Tribal Wars)
    elements.btnAdelstrain.addEventListener('click', () => {
        elements.takeoverLog.innerHTML = "";
        let baseTime = Date.now() + 2000;
        [0, 50, 100, 150].forEach((gap, i) => {
            let tTime = baseTime + gap;
            let d = new Date(tTime);
            let tStr = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;
            let li = document.createElement('li');
            li.textContent = `Investor ${i+1} gesendet (${tStr})`;
            elements.takeoverLog.appendChild(li);
            
            setTimeout(() => {
                li.style.color = "var(--success)";
                li.textContent = `Investor ${i+1} eingeschlagen!`;
                if(i===3) {
                    addNews("⚔️ Skigebiet übernommen! +1000€");
                    game.maxMoney += 1000; // expand cap temporarily
                    game.money += 1000;
                    updateUI();
                }
            }, tTime - Date.now());
        });
    });

    // 8. Torn City API Lock
    elements.btnTravel.addEventListener('click', () => {
        game.isTraveling = true;
        elements.travelOverlay.style.display = 'flex';
        let tl = 5;
        elements.travelTimer.textContent = tl;
        let tInt = setInterval(() => {
            tl--; elements.travelTimer.textContent = tl;
            if(tl <= 0) {
                clearInterval(tInt);
                game.isTraveling = false;
                elements.travelOverlay.style.display = 'none';
                addNews("🛬 Zurück vom Schwarzmarkt. +300€");
                game.money = Math.min(game.maxMoney, game.money + 300);
                updateUI();
            }
        }, 1000);
    });
}

// --- CALCULATION LOGIC (OGame / Tribal Wars Formulas) ---
function getCost(type) {
    const lvl = game.buildings[type.id] || 0;
    return Math.floor(type.baseCost * Math.pow(1.5, lvl));
}

function getIncome(type) {
    const lvl = game.buildings[type.id] || 0;
    if(lvl === 0) return 0;
    let base = type.baseInc * lvl * Math.pow(1.1, lvl);
    // Apply skill bonus (Pennergame Weiterbildung)
    base = base * (1 + (game.skillLevel * 0.2)); 
    return Math.floor(base);
}

function getBuildTime(type) {
    const lvl = game.buildings[type.id] || 0;
    const hqLvl = game.buildings['hq'] || 0;
    // OGame Style reduction: base * 1.5^lvl / (1 + hqLvl * 0.2)
    const time = (type.baseTime * Math.pow(1.5, lvl)) / (1 + (hqLvl * 0.2));
    return Math.max(1, Math.floor(time));
}

function checkReqs(type) {
    if(!type.req) return true;
    for(let reqBuilding in type.req) {
        if((game.buildings[reqBuilding] || 0) < type.req[reqBuilding]) return false;
    }
    return true;
}

// --- BUILDING SYSTEM ---
function renderBuildings() {
    elements.buildingsList.innerHTML = '';
    
    buildingTypes.forEach(type => {
        const lvl = game.buildings[type.id] || 0;
        const cost = getCost(type);
        const hasReq = checkReqs(type);
        const time = getBuildTime(type);
        
        const div = document.createElement('div');
        div.className = `building-item ${!hasReq || game.money < cost || game.buildQueue ? 'locked' : ''}`;
        
        // Req Text
        let reqText = "";
        if(!hasReq) {
            let reqs = [];
            for(let r in type.req) reqs.push(`${buildingTypes.find(b=>b.id===r).name} Lvl ${type.req[r]}`);
            reqText = `<div class="req">Benötigt: ${reqs.join(', ')}</div>`;
        }

        div.innerHTML = `
            <div class="name">${type.icon} ${type.name} (Lvl ${lvl})</div>
            <div class="desc">${type.desc}</div>
            <div class="cost">Kosten: ${cost} € ⏱️ ${time}s</div>
            ${type.baseInc > 0 ? `<div class="income">Bringt: +${getIncome(type)} €/s</div>` : ''}
            ${reqText}
        `;
        
        if (hasReq && game.money >= cost && !game.buildQueue) {
            div.addEventListener('click', () => startBuilding(type));
        }
        elements.buildingsList.appendChild(div);
    });

    // Render Inventory
    const items = buildingTypes.filter(t => game.buildings[t.id] > 0);
    elements.inventoryList.innerHTML = items.length === 0 ? '<p class="empty">Nichts gebaut.</p>' : 
        items.map(t => `<div class="inventory-item"><div style="font-size:1.5em">${t.icon}</div><div class="count">Lvl ${game.buildings[t.id]}</div><div class="name">${t.name}</div></div>`).join('');
}

function startBuilding(type) {
    const cost = getCost(type);
    if(game.money >= cost && !game.buildQueue) {
        game.money -= cost;
        game.buildQueue = {
            id: type.id,
            name: type.name,
            totalTime: getBuildTime(type),
            timeLeft: getBuildTime(type)
        };
        addNews(`🚧 Bauauftrag gestartet: ${type.name}`);
        renderBuildings();
        updateUI();
    }
}

// --- MAIN GAME LOOP ---
function gameLoop() {
    if (game.isTraveling) return; // Torn Travel API Lock

    // 1. Storage Limits (OGame/Travian)
    game.maxMoney = 1000 + (game.buildings['tresor'] || 0) * 2000;
    game.maxSnow = 500 + (game.buildings['depot'] || 0) * 1000;

    // 2. Upkeep / Blackout System (Travian)
    const lifts = (game.buildings['draglift']||0) + (game.buildings['chairlift']||0) + (game.buildings['gondola']||0);
    const cannons = game.buildings['snowcannon'] || 0;
    let powerCost = lifts * 5;
    let waterCost = cannons * 10;
    
    if (game.power >= powerCost && game.water >= waterCost) {
        game.power -= powerCost;
        game.water -= waterCost;
        game.isBlackout = false;
        elements.blackoutWarning.style.display = 'none';
        
        // Income
        let totalIncome = 0;
        buildingTypes.forEach(t => totalIncome += getIncome(t));
        game.money = Math.min(game.maxMoney, game.money + totalIncome);
        elements.income.textContent = `${totalIncome} €/s`;
        
        // Snow generation
        if(cannons > 0) game.snow = Math.min(game.maxSnow, game.snow + cannons * 2);
    } else {
        game.isBlackout = true;
        elements.income.textContent = `0 €/s (BLACKOUT)`;
        elements.blackoutWarning.style.display = 'block';
    }

    // Passive Resource Regen
    if(!game.isBlackout) {
        game.power = Math.min(game.maxPower, game.power + 10);
        game.water = Math.min(game.maxWater, game.water + 10);
    }

    // 3. Torn Energy / Nerve Regen
    game.energy = Math.min(game.maxEnergy, game.energy + 1);
    // Nerve regenerates slower (every 5 ticks simulated)
    if(Math.random() < 0.2) game.nerve = Math.min(game.maxNerve, game.nerve + 1);

    // 4. Pennergame Schwarzmarkt (Dynamic Market)
    if(Math.random() < 0.2) game.flyers++; // Passive generation
    if(Math.random() < 0.1) {
        // Change price randomly between 1 and 20
        game.flyerPrice = Math.floor(Math.random() * 20) + 1;
    }

    // 5. Pennergame Pets Timer
    if(game.petActive) {
        game.petTimer--;
        if(game.petTimer <= 0) {
            game.petActive = false;
            const foundMoney = 50 + Math.floor(Math.random() * 150);
            game.money = Math.min(game.maxMoney, game.money + foundMoney);
            addNews(`🐕 Rex ist zurück und hat ${foundMoney}€ erschnüffelt!`);
        }
    }

    // 6. Pennergame Weiterbildung Timer
    if(game.skillActive) {
        game.skillTimer--;
        if(game.skillTimer <= 0) {
            game.skillActive = false;
            game.skillLevel++;
            addNews(`🎓 Studium beendet! Du verdienst nun mehr Einkommen.`);
        }
    }

    // 7. Tribal Wars Bau-Warteschlange
    if(game.buildQueue) {
        game.buildQueue.timeLeft--;
        if(game.buildQueue.timeLeft <= 0) {
            game.buildings[game.buildQueue.id]++;
            addNews(`✅ Gebäude fertig: ${game.buildQueue.name} Lvl ${game.buildings[game.buildQueue.id]}`);
            game.buildQueue = null;
            addXP(15);
            renderBuildings(); // Refresh reqs
        }
    }

    updateUI();
}

function updateUI() {
    elements.money.textContent = Math.floor(game.money);
    elements.maxMoney.textContent = game.maxMoney;
    elements.snow.textContent = Math.floor(game.snow);
    elements.maxSnow.textContent = game.maxSnow;
    elements.level.textContent = game.level;
    
    // Torn UI
    elements.energyVal.textContent = `${game.energy}/${game.maxEnergy}`;
    elements.energyFill.style.width = `${(game.energy/game.maxEnergy)*100}%`;
    elements.nerveVal.textContent = `${game.nerve}/${game.maxNerve}`;
    elements.nerveFill.style.width = `${(game.nerve/game.maxNerve)*100}%`;
    elements.ceVal.textContent = game.crimeExp;

    // Schwarzmarkt
    elements.flyersVal.textContent = game.flyers;
    elements.flyerPrice.textContent = `${game.flyerPrice} €`;

    // Pet
    if(game.petActive) {
        elements.petStatus.textContent = `Sucht... (${game.petTimer}s)`;
        elements.petFill.style.width = `${((60-game.petTimer)/60)*100}%`;
        elements.btnPet.disabled = true;
    } else {
        elements.petStatus.textContent = "Bereit";
        elements.petFill.style.width = `0%`;
        elements.btnPet.disabled = false;
    }

    // Skill
    elements.skillStatus.textContent = `Level ${game.skillLevel}`;
    if(game.skillActive) {
        elements.skillStatus.textContent += ` (Lernt... ${game.skillTimer}s)`;
        elements.skillFill.style.width = `${((120-game.skillTimer)/120)*100}%`;
        elements.btnSkill.disabled = true;
    } else {
        elements.skillFill.style.width = `0%`;
        elements.btnSkill.disabled = false;
    }

    // Queue
    if(game.buildQueue) {
        elements.queueContainer.style.display = 'block';
        elements.bqName.textContent = game.buildQueue.name;
        elements.bqTime.textContent = game.buildQueue.timeLeft;
        let pct = ((game.buildQueue.totalTime - game.buildQueue.timeLeft) / game.buildQueue.totalTime) * 100;
        elements.bqFill.style.width = `${pct}%`;
    } else {
        elements.queueContainer.style.display = 'none';
    }

    // Upkeep
    elements.powerVal.textContent = game.power;
    elements.waterVal.textContent = game.water;
}

// --- HELPER ---
function addXP(amount) {
    game.xp += amount;
    if(game.xp >= game.xpToNext) {
        game.level++;
        game.xp -= game.xpToNext;
        game.xpToNext = Math.floor(game.xpToNext * 1.5);
        addNews(`🎉 LEVEL UP! Du bist Level ${game.level}`);
        renderBuildings();
    }
    elements.xpFill.style.width = `${(game.xp/game.xpToNext)*100}%`;
}

function addNews(text, isError=false) {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.innerHTML = `<span class="time">${new Date().toLocaleTimeString()}</span><p style="color:${isError?'var(--danger)':'inherit'}">${text}</p>`;
    elements.newsFeed.prepend(div);
    if(elements.newsFeed.children.length > 10) elements.newsFeed.removeChild(elements.newsFeed.lastChild);
}

function showFeedback(e, text, isError=false) {
    const fb = document.createElement('div');
    fb.className = 'click-feedback';
    fb.textContent = text;
    fb.style.color = isError ? 'var(--danger)' : 'var(--success)';
    fb.style.left = `${e.clientX}px`;
    fb.style.top = `${e.clientY}px`;
    document.body.appendChild(fb);
    setTimeout(() => fb.remove(), 1000);
}
