/**
 * SkiTycoon - Der ultimative Ski-Resort Manager
 * Ein Pennergame/Die Stämme Style Clicker/Idle Game
 */

// Spiel-Status
const game = {
    money: 100,
    snow: 50,
    level: 1,
    xp: 0,
    xpToNext: 100,
    incomePerSecond: 0,
    slopes: 0,
    guests: 0,
    reputation: 'Unbekannt',
    buildings: {},
    weather: 'sunny',
    temperature: -5,
    startTime: Date.now()
};

// Gebäude-Typen (wie in Die Stämme/Pennergame)
const buildingTypes = [
    {
        id: 'draglift',
        name: 'Schlepplift',
        icon: '⛓️',
        desc: 'Der Klassiker für Anfänger',
        baseCost: 150,
        income: 2,
        unlockLevel: 1,
        maxCount: 10
    },
    {
        id: 'chairlift',
        name: '2er Sessellift',
        icon: '🪑',
        desc: 'Komfortabel den Berg hoch',
        baseCost: 500,
        income: 8,
        unlockLevel: 2,
        maxCount: 8
    },
    {
        id: 'quadlift',
        name: '4er Sessellift',
        icon: '🚡',
        desc: 'Mehr Kapazität für mehr Gäste',
        baseCost: 2000,
        income: 25,
        unlockLevel: 3,
        maxCount: 6
    },
    {
        id: 'gondola',
        name: 'Gondelbahn',
        icon: '🚠',
        desc: 'Premium-Transport für alle',
        baseCost: 8000,
        income: 80,
        unlockLevel: 5,
        maxCount: 4
    },
    {
        id: 'cabin',
        name: 'Skihütte',
        icon: '🏠',
        desc: 'Brotzeit mit Aussicht',
        baseCost: 3000,
        income: 35,
        unlockLevel: 4,
        maxCount: 5
    },
    {
        id: 'restaurant',
        name: 'Bergrestaurant',
        icon: '🍽️',
        desc: 'Gourmet auf 2000m',
        baseCost: 15000,
        income: 150,
        unlockLevel: 6,
        maxCount: 3
    },
    {
        id: 'snowcannon',
        name: 'Schneekanone',
        icon: '❄️',
        desc: 'Immer Schnee, egal wie warm',
        baseCost: 5000,
        income: 15,
        unlockLevel: 4,
        maxCount: 10
    },
    {
        id: 'skischool',
        name: 'Skischule',
        icon: '🎓',
        desc: 'Lehre die nächste Generation',
        baseCost: 10000,
        income: 60,
        unlockLevel: 5,
        maxCount: 4
    }
];

// Wetter-System
const weatherTypes = [
    { type: 'sunny', icon: '☀️', text: 'Sonnig', tempMod: 0, incomeMod: 1.2 },
    { type: 'cloudy', icon: '☁️', text: 'Bewölkt', tempMod: -2, incomeMod: 1.0 },
    { type: 'snowy', icon: '🌨️', text: 'Schneefall', tempMod: -5, incomeMod: 1.5 },
    { type: 'foggy', icon: '🌫️', text: 'Nebelig', tempMod: -3, incomeMod: 0.7 }
];

// News-Meldungen
const newsMessages = [
    "Neuer Schneefall erwartet!",
    "Skiverband lobt deine Pistenpräparierung!",
    "Tourismusverband empfiehlt dein Skigebiet!",
    "Weltcup-Event in der Region geplant!",
    "Berühmter Skifahrer gesichtet auf deinen Pisten!",
    "Schneehöhe erreicht Rekordwert!",
    "Neue Abfahrt wird eröffnet!",
    "Gäste begeistert von den neuen Liften!"
];

// DOM Elemente
const elements = {
    money: document.getElementById('money'),
    income: document.getElementById('income'),
    snow: document.getElementById('snow'),
    slopes: document.getElementById('slopes'),
    guests: document.getElementById('guests'),
    level: document.getElementById('level'),
    xpFill: document.getElementById('xp-fill'),
    reputation: document.getElementById('reputation'),
    buildingsList: document.getElementById('buildings-list'),
    inventoryList: document.getElementById('inventory-list'),
    newsFeed: document.getElementById('news-feed'),
    weatherIcon: document.getElementById('weather-icon'),
    weatherText: document.getElementById('weather-text'),
    temperature: document.getElementById('temperature'),
    btnShovel: document.getElementById('btn-shovel'),
    btnGroom: document.getElementById('btn-groom'),
    btnRent: document.getElementById('btn-rent'),
    btnTeach: document.getElementById('btn-teach')
};

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupEventListeners();
    renderBuildings();
    updateUI();
    
    // Game Loop
    setInterval(gameLoop, 1000);
    
    // Wetter-Wechsel
    setInterval(changeWeather, 30000);
    
    // News
    setInterval(addRandomNews, 60000);
});

