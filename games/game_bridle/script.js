const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game State
let gameState = {
    money: 0,
    level: 1,
    damage: 1,
    speed: 4,
    incomeMult: 1,
    splashRange: 0,
    balls: [],
    bricks: [],
    particles: [],
    floatingTexts: [],
    lastTime: Date.now(),
    prestige: {
        count: 0,
        multiplier: 1.0
    },
    upgrades: {
        balls: { level: 1, cost: 10, baseCost: 10 },
        power: { level: 1, cost: 50, baseCost: 50 },
        speed: { level: 1, cost: 100, baseCost: 100 },
        income: { level: 1, cost: 200, baseCost: 200 },
        splash: { level: 0, cost: 1000, baseCost: 1000 }
    }
};

const CONF = {
    brickWidth: 100,
    brickHeight: 30,
    brickPadding: 10,
    brickOffsetTop: 60,
    brickOffsetLeft: 35,
    cols: 5,
    rows: 6
};

const COLORS = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
    "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
    "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800",
    "#FF5722", "#795548", "#9E9E9E", "#607D8B"
];

function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function formatMoney(amount) {
    if (amount >= 1e9) return "$" + (amount / 1e9).toFixed(2) + "B";
    if (amount >= 1e6) return "$" + (amount / 1e6).toFixed(2) + "M";
    if (amount >= 1e3) return "$" + (amount / 1e3).toFixed(2) + "k";
    return "$" + Math.floor(amount);
}

// Save/Load
function saveGame() {
    localStorage.setItem("bridleSave", JSON.stringify({
        money: gameState.money,
        level: gameState.level,
        damage: gameState.damage,
        speed: gameState.speed,
        incomeMult: gameState.incomeMult,
        splashRange: gameState.splashRange,
        prestige: gameState.prestige,
        upgrades: gameState.upgrades,
        ballCount: gameState.balls.length,
        lastTime: Date.now()
    }));
}

function loadGame() {
    const save = JSON.parse(localStorage.getItem("bridleSave"));
    if (save) {
        gameState.money = save.money || 0;
        gameState.level = save.level || 1;
        gameState.damage = save.damage || 1;
        gameState.speed = save.speed || 4;
        gameState.incomeMult = save.incomeMult || 1;
        gameState.splashRange = save.splashRange || 0;
        gameState.prestige = save.prestige || { count: 0, multiplier: 1.0 };
        gameState.upgrades = save.upgrades || gameState.upgrades;
        
        const lastTime = save.lastTime || Date.now();
        gameState.lastTime = Date.now();

        gameState.balls = [];
        const count = save.ballCount || 1;
        for(let i=0; i<count; i++) {
            gameState.balls.push(new Ball());
        }

        const diff = (Date.now() - lastTime) / 1000;
        if (diff > 60) {
            const dps = gameState.balls.length * gameState.damage * gameState.prestige.multiplier;
            const estimatedIncome = dps * diff * 0.5 * gameState.incomeMult; 
            
            if (estimatedIncome > 0) {
                gameState.money += estimatedIncome;
                setTimeout(() => alert(`Welcome back! You earned ${formatMoney(estimatedIncome)} while away.`), 500);
            }
        }

    } else {
        gameState.balls.push(new Ball());
    }
    updateUI();
}

