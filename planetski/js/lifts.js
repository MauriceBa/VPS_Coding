/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Lifte
 */

const LIFT_TYPES = {
    // Schlepplift / Platter lift
    tbar: {
        name: '🎿 Bügellift',
        cost: 5000,
        capacity: 800,        // Personen/Stunde
        speed: 8,             // km/h
        maxLength: 500,       // Meter
        maxHeight: 150,       // Höhenmeter
        description: 'Günstiger Lift für Anfänger',
        color: 0xFF6B6B,
        poleDistance: 15,     // Abstand der Stützen
        carrierColor: 0x4ECDC4
    },
    
    // 2er Sessellift
    chair2: {
        name: '🪑 2er Sessellift',
        cost: 15000,
        capacity: 1200,
        speed: 12,
        maxLength: 1500,
        maxHeight: 400,
        description: 'Klassischer Sessellift',
        color: 0x4ECDC4,
        poleDistance: 40,
        carrierColor: 0x95E1D3,
        seatsPerCarrier: 2
    },
    
    // 4er Sessellift
    chair4: {
        name: '🪑🪑 4er Sessellift',
        cost: 35000,
        capacity: 2400,
        speed: 16,
        maxLength: 2500,
        maxHeight: 800,
        description: 'Moderner Sessellift mit Blendschutz',
        color: 0x45B7D1,
        poleDistance: 60,
        carrierColor: 0x95E1D3,
        seatsPerCarrier: 4
    },
    
    // 6er Sessellift
    chair6: {
        name: '🪑🪑🪑 6er Sessellift',
        cost: 60000,
        capacity: 3200,
        speed: 18,
        maxLength: 3000,
        maxHeight: 1000,
        description: 'Hochleistungs-Sessellift',
        color: 0x5F27CD,
        poleDistance: 80,
        carrierColor: 0xA29BFE,
        seatsPerCarrier: 6
    },
    
    // Gondel
    gondola: {
        name: '🚠 Gondelbahn',
        cost: 80000,
        capacity: 2000,
        speed: 20,
        maxLength: 4000,
        maxHeight: 1200,
        description: 'Wettergeschützte Kabinen',
        color: 0xFFD93D,
        poleDistance: 100,
        carrierColor: 0xFFE66D,
        cabinCapacity: 8
    },
    
    // Zweiseilumlaufbahn (große Gondel)
    cableCar: {
        name: '🚡 Pendelbahn',
        cost: 150000,
        capacity: 800,
        speed: 35,
        maxLength: 5000,
        maxHeight: 2000,
        description: 'Große Kabinen für Massentransport',
        color: 0xFF6B9D,
        poleDistance: 150,
        carrierColor: 0xFFA07A,
        cabinCapacity: 30
    }
};

// Lift erstellen
class SkiLift {
    constructor(type, startX, startZ, endX, endZ, scene) {
        this.type = type;
        this.config = LIFT_TYPES[type];
        this.startPos = { x: startX, z: startZ };
        this.endPos = { x: endX, z: endZ };
        this.scene = scene;
        
        // Berechne Länge und Höhe
        this.length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
        this.height = 0; // Wird vom Terrain bestimmt
        
        this.carriers = [];
        this.poles = [];
        this.cables = [];
        this.group = new THREE.Group();
        
        this.build();
    }
    
    build() {
        // Stations-Plattformen
        this.buildStation(this.startPos.x, this.startPos.z, true);  // Talstation
        this.buildStation(this.endPos.x, this.endPos.z, false);     // Bergstation
        
        // Stützen entlang der Strecke
        this.buildPoles();
        
        // Seile
        this.buildCables();
        
        // Gondeln/Sessel
        this.buildCarriers();
        
        this.scene.add(this.group);
    }
    