function initGame() {
    // Lade gespeicherten Stand (localStorage)
    const saved = localStorage.getItem('skiTycoonSave');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(game, data);
        addNews('Spielstand geladen! Willkommen zurück!');
    }
    
    // Initialisiere Gebäude-Counts
    buildingTypes.forEach(type => {
        if (!game.buildings[type.id]) {
            game.buildings[type.id] = 0;
        }
    });
}

function setupEventListeners() {
    // Aktionen
    elements.btnShovel.addEventListener('click', (e) => {
        const amount = Math.floor(Math.random() * 3) + 1;
        game.snow += amount;
        addXP(1);
        showClickFeedback(e, `+${amount} Schnee`);
        updateUI();
    });
    
    elements.btnGroom.addEventListener('click', (e) => {
        if (game.snow >= 5) {
            game.snow -= 5;
            game.money += 5;
            game.slopes += 0.1;
            addXP(2);
            showClickFeedback(e, '+5 €');
            updateUI();
        } else {
            showClickFeedback(e, 'Zu wenig Schnee!', true);
        }
    });
    
    elements.btnRent.addEventListener('click', (e) => {
        game.money += 10;
        game.guests += 0.5;
        addXP(3);
        showClickFeedback(e, '+10 €');
        updateUI();
    });
    
    elements.btnTeach.addEventListener('click', (e) => {
        game.money += 25;
        game.guests += 1;
        addXP(5);
        showClickFeedback(e, '+25 €');
        updateUI();
    });
    
    // Speichern vor dem Verlassen
    window.addEventListener('beforeunload', saveGame);
}

function renderBuildings() {
    elements.buildingsList.innerHTML = '';
    
    buildingTypes.forEach(type => {
        const owned = game.buildings[type.id] || 0;
        const cost = calculateCost(type);
        const locked = game.level < type.unlockLevel;
        
        const div = document.createElement('div');
        div.className = `building-item ${locked ? 'locked' : ''}`;
        div.innerHTML = `
            <div class="name">${type.icon} ${type.name}</div>
            <div class="desc">${type.desc}</div>
            <div class="cost">${locked ? `Level ${type.unlockLevel} benötigt` : `${formatMoney(cost)}`}</div>
            ${!locked ? `<div class="income">+${type.income} €/Sek • ${owned}/${type.maxCount}</div>` : ''}
        `;
        
        if (!locked && owned < type.maxCount) {
            div.addEventListener('click', () => buyBuilding(type));
        }
        
        elements.buildingsList.appendChild(div);
    });
}

function calculateCost(type) {
    const owned = game.buildings[type.id] || 0;
    return Math.floor(type.baseCost * Math.pow(1.2, owned));
}

function buyBuilding(type) {
    const cost = calculateCost(type);
    const owned = game.buildings[type.id] || 0;
    
    if (game.money >= cost && owned < type.maxCount) {
        game.money -= cost;
        game.buildings[type.id] = owned + 1;
        addXP(10);
        addNews(`Neuer ${type.name} gebaut!`);
        renderBuildings();
        renderInventory();
        updateUI();
    } else if (game.money < cost) {
        addNews('Nicht genug Geld!', true);
    }
}

function renderInventory() {
    const items = buildingTypes.filter(t => game.buildings[t.id] > 0);
    
    if (items.length === 0) {
        elements.inventoryList.innerHTML = '<p class="empty">Noch keine Gebäude vorhanden...</p>';
        return;
    }
    
    elements.inventoryList.innerHTML = items.map(type => `
        <div class="inventory-item">
            <div style="font-size: 1.5em;">${type.icon}</div>
            <div class="count">${game.buildings[type.id]}x</div>
            <div class="name">${type.name}</div>
        </div>
    `).join('');
}

