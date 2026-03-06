/**
 * PlanetSki - 3D Ski Resort Builder
 * Hauptspiel-Logik
 */

class PlanetSkiGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.terrain = null;
        this.economy = null;
        this.skierSystem = null;
        this.slopeSystem = null;
        
        this.lifts = [];
        this.buildings = [];
        this.slopes = [];
        
        this.selectedTool = null;
        this.selectedLiftType = null;
        this.selectedBuildingType = null;
        this.selectedSlopeDifficulty = 'blue';
        
        this.liftStartPos = null;
        this.slopeStartPos = null;
        this.isPlacingLift = false;
        
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupThreeJS();
        this.setupTerrain();
        this.setupEconomy();
        this.setupUI();
        this.setupInput();
        this.animate();
    }
    
    setupThreeJS() {
        // Szene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Kamera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(40, 40, 60);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
        
        // Licht
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        this.scene.add(sun);
        
        // Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Cheatcode Listener
        this.setupCheats();
    }
    
    setupCheats() {
        let keyBuffer = '';
        const cheatCode = 'schmachti';
        
        window.addEventListener('keydown', (e) => {
            keyBuffer += e.key.toLowerCase();
            
            // Nur die letzten 9 Zeichen behalten (Länge von "schmachti")
            if (keyBuffer.length > cheatCode.length) {
                keyBuffer = keyBuffer.slice(-cheatCode.length);
            }
            
            // Cheatcode prüfen
            if (keyBuffer === cheatCode) {
                if (this.economy) {
                    const msg = this.economy.cheatMoney();
                    this.showNotification(msg, 'success');
                    this.updateUI();
                }
                keyBuffer = '';
            }
            
            // Alternative: F1 für schnellen Cheat
            if (e.key === 'F1') {
                e.preventDefault();
                if (this.economy) {
                    this.economy.money += 1000000;
                    this.showNotification('💰 +1.000.000€ (F1)', 'success');
                    this.updateUI();
                }
            }
            
            // F2 für verschiedene Map-Größen
            if (e.key === 'F2') {
                e.preventDefault();
                this.cycleMapSize();
            }
        });
    }
    
    cycleMapSize() {
        const sizes = [
            { name: 'Klein', size: 80 },
            { name: 'Mittel', size: 120 },
            { name: 'Groß', size: 200 },
            { name: 'Extra Groß', size: 300 }
        ];
        
        const currentSize = parseInt(localStorage.getItem('planetski_mapsize')) || 120;
        const currentIndex = sizes.findIndex(s => s.size === currentSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        const next = sizes[nextIndex];
        
        localStorage.setItem('planetski_mapsize', next.size);
        this.showNotification(`🗺️ Map-Größe: ${next.name} (${next.size}m) - Seite neu laden!`, 'success');
    }
    
    setupTerrain() {
        // Map-Größe aus localStorage oder Standard
        const mapSize = parseInt(localStorage.getItem('planetski_mapsize')) || 120;
        this.terrain = new Terrain(mapSize, this.scene);
        this.terrain.createSnowfall();
        
        // Slope System
        this.slopeSystem = new SlopeSystem(this.scene, this.terrain);
    }
    
    setupEconomy() {
        this.economy = new Economy();
        
        // Skifahrer-System
        this.skierSystem = new SkierSystem(this.scene, this.terrain, this.lifts, this.buildings);
        
        this.updateUI();
    }
    
    setupUI() {
        // Lift-Typen ins Menü laden
        const liftMenu = document.getElementById('lift-menu');
        const categories = {
            surface: '🎿 Surface Lifts',
            fixed: '🪑 Fixed Chairlifts',  
            detachable: '⚡ Detachable Chairs',
            gondola: '🚠 Gondolas',
            bicable: '🚡 Bicable/Tricable',
            funitel: '🚡 Funitel',
            tramway: '🚠 Aerial Tramways',
            chondola: '🚠+🪑 Chondola',
            funicular: '🚞 Rail-Based'
        };
        
        Object.entries(categories).forEach(([cat, label]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'category';
            catDiv.innerHTML = `<h4>${label}</h4>`;
            
            Object.entries(LIFT_TYPES)
                .filter(([key, lift]) => lift.category === cat)
                .forEach(([key, lift]) => {
                    const btn = document.createElement('button');
                    btn.className = 'lift-btn';
                    btn.dataset.type = key;
                    btn.innerHTML = `
                        ${lift.name}
                        <span class="cost">${lift.cost.toLocaleString()}€</span>
                        <span class="capacity">${lift.capacity}/h</span>
                    `;
                    btn.onclick = () => this.selectLiftType(key);
                    catDiv.appendChild(btn);
                });
            
            liftMenu.appendChild(catDiv);
        });
        
        // Gebäude ins Menü laden
        const buildingMenu = document.getElementById('building-menu');
        const buildingCats = {
            infrastructure: '🏗️ Infrastruktur',
            service: '🍽️ Gastronomie & Service',
            accommodation: '🏨 Unterkünfte'
        };
        
        Object.entries(buildingCats).forEach(([cat, label]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'category';
            catDiv.innerHTML = `<h4>${label}</h4>`;
            
            Object.entries(BUILDING_TYPES)
                .filter(([key, b]) => b.category === cat)
                .forEach(([key, building]) => {
                    const btn = document.createElement('button');
                    btn.className = 'building-btn';
                    btn.dataset.type = key;
                    btn.innerHTML = `
                        ${building.name}
                        <span class="cost">${building.cost.toLocaleString()}€</span>
                    `;
                    btn.onclick = () => this.selectBuildingType(key);
                    catDiv.appendChild(btn);
                });
            
            buildingMenu.appendChild(catDiv);
        });
    }
    
    selectLiftType(type) {
        this.selectedTool = 'lift';
        this.selectedLiftType = type;
        this.isPlacingLift = true;
        this.liftStartPos = null;
        
        document.querySelectorAll('.lift-btn, .building-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`)?.classList.add('selected');
        
        this.showNotification(`${LIFT_TYPES[type].name} ausgewählt. Klicke für Talstation.`);
    }
    
    selectBuildingType(type) {
        this.selectedTool = 'building';
        this.selectedBuildingType = type;
        this.isPlacingLift = false;
        
        document.querySelectorAll('.lift-btn, .building-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`)?.classList.add('selected');
        
        this.showNotification(`${BUILDING_TYPES[type].name} ausgewählt. Klicke zum Platzieren.`);
    }
    
    selectSlopeTool(difficulty) {
        this.selectedTool = 'slope';
        this.selectedSlopeDifficulty = difficulty;
        this.isPlacingLift = false;
        
        this.showNotification(`Piste ${difficulty.toUpperCase()} ausgewählt.`);
    }
    
    setupInput() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            if (this.terrain && this.terrain.terrainMesh) {
                const intersects = raycaster.intersectObject(this.terrain.terrainMesh);
                
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    this.updatePreview(point);
                }
            }
        });
        
        this.renderer.domElement.addEventListener('click', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            if (this.terrain && this.terrain.terrainMesh) {
                const intersects = raycaster.intersectObject(this.terrain.terrainMesh);
                
                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    this.handleClick(point);
                }
            }
        });
    }
    
    updatePreview(point) {
        // Vorschau für Lift/Bauen anzeigen
        // TODO: Implementieren
    }
    
    handleClick(point) {
        if (!this.selectedTool) return;
        
        switch(this.selectedTool) {
            case 'lift':
                this.handleLiftPlacement(point);
                break;
            case 'building':
                this.handleBuildingPlacement(point);
                break;
            case 'slope':
                this.handleSlopePlacement(point);
                break;
        }
    }
    
    handleLiftPlacement(point) {
        if (!this.isPlacingLift || !this.selectedLiftType) return;
        
        if (!this.liftStartPos) {
            // Erster Klick = Talstation
            this.liftStartPos = { x: point.x, z: point.z };
            this.showNotification('Talstation gesetzt. Klicke für Bergstation.');
        } else {
            // Zweiter Klick = Bergstation
            const cost = LIFT_TYPES[this.selectedLiftType].cost;
            
            if (this.economy.spend(cost)) {
                const lift = new SkiLift(
                    this.selectedLiftType,
                    this.liftStartPos.x,
                    this.liftStartPos.z,
                    point.x,
                    point.z,
                    this.scene,
                    this.terrain
                );
                
                this.lifts.push(lift);
                this.showNotification(`${LIFT_TYPES[this.selectedLiftType].name} gebaut!`);
                this.updateUI();
            } else {
                this.showNotification('Nicht genug Geld!', 'error');
            }
            
            this.liftStartPos = null;
        }
    }
    
    handleBuildingPlacement(point) {
        const cost = BUILDING_TYPES[this.selectedBuildingType].cost;
        
        if (this.economy.spend(cost)) {
            const building = createBuilding(this.selectedBuildingType, point.x, point.z);
            
            if (building) {
                this.scene.add(building.mesh);
                this.buildings.push(building);
                this.showNotification(`${BUILDING_TYPES[this.selectedBuildingType].name} gebaut!`);
                this.updateUI();
            }
        } else {
            this.showNotification('Nicht genug Geld!', 'error');
        }
    }
    
    handleSlopePlacement(point) {
        if (!this.slopeStartPos) {
            this.slopeStartPos = { x: point.x, z: point.z };
            this.showNotification('Pisten-Start gesetzt. Klicke für Ende.');
        } else {
            if (this.slopeSystem) {
                this.slopeSystem.createSlope(
                    this.slopeStartPos.x,
                    this.slopeStartPos.z,
                    point.x,
                    point.z,
                    this.selectedSlopeDifficulty
                );
                this.showNotification(`Piste ${this.selectedSlopeDifficulty.toUpperCase()} erstellt!`);
            }
            this.slopeStartPos = null;
        }
    }
    
    showNotification(text, type = 'info') {
        const notif = document.getElementById('notification');
        notif.textContent = text;
        notif.className = type;
        notif.style.opacity = '1';
        
        setTimeout(() => {
            notif.style.opacity = '0';
        }, 3000);
    }
    
    updateUI() {
        const stats = this.economy.getStats();
        
        document.getElementById('money').textContent = stats.money.toLocaleString();
        document.getElementById('visitors').textContent = stats.visitors.toLocaleString();
        document.getElementById('reputation').textContent = stats.reputation;
        document.getElementById('day').textContent = stats.day;
        document.getElementById('weather').textContent = {
            'sunny': '☀️',
            'cloudy': '☁️',
            'snowing': '❄️',
            'foggy': '🌫️',
            'stormy': '⛈️'
        }[stats.weather] || '☀️';
        
        // Lift-Buttons aktivieren/deaktivieren
        document.querySelectorAll('.lift-btn').forEach(btn => {
            const type = btn.dataset.type;
            const cost = LIFT_TYPES[type].cost;
            btn.disabled = stats.money < cost;
        });
    }
    
    animate(time) {
        requestAnimationFrame((t) => this.animate(t));
        
        const deltaTime = (time - this.lastTime) / 1000 || 0;
        this.lastTime = time;
        
        // Controls
        this.controls.update();
        
        // Schneefall
        if (this.terrain) {
            this.terrain.updateSnowfall();
        }
        
        // Lifte updaten
        this.lifts.forEach(lift => lift.update(deltaTime * 1000));
        
        // Skifahrer updaten
        if (this.skierSystem && this.economy) {
            this.skierSystem.update(deltaTime, this.economy.visitors);
        }
        
        // Wirtschaft updaten
        if (this.economy) {
            this.economy.update(deltaTime, this.lifts, this.buildings);
            
            // UI alle Sekunde updaten
            if (Math.floor(time / 1000) > Math.floor((time - deltaTime * 1000) / 1000)) {
                this.updateUI();
            }
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Spiel starten wenn DOM bereit
window.addEventListener('DOMContentLoaded', () => {
    window.game = new PlanetSkiGame();
});