class FloatingText {
    constructor(x, y, text, color, isCrit) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || "#fff";
        this.life = 1.0;
        this.speedY = -1 - Math.random();
        this.speedX = (Math.random() - 0.5) * 1;
        this.size = isCrit ? 22 : 14;
        this.isCrit = isCrit;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.life -= 0.02;
    }
    draw() {
        if(this.life <= 0) return;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = "center";
        
        if (this.isCrit) {
            ctx.shadowColor = "#FFC107";
            ctx.shadowBlur = 10;
        }
        
        ctx.fillText(this.text, this.x, this.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
}

class Ball {
    constructor() {
        this.history = [];
        this.reset();
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 50;
        const angle = (Math.random() * Math.PI / 2) + Math.PI / 4; 
        this.speed = gameState.speed;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = -Math.sin(angle) * this.speed;
        this.radius = 6;
        this.color = "#ffffff";
    }

    update() {
        this.history.push({x: this.x, y: this.y});
        if (this.history.length > 8) this.history.shift();

        const currentSpeed = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
        if (Math.abs(currentSpeed - gameState.speed) > 0.1) {
            this.dx = (this.dx / currentSpeed) * gameState.speed;
            this.dy = (this.dy / currentSpeed) * gameState.speed;
        }

        this.x += this.dx;
        this.y += this.dy;

        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        }
        if (this.y - this.radius < 0) {
            this.dy = -this.dy;
            this.y = this.radius;
        }
        if (this.y + this.radius > canvas.height) {
            this.dy = -this.dy;
            this.y = canvas.height - this.radius;
        }

        for (let brick of gameState.bricks) {
            if (brick.hp > 0 &&
                this.x > brick.x && this.x < brick.x + brick.w &&
                this.y > brick.y && this.y < brick.y + brick.h) {
                
                this.dy = -this.dy;
                hitBrick(brick);
                break; 
            }
        }
    }

    draw() {
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for(let i=1; i<this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.radius * 1.5;
            ctx.lineCap = "round";
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Brick {
    constructor(c, r, hp) {
        this.c = c;
        this.r = r;
        this.x = 0;
        this.y = 0;
        this.w = CONF.brickWidth;
        this.h = CONF.brickHeight;
        this.hp = hp;
        this.maxHp = hp;
        this.value = Math.ceil(hp / 2);
        this.color = randomColor();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 4 - 2;
        this.color = color;
        this.life = 1.0;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.05;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function initLevel() {
    gameState.bricks = [];
    const hp = Math.floor(10 * Math.pow(1.15, gameState.level - 1));
    
    const totalW = (CONF.cols * CONF.brickWidth) + ((CONF.cols - 1) * CONF.brickPadding);
    const startX = (canvas.width - totalW) / 2;

    for (let c = 0; c < CONF.cols; c++) {
        for (let r = 0; r < CONF.rows; r++) {
            let b = new Brick(c, r, hp);
            b.x = startX + (c * (CONF.brickWidth + CONF.brickPadding));
            b.y = CONF.brickOffsetTop + (r * (CONF.brickHeight + CONF.brickPadding));
            gameState.bricks.push(b);
        }
    }
    updateUI();
}

function hitBrick(targetBrick) {
    let dmg = gameState.damage * gameState.prestige.multiplier;
    let isCrit = Math.random() < 0.15; // 15% crit chance
    if (isCrit) dmg *= 3;
    
    applyDamage(targetBrick, dmg, isCrit);
    
    if (gameState.splashRange > 0) {
        const cx = targetBrick.x + targetBrick.w/2;
        const cy = targetBrick.y + targetBrick.h/2;
        
        for (let b of gameState.bricks) {
            if (b === targetBrick || b.hp <= 0) continue;
            const bx = b.x + b.w/2;
            const by = b.y + b.h/2;
            const dist = Math.sqrt((cx-bx)**2 + (cy-by)**2);
            
            if (dist <= gameState.splashRange + 50) {
                applyDamage(b, dmg * 0.5, false);
            }
        }
        
        ctx.beginPath();
        ctx.arc(cx, cy, gameState.splashRange + 50, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.stroke();
    }
}

function applyDamage(brick, amount, isCrit=false) {
    if (brick.hp <= 0) return;
    
    let actualDmg = Math.min(brick.hp, amount);
    brick.hp -= amount;
    
    gameState.floatingTexts.push(new FloatingText(brick.x + brick.w/2, brick.y + brick.h/2, 
        (isCrit ? "CRIT! " : "") + Math.floor(actualDmg), 
        isCrit ? "#FFC107" : "#fff", isCrit));
    
    for(let i=0; i< (isCrit? 4 : 2); i++) {
        gameState.particles.push(new Particle(brick.x + brick.w/2, brick.y + brick.h/2, brick.color));
    }
    
    addMoney(1 * gameState.incomeMult);

    if (brick.hp <= 0) {
        addMoney(brick.value * gameState.incomeMult * 10);
        checkLevelClear();
    }
}

function addMoney(amount) {
    gameState.money += amount;
    updateUI();
}

function checkLevelClear() {
    if (gameState.bricks.every(b => b.hp <= 0)) {
        gameState.level++;
        initLevel();
        saveGame();
    }
}

function updateUI() {
    const moneyEl = document.getElementById("money-display");
    if(moneyEl) moneyEl.innerText = formatMoney(gameState.money);
    
    const levelEl = document.getElementById("level-display");
    if(levelEl) levelEl.innerText = "Level " + gameState.level;
    
    const dpsEl = document.getElementById("dps-display");
    if(dpsEl) dpsEl.innerText = (gameState.balls.length * gameState.damage * gameState.prestige.multiplier).toFixed(1);
    
    const ballCountEl = document.getElementById("ball-count-display");
    if(ballCountEl) ballCountEl.innerText = gameState.balls.length;

    updateBtn("buy-ball", gameState.upgrades.balls);
    updateBtn("upgrade-power", gameState.upgrades.power);
    updateBtn("upgrade-speed", gameState.upgrades.speed);
    updateBtn("upgrade-income", gameState.upgrades.income);
    updateBtn("upgrade-splash", gameState.upgrades.splash);
    
    const prestigeBtn = document.getElementById("prestige-btn");
    const prestigeReq = document.getElementById("prestige-req");
    if (prestigeBtn && prestigeReq) {
        if (gameState.level >= 50) {
            prestigeBtn.classList.remove("disabled");
            prestigeBtn.style.background = "linear-gradient(45deg, #ff9800, #f57c00)";
            prestigeReq.innerText = "Reward: " + Math.floor(gameState.level/10) + " Gems";
        } else {
            prestigeBtn.classList.add("disabled");
            prestigeBtn.style.background = ""; // Reset
            prestigeReq.innerText = "Req: Level 50";
        }
    }
}

function updateBtn(id, upgrade) {
    const btn = document.getElementById(id + "-btn");
    const costEl = document.getElementById(id + "-cost");
    const lvlEl = document.getElementById(id.split("-")[1] + "-level");
    
    if (costEl) costEl.innerText = formatMoney(upgrade.cost);
    if (lvlEl) lvlEl.innerText = "Lvl " + upgrade.level;

    if (btn) {
        if (gameState.money >= upgrade.cost) {
            btn.classList.remove("disabled");
        } else {
            btn.classList.add("disabled");
        }
    }
}

window.buyBall = function() {
    const u = gameState.upgrades.balls;
    if (gameState.money >= u.cost) {
        gameState.money -= u.cost;
        gameState.balls.push(new Ball());
        u.level++;
        u.cost = Math.floor(u.baseCost * Math.pow(1.5, u.level));
        updateUI();
        saveGame();
    }
};

window.upgradePower = function() {
    const u = gameState.upgrades.power;
    if (gameState.money >= u.cost) {
        gameState.money -= u.cost;
        gameState.damage++;
        u.level++;
        u.cost = Math.floor(u.baseCost * Math.pow(1.3, u.level));
        updateUI();
        saveGame();
    }
};

window.upgradeSpeed = function() {
    const u = gameState.upgrades.speed;
    if (gameState.money >= u.cost) {
        gameState.money -= u.cost;
        gameState.speed *= 1.05;
        u.level++;
        u.cost = Math.floor(u.baseCost * Math.pow(1.4, u.level));
        updateUI();
        saveGame();
    }
};

window.upgradeIncome = function() {
    const u = gameState.upgrades.income;
    if (gameState.money >= u.cost) {
        gameState.money -= u.cost;
        gameState.incomeMult *= 1.1;
        u.level++;
        u.cost = Math.floor(u.baseCost * Math.pow(1.4, u.level));
        updateUI();
        saveGame();
    }
};

window.upgradeSplash = function() {
    const u = gameState.upgrades.splash;
    if (gameState.money >= u.cost) {
        gameState.money -= u.cost;
        gameState.splashRange += 25;
        u.level++;
        u.cost = Math.floor(u.baseCost * Math.pow(2.0, u.level));
        updateUI();
        saveGame();
    }
};

window.prestige = function() {
    if (gameState.level < 50) return;
    if (!confirm("Reset for permanent damage boost?")) return;

    const gems = Math.floor(gameState.level / 10);
    gameState.prestige.count += gems;
    gameState.prestige.multiplier = 1 + (gameState.prestige.count * 0.1);
    
    gameState.money = 0;
    gameState.level = 1;
    gameState.damage = 1;
    gameState.speed = 4;
    gameState.incomeMult = 1;
    gameState.splashRange = 0;
    
    gameState.upgrades.balls = { level: 1, cost: 10, baseCost: 10 };
    gameState.upgrades.power = { level: 1, cost: 50, baseCost: 50 };
    gameState.upgrades.speed = { level: 1, cost: 100, baseCost: 100 };
    gameState.upgrades.income = { level: 1, cost: 200, baseCost: 200 };
    gameState.upgrades.splash = { level: 0, cost: 1000, baseCost: 1000 };

    gameState.balls = [new Ball()];
    initLevel();
    saveGame();
};

function loop() {
    ctx.fillStyle = "rgba(10, 15, 30, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let brick of gameState.bricks) {
        if (brick.hp > 0) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
            
            ctx.fillStyle = "#333";
            ctx.fillRect(brick.x + 5, brick.y + brick.h - 8, brick.w - 10, 4);
            ctx.fillStyle = "#0f0";
            const hpPct = Math.max(0, brick.hp / brick.maxHp);
            ctx.fillRect(brick.x + 5, brick.y + brick.h - 8, (brick.w - 10) * hpPct, 4);
        }
    }

    for (let ball of gameState.balls) {
        ball.update();
        ball.draw();
    }

    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        let p = gameState.particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) gameState.particles.splice(i, 1);
    }
    
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
        let ft = gameState.floatingTexts[i];
        ft.update();
        ft.draw();
        if (ft.life <= 0) gameState.floatingTexts.splice(i, 1);
    }
    
    if (Date.now() - gameState.lastTime > 30000) {
        saveGame();
    }

    requestAnimationFrame(loop);
}

loadGame();
initLevel();
loop();