function calculateIncome() {
    let income = 0;
    buildingTypes.forEach(type => {
        const count = game.buildings[type.id] || 0;
        income += count * type.income;
    });
    
    // Wetter-Modifier
    const weather = weatherTypes.find(w => w.type === game.weather);
    income *= weather.incomeMod;
    
    return Math.floor(income);
}

function gameLoop() {
    const income = calculateIncome();
    game.money += income;
    game.incomePerSecond = income;
    
    // Gäste-Generierung
    const totalBuildings = Object.values(game.buildings).reduce((a, b) => a + b, 0);
    game.guests += totalBuildings * 0.5;
    
    // Schneeschmelze
    if (game.temperature > 0 && game.weather !== 'snowy') {
        game.snow = Math.max(0, game.snow - 0.5);
    } else if (game.weather === 'snowy') {
        game.snow += 2;
    }
    
    // Level-Up prüfen
    if (game.xp >= game.xpToNext) {
        levelUp();
    }
    
    // Reputation aktualisieren
    updateReputation();
    
    updateUI();
    saveGame();
}

function addXP(amount) {
    game.xp += amount;
}

function levelUp() {
    game.level++;
    game.xp -= game.xpToNext;
    game.xpToNext = Math.floor(game.xpToNext * 1.5);
    addNews(`🎉 Level Up! Du bist jetzt Level ${game.level}!`);
    renderBuildings();
}

function updateReputation() {
    const totalBuildings = Object.values(game.buildings).reduce((a, b) => a + b, 0);
    
    if (totalBuildings === 0) game.reputation = 'Unbekannt';
    else if (totalBuildings < 3) game.reputation = 'Bekannter Hang';
    else if (totalBuildings < 8) game.reputation = 'Lokaler Treffpunkt';
    else if (totalBuildings < 15) game.reputation = 'Beliebtes Skigebiet';
    else if (totalBuildings < 25) game.reputation = 'Top Destination';
    else game.reputation = 'Weltklasse-Resort';
}

function changeWeather() {
    const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    game.weather = weather.type;
    game.temperature = -5 + weather.tempMod + Math.floor(Math.random() * 5);
    
    elements.weatherIcon.textContent = weather.icon;
    elements.weatherText.textContent = weather.text;
    elements.temperature.textContent = `${game.temperature}°C`;
    
    addNews(`Wetterwechsel: ${weather.text}`);
}

function addRandomNews() {
    const msg = newsMessages[Math.floor(Math.random() * newsMessages.length)];
    addNews(msg);
}

function addNews(text, isError = false) {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.innerHTML = `
        <span class="time">${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
        <p style="${isError ? 'color: var(--danger)' : ''}">${text}</p>
    `;
    
    elements.newsFeed.insertBefore(div, elements.newsFeed.firstChild);
    
    // Max 10 News behalten
    while (elements.newsFeed.children.length > 10) {
        elements.newsFeed.removeChild(elements.newsFeed.lastChild);
    }
}

function showClickFeedback(event, text, isError = false) {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback';
    feedback.textContent = text;
    feedback.style.color = isError ? 'var(--danger)' : 'var(--success)';
    feedback.style.left = `${event.clientX}px`;
    feedback.style.top = `${event.clientY}px`;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 1000);
}

function updateUI() {
    elements.money.textContent = formatMoney(game.money);
    elements.income.textContent = `${formatMoney(game.incomePerSecond)} €`;
    elements.snow.textContent = `${Math.floor(game.snow)} cm`;
    elements.slopes.textContent = Math.floor(game.slopes);
    elements.guests.textContent = Math.floor(game.guests);
    elements.level.textContent = game.level;
    elements.reputation.textContent = game.reputation;
    
    const xpPercent = (game.xp / game.xpToNext) * 100;
    elements.xpFill.style.width = `${xpPercent}%`;
}

function formatMoney(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M €';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'k €';
    return amount + ' €';
}

function saveGame() {
    localStorage.setItem('skiTycoonSave', JSON.stringify(game));
}

// Debug/Hilfe
window.skiTycoon = {
    game,
    addMoney: (amount) => { game.money += amount; updateUI(); },
    reset: () => { localStorage.removeItem('skiTycoonSave'); location.reload(); }
};