    buildStation(x, z, isValley) {
        const stationGroup = new THREE.Group();
        
        // Hauptgebäude
        const width = isValley ? 6 : 5;
        const depth = isValley ? 8 : 6;
        const height = isValley ? 3 : 4;
        
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color: isValley ? 0x8B4513 : 0xA0522D })
        );
        building.position.y = height / 2;
        building.castShadow = true;
        stationGroup.add(building);
        
        // Dach
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 2, 4),
            new THREE.MeshStandardMaterial({ color: 0x2d3748 })
        );
        roof.position.y = height + 1;
        roof.rotation.y = Math.PI / 4;
        stationGroup.add(roof);
        
        // Antriebsrad (nur Talstation sichtbar)
        if (isValley) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16),
                new THREE.MeshStandardMaterial({ color: 0x4a5568 })
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(0, height - 1, depth/2 + 0.5);
            stationGroup.add(wheel);
            
            // Rotations-Animation
            this.animateWheel(wheel);
        }
        
        // Schild
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(3, 1, 0.2),
            new THREE.MeshStandardMaterial({ 
                color: this.config.color,
                emissive: this.config.color,
                emissiveIntensity: 0.2
            })
        );
        sign.position.set(0, height + 0.5, isValley ? depth/2 + 0.2 : -depth/2 - 0.2);
        stationGroup.add(sign);
        
        stationGroup.position.set(x, 0, z);
        this.group.add(stationGroup);
    }
    
    animateWheel(wheel) {
        const animate = () => {
            wheel.rotation.x += 0.02;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    buildPoles() {
        const poleCount = Math.floor(this.length / this.config.poleDistance);
        const dx = (this.endPos.x - this.startPos.x) / poleCount;
        const dz = (this.endPos.z - this.startPos.z) / poleCount;
        
        for (let i = 1; i < poleCount; i++) {
            const x = this.startPos.x + dx * i;
            const z = this.startPos.z + dz * i;
            
            const pole = this.createPole();
            pole.position.set(x, 0, z);
            
            // Neige Stütze leicht bergauf
            const angle = Math.atan2(this.endPos.z - this.startPos.z, this.endPos.x - this.startPos.x);
            pole.rotation.y = -angle;
            
            this.group.add(pole);
            this.poles.push(pole);
        }
    }
    
    createPole() {
        const poleGroup = new THREE.Group();
        
        // Hauptstütze
        const height = 8 + Math.random() * 4;
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.25, height, 8),
            new THREE.MeshStandardMaterial({ color: 0x718096 })
        );
        pole.position.y = height / 2;
        pole.castShadow = true;
        poleGroup.add(pole);
        
        // Querträger
        const crossbar = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.1, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x4a5568 })
        );
        crossbar.position.y = height - 1;
        poleGroup.add(crossbar);
        
        // Seilrollen
        const wheel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x2d3748 })
        );
        wheel1.rotation.z = Math.PI / 2;
        wheel1.position.set(-1.2, height - 1, 0);
        poleGroup.add(wheel1);
        
        const wheel2 = wheel1.clone();
        wheel2.position.set(1.2, height - 1, 0);
        poleGroup.add(wheel2);
        
        return poleGroup;
    }
    
    buildCables() {
        // Zugseil (dicker, beweglich)
        const cableGeometry = new THREE.CylinderGeometry(0.03, 0.03, this.length, 4);
        const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
        
        const cable = new THREE.Mesh(cableGeometry, cableMaterial);
        cable.rotation.z = Math.PI / 2;
        cable.rotation.y = Math.atan2(this.endPos.z - this.startPos.z, this.endPos.x - this.startPos.x);
        
        const midX = (this.startPos.x + this.endPos.x) / 2;
        const midZ = (this.startPos.z + this.endPos.z) / 2;
        cable.position.set(midX, 8, midZ);
        
        this.group.add(cable);
        this.cables.push(cable);
    }
    
    buildCarriers() {
        const carrierCount = Math.floor(this.length / (this.type === 'tbar' ? 10 : 20));
        
        for (let i = 0; i < carrierCount; i++) {
            const carrier = this.createCarrier();
            this.carriers.push({
                mesh: carrier,
                progress: i / carrierCount,
                direction: 1
            });
            this.group.add(carrier);
        }
    }
    
    createCarrier() {
        const group = new THREE.Group();
        
        if (this.type === 'tbar') {
            // Bügel
            const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4),
                new THREE.MeshStandardMaterial({ color: 0x4a5568 })
            );
            bar.rotation.z = Math.PI / 2;
            bar.position.y = -0.5;
            group.add(bar);
            
            // Griff
            const handle = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x2d3748 })
            );
            handle.position.set(0, -0.5, 0);
            group.add(handle);
        } else if (['chair2', 'chair4', 'chair6'].includes(this.type)) {
            // Sessellift
            const seatCount = this.config.seatsPerCarrier || 2;
            
            // Gestell
            const frame = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 2, 4),
                new THREE.MeshStandardMaterial({ color: 0x4a5568 })
            );
            frame.position.y = -1;
            group.add(frame);
            
            // Sitzbank
            const seatWidth = seatCount * 0.6;
            const seat = new THREE.Mesh(
                new THREE.BoxGeometry(seatWidth, 0.1, 0.5),
                new THREE.MeshStandardMaterial({ color: this.config.carrierColor })
            );
            seat.position.y = -2;
            group.add(seat);
            
            // Rückenlehne
            const back = new THREE.Mesh(
                new THREE.BoxGeometry(seatWidth, 0.6, 0.1),
                new THREE.MeshStandardMaterial({ color: this.config.carrierColor })
            );
            back.position.set(0, -1.7, -0.25);
            group.add(back);
            
            // Blendschutz (nur 4er und 6er)
            if (seatCount >= 4) {
                const bubble = new THREE.Mesh(
                    new THREE.SphereGeometry(seatWidth * 0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI/2),
                    new THREE.MeshStandardMaterial({ 
                        color: 0x87CEEB, 
                        transparent: true, 
                        opacity: 0.3 
                    })
                );
                bubble.position.y = -1.5;
                group.add(bubble);
            }
        } else {
            // Gondel/Kabine
            const capacity = this.config.cabinCapacity || 8;
            const width = capacity > 10 ? 3 : 2;
            
            // Seil
            const cable = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4),
                new THREE.MeshStandardMaterial({ color: 0x4a5568 })
            );
            cable.position.y = -0.5;
            group.add(cable);
            
            // Kabine
            const cabin = new THREE.Mesh(
                new THREE.BoxGeometry(width, 2.5, 2),
                new THREE.MeshStandardMaterial({ color: this.config.carrierColor })
            );
            cabin.position.y = -2;
            group.add(cabin);
            
            // Fenster
            const window_ = new THREE.Mesh(
                new THREE.PlaneGeometry(width - 0.4, 1.5),
                new THREE.MeshStandardMaterial({ 
                    color: 0x87CEEB, 
                    transparent: true, 
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );
            window_.position.set(0, -2, 1.05);
            group.add(window_);
        }
        
        return group;
    }
    
    update(deltaTime) {
        // Bewege alle Carrier
        this.carriers.forEach(carrier => {
            carrier.progress += (deltaTime * 0.0001 * this.config.speed);
            
            if (carrier.progress >= 1) {
                carrier.progress = 0;
            }
            
            // Position berechnen
            const x = this.startPos.x + (this.endPos.x - this.startPos.x) * carrier.progress;
            const z = this.startPos.z + (this.endPos.z - this.startPos.z) * carrier.progress;
            
            // Höhe (linear interpoliert + etwas Bogen)
            const baseHeight = 8;
            const arc = Math.sin(carrier.progress * Math.PI) * 2;
            const y = baseHeight + arc;
            
            carrier.mesh.position.set(x, y, z);
        });
    }
    
    dispose() {
        this.scene.remove(this.group);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LIFT_TYPES, SkiLift };
}
