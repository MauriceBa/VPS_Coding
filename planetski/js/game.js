/**
 * PlanetSki - 3D Ski Resort Builder
 * Haupt-Game-Logik
 */

class PlanetSkiGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.terrain = null;
        this.economy = null;
        
        this.lifts = [];
        this.buildings = [];
        this.slopes = [];
        
        this.selectedTool = null;
        this.selectedLiftType = null;
        this.selectedBuildingType = null;
        this.selectedSlopeDifficulty = 'blue';
        
        this.liftStartPoint = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        this.setupThreeJS();
        this.setupTerrain();
        this.setupEconomy();
        this.setupEventListeners();
        this.setupUI();
        this.animate();
        
        console.log('🎿 PlanetSki geladen!');
    }
    
    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(40, 40, 40);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 150;
        this.controls.target.set(0, 10, 0);
        
        // Licht
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }
    
    setupTerrain() {
        this.terrain = new Terrain(100, this.scene);
        this.terrain.createSnowfall();
    }
    
    setupEconomy() {
        this.economy = new Economy();
        this.economy.onUpdate = (report) => {
            this.updateUI(report);
        };
    }
    
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.onResize());
        
        // Maus-Interaktion
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelTool();
        });
    }
    
    setupUI() {
        // UI wird durch HTML/JS gesteuert
        window.gameUI = new GameUI(this);
    }
    
    // Tool-Auswahl
    selectTool(tool) {
        this.selectedTool = tool;
        this.liftStartPoint = null;
        
        // Highlight aktives Tool
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const btn = document.querySelector(`[data-tool="${tool}"]`);
        if (btn) btn.classList.add('active');
        
        // Tool-spezifische Panels anzeigen
        this.showToolPanel(tool);
    }
    
    selectLiftType(type) {
        this.selectedLiftType = type;
        this.selectedTool = 'lift';
        
        document.querySelectorAll('.lift-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const btn = document.querySelector(`[data-lift="${type}"]`);
        if (btn) btn.classList.add('active');
    }
    
    selectBuildingType(type) {
        this.selectedBuildingType = type;
        this.selectedTool = 'building';
        
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const btn = document.querySelector(`[data-building="${type}"]`);
        if (btn) btn.classList.add('active');
    }
    
    selectSlopeDifficulty(difficulty) {
        this.selectedSlopeDifficulty = difficulty;
        this.selectedTool = 'slope';
        
        document.querySelectorAll('.slope-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const btn = document.querySelector(`[data-slope="${difficulty}"]`);
        if (btn) btn.classList.add('active');
    }
    
    showToolPanel(tool) {
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        const panel = document.getElementById(`${tool}-panel`);
        if (panel) panel.style.display = 'block';
    }
    
    cancelTool() {
        this.selectedTool = null;
        this.liftStartPoint = null;
        this.selectedLiftType = null;
        this.selectedBuildingType = null;
        
        document.querySelectorAll('.tool-btn, .lift-btn, .building-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.style.display = 'none';
        });
    }
    
    // Maus-Interaktion
    getIntersectPoint(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Intersect mit Terrain
        const intersects = this.raycaster.intersectObject(this.terrain.terrainMesh);
        
        if (intersects.length > 0) {
            return intersects[0].point;
        }
        return null;
    }
    
    onMouseMove(event) {
        const point = this.getIntersectPoint(event);
        if (!point) return;
        
        // Preview anzeigen
        this.updatePreview(point);
    }
    
    onClick(event) {
        if (!this.selectedTool) return;
        
        const point = this.getIntersectPoint(event);
        if (!point) return;
        
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
            case 'delete':
                this.handleDelete(point);
                break;
        }
    }
    
    handleLiftPlacement(point) {
        if (!this.selectedLiftType) {
            alert('Wähle zuerst einen Lifttyp aus!');
            return;
        }
        
        const config = LIFT_TYPES[this.selectedLiftType];
        if (!this.economy.canAfford(config.cost)) {
            alert(`Nicht genug Geld! Du brauchst ${config.cost}€`);
            return;
        }
        
        if (!this.liftStartPoint) {
            // Erster Klick = Talstation
            this.liftStartPoint = { x: point.x, z: point.z };
            this.showPreviewLine(point);
            
            // Visuelles Feedback
            this.createPlacementMarker(point.x, point.z, 0x00ff00);
        } else {
            // Zweiter Klick = Bergstation
            const endPoint = { x: point.x, z: point.z };
            
            // Prüfe Länge
            const length = Math.sqrt(
                Math.pow(endPoint.x - this.liftStartPoint.x, 2) + 
                Math.pow(endPoint.z - this.liftStartPoint.z, 2)
            );
            
            if (length > config.maxLength) {
                alert(`Lift zu lang! Maximal ${config.maxLength}m`);
                return;
            }
            
            if (length < 20) {
                alert('Lift zu kurz! Mindestens 20m');
                return;
            }
            
            // Lift erstellen
            const lift = new SkiLift(
                this.selectedLiftType,
                this.liftStartPoint.x,
                this.liftStartPoint.z,
                endPoint.x,
                endPoint.z,
                this.scene
            );
            
            this.lifts.push(lift);
            this.economy.spend(config.cost, config.name);
            
            // Reset
            this.liftStartPoint = null;
            this.hidePreviewLine();
            
            // Erfolgsmeldung
            this.economy.notify(`${config.name} gebaut!`);
        }
    }
    
    handleBuildingPlacement(point) {
        if (!this.selectedBuildingType) return;
        
        const config = BUILDING_TYPES[this.selectedBuildingType];
        if (!this.economy.canAfford(config.cost)) {
            alert(`Nicht genug Geld! Du brauchst ${config.cost}€`);
            return;
        }
        
        const building = createBuilding(this.selectedBuildingType, point.x, point.z);
        if (building) {
            this.scene.add(building.mesh);
            this.buildings.push(building);
            this.economy.spend(config.cost, config.name);
            
            // Pop-In Animation
            this.animatePlacement(building.mesh);
            
            this.economy.notify(`${config.name} gebaut!`);
        }
    }
    
    handleSlopePlacement(point) {
        if (!this.slopeStartPoint) {
            this.slopeStartPoint = { x: point.x, z: point.z };
            this.createPlacementMarker(point.x, point.z, 0x4169E1);
        } else {
            const endPoint = { x: point.x, z: point.z };
            
            const slope = this.terrain.createSlope(
                this.slopeStartPoint.x,
                this.slopeStartPoint.z,
                endPoint.x,
                endPoint.z,
                this.selectedSlopeDifficulty
            );
            
            this.slopes.push(slope);
            this.slopeStartPoint = null;
            
            this.economy.notify(`Piste (${this.selectedSlopeDifficulty}) angelegt!`);
        }
    }
    
    handleDelete(point) {
        // Finde nahes Objekt zum Löschen
        const threshold = 5;
        
        // Prüfe Gebäude
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const b = this.buildings[i];
            const dist = Math.sqrt(Math.pow(b.x - point.x, 2) + Math.pow(b.z - point.z, 2));
            if (dist < threshold) {
                this.scene.remove(b.mesh);
                this.buildings.splice(i, 1);
                this.economy.notify('Gebäude entfernt');
                return;
            }
        }
        
        // Prüfe Lifte
        for (let i = this.lifts.length - 1; i >= 0; i--) {
            const l = this.lifts[i];
            const dist = Math.sqrt(
                Math.pow(l.startPos.x - point.x, 2) + 
                Math.pow(l.startPos.z - point.z, 2)
            );
            if (dist < threshold) {
                l.dispose();
                this.lifts.splice(i, 1);
                this.economy.notify('Lift entfernt');
                return;
            }
        }
    }
    
    // Visualisierung
    createPlacementMarker(x, z, color) {
        const geometry = new THREE.RingGeometry(2, 2.5, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: color, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(x, 0.2, z);
        this.scene.add(marker);
        
        // Entferne nach kurzer Zeit
        setTimeout(() => {
            this.scene.remove(marker);
        }, 2000);
    }
    
    showPreviewLine(point) {
        // Wird bei Mouse-Move aktualisiert
    }
    
    hidePreviewLine() {
        // Preview entfernen
    }
    
    updatePreview(point) {
        // Hier könnte man einen Ghost-Bauanzeige implementieren
    }
    
    animatePlacement(mesh) {
        mesh.scale.set(0, 0, 0);
        
        let scale = 0;
        const animate = () => {
            scale += 0.1;
            if (scale <= 1) {
                mesh.scale.set(scale, scale, scale);
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    updateUI(report) {
        // UI wird durch GameUI-Klasse aktualisiert
        if (window.gameUI) {
            window.gameUI.update(report);
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta() * 1000;
        
        // Updates
        this.controls.update();
        this.terrain.updateSnowfall();
        this.economy.update(deltaTime);
        
        // Lift-Animation
        this.lifts.forEach(lift => lift.update(deltaTime));
        
        this.renderer.render(this.scene, this.camera);
    }
}

// UI-Controller
class GameUI {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Tool-Buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.game.selectTool(tool);
            });
        });
        
        // Lift-Buttons
        document.querySelectorAll('.lift-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.lift;
                this.game.selectLiftType(type);
            });
        });
        
        // Building-Buttons
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.building;
                this.game.selectBuildingType(type);
            });
        });
        
        // Slope-Buttons
        document.querySelectorAll('.slope-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.slope;
                this.game.selectSlopeDifficulty(difficulty);
            });
        });
        
        // Geschwindigkeits-Steuerung
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) {
            speedBtn.addEventListener('click', () => {
                // Zeitbeschleunigung
            });
        }
    }
    
    update(report) {
        // Stats aktualisieren
        const moneyEl = document.getElementById('stat-money');
        const visitorsEl = document.getElementById('stat-visitors');
        const reputationEl = document.getElementById('stat-reputation');
        const dayEl = document.getElementById('stat-day');
        const timeEl = document.getElementById('stat-time');
        
        if (moneyEl) moneyEl.textContent = Math.floor(report.money).toLocaleString() + '€';
        if (visitorsEl) visitorsEl.textContent = report.visitors;
        if (reputationEl) reputationEl.textContent = report.reputation + '%';
        if (dayEl) dayEl.textContent = 'Tag ' + report.day;
        if (timeEl) timeEl.textContent = report.hour + ':00';
        
        // Finanz-Details
        const incomeEl = document.getElementById('stat-income');
        const expensesEl = document.getElementById('stat-expenses');
        
        if (incomeEl) incomeEl.textContent = '+' + report.income.total.toFixed(0) + '€';
        if (expensesEl) expensesEl.textContent = '-' + report.expenses.total.toFixed(0) + '€';
    }
    
    showNotification(message) {
        const notif = document.getElementById('notification');
        if (notif) {
            notif.textContent = message;
            notif.classList.add('show');
            
            setTimeout(() => {
                notif.classList.remove('show');
            }, 3000);
        }
    }
}

// Spiel starten wenn DOM bereit
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new PlanetSkiGame();
});
