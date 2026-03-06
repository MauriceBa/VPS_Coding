/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Alle Lifte (Ultra-Realistische Skilift-Typen & Modelle)
 */

const LIFT_TYPES = {
    // ========== SURFACE LIFTS ==========
    magicCarpet: { name: '✨ Magic Carpet', category: 'surface', cost: 15000, capacity: 1200, speed: 3, maxLength: 100, maxHeight: 20, description: 'Conveyor belt for beginners and kids', color: 0xFF6B6B, poleDistance: 20, model: 'conveyor' },
    ropeTow: { name: '🪢 Rope Tow', category: 'surface', cost: 8000, capacity: 600, speed: 10, maxLength: 300, maxHeight: 50, description: 'Simple rope tow for 1 person', color: 0xFFA500, poleDistance: 25, model: 'rope' },
    platterLift: { name: '🍽️ Platter Lift', category: 'surface', cost: 10000, capacity: 800, speed: 12, maxLength: 400, maxHeight: 80, description: 'Platter to clamp between the legs', color: 0x9B59B6, poleDistance: 20, model: 'platter' },
    tbar: { name: '🎿 T-Bar', category: 'surface', cost: 12000, capacity: 1000, speed: 14, maxLength: 500, maxHeight: 120, description: 'T-shaped bar for 1-2 people', color: 0xE74C3C, poleDistance: 18, model: 'tbar' },
    
    // ========== FIXED GRIP CHAIRLIFTS ==========
    chair1Fixed: { name: '🪑 1-Seater Chair (fixed)', category: 'fixed', cost: 25000, capacity: 800, speed: 10, maxLength: 800, maxHeight: 250, description: 'Classic single chair', color: 0x3498DB, poleDistance: 35, seats: 1, model: 'chair', bubble: false },
    chair2Fixed: { name: '🪑🪑 2-Seater Chair (fixed)', category: 'fixed', cost: 35000, capacity: 1200, speed: 12, maxLength: 1200, maxHeight: 350, description: 'Two-seater chair with fixed grip', color: 0x2980B9, poleDistance: 40, seats: 2, model: 'chair', bubble: false },
    chair3Fixed: { name: '🪑🪑🪑 3-Seater Chair (fixed)', category: 'fixed', cost: 45000, capacity: 1500, speed: 12, maxLength: 1400, maxHeight: 400, description: 'Three-seater chair', color: 0x1ABC9C, poleDistance: 45, seats: 3, model: 'chair', bubble: false },
    chair4Fixed: { name: '🪑×4 4-Seater Chair (fixed)', category: 'fixed', cost: 55000, capacity: 1800, speed: 13, maxLength: 1600, maxHeight: 500, description: 'Four-seater chair - workhorse', color: 0x16A085, poleDistance: 50, seats: 4, model: 'chair', bubble: false },
    chair6Fixed: { name: '🪑×6 6-Seater Chair (fixed)', category: 'fixed', cost: 70000, capacity: 2200, speed: 14, maxLength: 1800, maxHeight: 600, description: 'Six-seater with fixed grip', color: 0x27AE60, poleDistance: 55, seats: 6, model: 'chair', bubble: false },
    
    // ========== DETACHABLE CHAIRLIFTS ==========
    chair2Detach: { name: '⚡ 2-Seater Chair (detachable)', category: 'detachable', cost: 60000, capacity: 1600, speed: 18, maxLength: 2000, maxHeight: 700, description: 'Detachable two-seater chair', color: 0xF39C12, poleDistance: 60, seats: 2, model: 'chair', bubble: false },
    chair3Detach: { name: '⚡⚡ 3-Seater Chair (detachable)', category: 'detachable', cost: 75000, capacity: 2000, speed: 18, maxLength: 2200, maxHeight: 800, description: 'Detachable three-seater chair', color: 0xE67E22, poleDistance: 65, seats: 3, model: 'chair', bubble: false },
    chair4Detach: { name: '⚡⚡⚡ 4-Seater Chair D-Line', category: 'detachable', cost: 90000, capacity: 2400, speed: 20, maxLength: 2500, maxHeight: 900, description: 'Detachable four-seater chair', color: 0xD35400, poleDistance: 70, seats: 4, model: 'chair', bubble: true },
    chair6Detach: { name: '⚡⚡⚡⚡ 6-Seater Chair D-Line', category: 'detachable', cost: 120000, capacity: 3200, speed: 22, maxLength: 3000, maxHeight: 1100, description: 'Modern six-seater with bubble', color: 0xC0392B, poleDistance: 85, seats: 6, model: 'chair', bubble: true },
    chair8Detach: { name: '⚡⚡⚡⚡⚡ 8-Seater Chair D-Line', category: 'detachable', cost: 150000, capacity: 4000, speed: 24, maxLength: 3500, maxHeight: 1300, description: 'High-performance eight-seater', color: 0x8E44AD, poleDistance: 100, seats: 8, model: 'chair', bubble: true },
    
    // ========== GONDOLAS ==========
    gondola4: { name: '🚠 Gondola 1S 4P', category: 'gondola', cost: 100000, capacity: 1600, speed: 18, maxLength: 3000, maxHeight: 1000, description: '4-person gondola', color: 0xF1C40F, poleDistance: 80, cabinSize: 4, model: 'gondola' },
    gondola6: { name: '🚠 Gondola 1S 6P', category: 'gondola', cost: 120000, capacity: 2000, speed: 20, maxLength: 3500, maxHeight: 1200, description: '6-person gondola', color: 0xF39C12, poleDistance: 90, cabinSize: 6, model: 'gondola' },
    gondola8: { name: '🚠 Gondola 1S 8P Omega V', category: 'gondola', cost: 140000, capacity: 2400, speed: 22, maxLength: 4000, maxHeight: 1400, description: '8-person CWA Omega V', color: 0xE67E22, poleDistance: 100, cabinSize: 8, model: 'gondola' },
    gondola10: { name: '🚠 Gondola 1S 10P D-Line', category: 'gondola', cost: 160000, capacity: 2800, speed: 24, maxLength: 4500, maxHeight: 1600, description: '10-person premium cabin', color: 0xD35400, poleDistance: 110, cabinSize: 10, model: 'gondola' },
    gondola12: { name: '🚠 Gondola 1S 12P D-Line', category: 'gondola', cost: 180000, capacity: 3200, speed: 24, maxLength: 5000, maxHeight: 1800, description: '12-person mass transit', color: 0xE74C3C, poleDistance: 120, cabinSize: 12, model: 'gondola' },
    
    // ========== BIG CABLE ==========
    gondola2S18: { name: '🚡 Gondola 2S 18P', category: 'bicable', cost: 250000, capacity: 2000, speed: 25, maxLength: 6000, maxHeight: 2000, description: 'Bicable gondola (18P)', color: 0x9B59B6, poleDistance: 150, cabinSize: 18, model: 'bigGondola' },
    gondola3S35: { name: '🚡 Tricable 3S Symphony', category: 'tricable', cost: 400000, capacity: 2500, speed: 30, maxLength: 8000, maxHeight: 2500, description: '3S Symphony Cabin (35P)', color: 0x8E44AD, poleDistance: 200, cabinSize: 35, model: 'bigGondola' },
    funitel: { name: '🚡 Funitel 30P', category: 'funitel', cost: 350000, capacity: 3000, speed: 28, maxLength: 7000, maxHeight: 2200, description: 'Funitel - extremely wind stable', color: 0x1ABC9C, poleDistance: 180, cabinSize: 30, model: 'funitel' },
    
    // ========== AERIAL TRAMWAY / PENDELBAHN ==========
    tramway50: { name: '🚠 Aerial Tramway 50P', category: 'tramway', cost: 500000, capacity: 800, speed: 35, maxLength: 10000, maxHeight: 3000, description: 'Large aerial tramway', color: 0xE91E63, poleDistance: 0, cabinSize: 50, model: 'tramway' },
    tramway100: { name: '🚠 Aerial Tramway 100P', category: 'tramway', cost: 800000, capacity: 1200, speed: 40, maxLength: 12000, maxHeight: 3500, description: 'Giant aerial tramway', color: 0xAD1457, poleDistance: 0, cabinSize: 100, model: 'tramway' },
    tramway150: { name: '🚠 Aerial Tramway 150P', category: 'tramway', cost: 1200000, capacity: 1600, speed: 42, maxLength: 15000, maxHeight: 4000, description: 'Mega aerial tramway', color: 0x880E4F, poleDistance: 0, cabinSize: 150, model: 'tramway' },
    tramway200: { name: '🚠 Double Decker 200P', category: 'tramway', cost: 2000000, capacity: 2400, speed: 45, maxLength: 20000, maxHeight: 4500, description: 'VANOISE EXPRESS Style', color: 0x4A148C, poleDistance: 0, cabinSize: 200, model: 'doubleDecker' },
    
    // ========== CHONDOLA ==========
    chondola: { name: '🚠+🪑 Chondola', category: 'chondola', cost: 180000, capacity: 2800, speed: 21, maxLength: 2800, maxHeight: 1200, description: 'Mix of 6-seater chair and 10P gondola', color: 0x00BCD4, poleDistance: 75, model: 'chondola' },
    
    // ========== RAIL-BASED ==========
    funicular: { name: '🚞 Funicular', category: 'funicular', cost: 600000, capacity: 1000, speed: 15, maxLength: 5000, maxHeight: 1500, description: 'Rail-based funicular', color: 0x795548, poleDistance: 0, model: 'funicular' },
    undergroundFunicular: { name: '🚇 Underground Funicular', category: 'funicular', cost: 1500000, capacity: 1500, speed: 20, maxLength: 8000, maxHeight: 2000, description: 'Underground funicular', color: 0x5D4037, poleDistance: 0, model: 'underground' },
    inclinedElevator: { name: '🛗 Inclined Elevator', category: 'funicular', cost: 400000, capacity: 600, speed: 12, maxLength: 2000, maxHeight: 800, description: 'Inclined elevator', color: 0x607D8B, poleDistance: 0, model: 'funicular' }
};

// ==========================================
// ULTRA-DETAILED 3D MODELS (D-Line / CWA)
// ==========================================
const LiftModels = {
    createRoundedShape: (width, height, radius) => {
        const shape = new THREE.Shape();
        const x = -width/2, y = -height/2;
        shape.moveTo(x, y + radius);
        shape.lineTo(x, y + height - radius);
        shape.quadraticCurveTo(x, y + height, x + radius, y + height);
        shape.lineTo(x + width - radius, y + height);
        shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        shape.lineTo(x + width, y + radius);
        shape.quadraticCurveTo(x + width, y, x + width - radius, y);
        shape.lineTo(x + radius, y);
        shape.quadraticCurveTo(x, y, x, y + radius);
        return shape;
    },

    // Detachable Grip Mechanism (Klemme)
    createGrip: () => {
        const grip = new THREE.Group();
        // Main cast body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 }));
        body.position.y = 0.2;
        grip.add(body);
        // Guide wheels (Torsionsrollen)
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), wheelMat);
        w1.rotation.z = Math.PI/2; w1.position.set(-0.2, 0.3, 0.3);
        const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), wheelMat);
        w2.rotation.z = Math.PI/2; w2.position.set(0.2, 0.3, -0.3);
        grip.add(w1, w2);
        // Spring coil (Spiralfeder)
        const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x999999 }));
        spring.rotation.x = Math.PI/2; spring.position.set(0.2, 0.2, 0);
        grip.add(spring);
        return grip;
    },

    // Ultra-Detailed D-Line Chairlift
    createChair: (color, seats, hasBubble) => {
        const group = new THREE.Group();
        const seatWidth = seats * 0.55;
        
        // Detailed Hanger (Gehänge)
        const hangerGroup = new THREE.Group();
        hangerGroup.add(LiftModels.createGrip());
        
        // Hanger arm with vibration damper
        const upperHanger = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 }));
        upperHanger.position.set(0, -0.6, 0);
        const damper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x050505 }));
        damper.position.set(0, -1.2, 0); // Schwingungsdämpfer
        const lowerHanger = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 }));
        lowerHanger.position.set(-0.25, -2.0, 0);
        lowerHanger.rotation.z = Math.PI / 10;
        hangerGroup.add(upperHanger, damper, lowerHanger);
        group.add(hangerGroup);
        
        // Seat frame and individual D-Line seats
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.4 });
        const seatBase = new THREE.Mesh(new THREE.BoxGeometry(seatWidth + 0.2, 0.05, 0.6), frameMat);
        seatBase.position.set(0, -2.6, 0.1);
        group.add(seatBase);
        
        for (let i = 0; i < seats; i++) {
            const xPos = -seatWidth/2 + 0.275 + i*0.55;
            const pad = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 }));
            pad.position.set(xPos, -2.55, 0.1);
            const backPad = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.08), new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 }));
            backPad.position.set(xPos, -2.2, -0.15);
            backPad.rotation.x = -Math.PI / 16;
            const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222 }));
            headRest.position.set(xPos, -1.8, -0.2);
            group.add(pad, backPad, headRest);
        }
        
        // Safety bar with detailed footrests
        const safetyBarGroup = new THREE.Group();
        const mainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, seatWidth, 8), new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8 }));
        mainBar.rotation.z = Math.PI / 2;
        mainBar.position.set(0, -2.1, 0.45); 
        safetyBarGroup.add(mainBar);
        
        for (let i = 0; i < seats; i++) {
            const xPos = -seatWidth/2 + 0.275 + i*0.55;
            const separator = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            separator.position.set(xPos, -2.25, 0.45);
            const restStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xAAAAAA }));
            restStem.rotation.x = Math.PI / 6;
            restStem.position.set(xPos, -2.5, 0.35);
            const skiRest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: 0x222222 }));
            skiRest.position.set(xPos, -2.7, 0.23);
            safetyBarGroup.add(separator, restStem, skiRest);
        }
        group.add(safetyBarGroup);
        
        if (hasBubble) {
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(seatWidth * 0.52, 24, 24, 0, Math.PI * 2, 0, Math.PI/2.2),
                new THREE.MeshPhysicalMaterial({ color: color, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.3, transmission: 0.6, side: THREE.DoubleSide })
            );
            dome.scale.set(1, 0.9, 0.6); 
            dome.position.set(0, -2.0, 0.1);
            dome.rotation.x = -Math.PI / 6; // Closed position
            group.add(dome);
        }
        return group;
    },
    
    // CWA Omega V Cabin (Ultra Detailed)
    createGondola: (color, size) => {
        const group = new THREE.Group();
        const scales = { 4: 1, 6: 1.2, 8: 1.4, 10: 1.6, 12: 1.8, 18: 2.2, 30: 2.8, 35: 3 };
        const scale = scales[size] || 1;
        
        // Detailed Hanger + Grip
        const hangerGrp = new THREE.Group();
        hangerGrp.add(LiftModels.createGrip());
        const hangerV = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8*scale, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 }));
        hangerV.position.y = -0.9*scale;
        const damper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        damper.position.y = -0.4*scale;
        const hangerH = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8*scale, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        hangerH.rotation.z = Math.PI/2; hangerH.position.set(-0.4*scale, -1.8*scale, 0);
        hangerGrp.add(hangerV, damper, hangerH);
        group.add(hangerGrp);
        
        // Cabin Dimensions
        const width = 1.6 * scale, height = 2.1 * scale, depth = 1.4 * scale, radius = 0.35 * scale;
        const shape = LiftModels.createRoundedShape(width, height, radius);
        
        // Cabin Main Body
        const cabinGeo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelThickness: 0.05 });
        cabinGeo.center();
        const cabin = new THREE.Mesh(cabinGeo, new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.5 }));
        cabin.position.y = -2.2 * scale;
        group.add(cabin);

        // Rubber Bumper
        const bumperGeo = new THREE.ExtrudeGeometry(LiftModels.createRoundedShape(width*1.05, 0.1, radius), { depth: depth*1.05, bevelEnabled: false });
        bumperGeo.center();
        const bumper = new THREE.Mesh(bumperGeo, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 }));
        bumper.position.y = -2.7 * scale;
        group.add(bumper);

        // Ventilation unit
        const vent = new THREE.Mesh(new THREE.BoxGeometry(width*0.6, 0.1, depth*0.6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        vent.position.y = -2.2 * scale + height/2 + 0.05;
        group.add(vent);
        
        // Panoramic Flush Windows
        const winGeo = new THREE.ExtrudeGeometry(LiftModels.createRoundedShape(width*1.02, height*0.55, radius*0.9), { depth: depth*1.02, bevelEnabled: false });
        winGeo.center();
        const windowBand = new THREE.Mesh(winGeo, new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.75, roughness: 0.0, transmission: 0.4, metalness: 0.9 }));
        windowBand.position.y = -2.1 * scale;
        group.add(windowBand);

        // Ski Racks on doors
        const rackGroup = new THREE.Group();
        const rackWidth = width * 0.4;
        const rackMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
        const rackBot = new THREE.Mesh(new THREE.BoxGeometry(rackWidth, 0.2, 0.2), rackMat);
        rackBot.position.set(0, -height/2 + 0.3, depth/2 + 0.1);
        const rackTop = new THREE.Mesh(new THREE.BoxGeometry(rackWidth, 0.05, 0.2), rackMat);
        rackTop.position.set(0, height/4, depth/2 + 0.1);
        rackGroup.add(rackBot, rackTop);
        rackGroup.position.y = -2.2 * scale;
        group.add(rackGroup);

        // Internal seats
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const bench1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, depth*0.8), seatMat);
        bench1.position.set(-width/2 + 0.3, -2.8 * scale, 0);
        const bench2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, depth*0.8), seatMat);
        bench2.position.set(width/2 - 0.3, -2.8 * scale, 0);
        group.add(bench1, bench2);
        
        return group;
    },

    // 3S Symphony Cabin
    createBigGondola: (color, size) => {
        const group = LiftModels.createGondola(color, size);
        
        // Detailed 3S Carriage (8-wheel Laufwerk)
        const carriage = new THREE.Group();
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 }));
        carriage.add(chassis);
        for(let side of [-0.6, 0.6]) {
            for(let x of [-1.2, -0.4, 0.4, 1.2]) {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x050505 }));
                wheel.rotation.x = Math.PI/2;
                wheel.position.set(x, 0.2, side);
                carriage.add(wheel);
            }
        }
        carriage.position.y = 0.2;
        group.add(carriage);

        return group;
    },

    createFunitel: (color, size) => {
        const group = LiftModels.createGondola(color, size);
        const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        crossbar.position.y = 0.1;
        group.add(crossbar);
        // Two grips
        const grip1 = LiftModels.createGrip(); grip1.position.set(-1.2, 0.3, 0);
        const grip2 = LiftModels.createGrip(); grip2.position.set(1.2, 0.3, 0);
        group.add(grip1, grip2);
        return group;
    },

    // Ultra Detailed Tramway (Pendelbahn)
    createTramway: (color, size) => {
        const group = new THREE.Group();
        const scales = { 50: 2, 100: 3, 150: 3.5, 200: 4 };
        const scale = scales[size] || 2;
        
        // Massive Carriage
        const carriage = new THREE.Group();
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 1.5), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
        carriage.add(chassis);
        for(let side of [-0.75, 0.75]) {
            for(let x of [-1.8, -0.6, 0.6, 1.8]) {
                const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x111 }));
                w.rotation.x = Math.PI/2; w.position.set(x, 0.4, side);
                carriage.add(w);
            }
        }
        carriage.position.y = 0.3;
        group.add(carriage);

        // Lattice hanger
        const hangerMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
        const hangerL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), hangerMat);
        hangerL.position.set(-0.5, -1.7, 0); hangerL.rotation.z = -0.1;
        const hangerR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), hangerMat);
        hangerR.position.set(0.5, -1.7, 0); hangerR.rotation.z = 0.1;
        group.add(hangerL, hangerR);

        // Aerodynamic Body
        const width = 3.8 * scale, height = 2.4 * scale, depth = 2.4 * scale;
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color: color, metalness: 0.4 }));
        cabin.position.y = -3.7 - height/2;
        group.add(cabin);

        // Seamless Glass
        const windows = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, height * 0.45, depth + 0.05), new THREE.MeshPhysicalMaterial({ color: 0x112233, transparent: true, opacity: 0.8, transmission: 0.5 }));
        windows.position.y = cabin.position.y + height * 0.1;
        group.add(windows);
        
        const hatch = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), new THREE.MeshStandardMaterial({ color: 0x222 }));
        hatch.position.set(0, cabin.position.y + height/2 + 0.05, 0);
        group.add(hatch);

        return group;
    },

    createDoubleDecker: (color) => {
        const group = LiftModels.createTramway(color, 200);
        const cabin = group.children.find(c => c.geometry.type === 'BoxGeometry' && c.material.color && c.material.color.getHex() === color);
        if(cabin) {
            cabin.material.metalness = 0.6;
            cabin.material.color.setHex(0xdddddd);
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(15.3, 0.8, 9.7), new THREE.MeshStandardMaterial({ color: 0xe53e3e }));
            stripe.position.copy(cabin.position);
            group.add(stripe);
            const winMat = new THREE.MeshPhysicalMaterial({ color: 0x050511, transparent: true, opacity: 0.85, transmission: 0.4 });
            const lowerW = new THREE.Mesh(new THREE.BoxGeometry(15.4, 3, 9.8), winMat);
            lowerW.position.set(0, cabin.position.y - 2.5, 0);
            const upperW = new THREE.Mesh(new THREE.BoxGeometry(15.4, 3, 9.8), winMat);
            upperW.position.set(0, cabin.position.y + 2.5, 0);
            group.add(lowerW, upperW);
        }
        return group;
    },

    createConveyor: (color) => {
        const group = new THREE.Group();
        const belt = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        belt.position.y = 0.5; group.add(belt);
        const mat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 5.8), new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 }));
        mat.position.y = 0.65; group.add(mat);
        return group;
    },
    createRope: (color) => {
        const group = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), new THREE.MeshStandardMaterial({ color: color }));
        handle.rotation.z = Math.PI / 2; handle.position.y = -0.8; group.add(handle);
        return group;
    },
    createPlatter: (color) => {
        const group = new THREE.Group();
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), new THREE.MeshStandardMaterial({ color: color }));
        plate.position.set(0, -2.1, 0.1); plate.rotation.x = Math.PI / 4; group.add(plate);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x666666 }));
        pole.position.y = -1; group.add(pole);
        return group;
    },
    createTBar: (color) => {
        const group = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), new THREE.MeshStandardMaterial({ color: color }));
        bar.rotation.z = Math.PI / 2; bar.position.y = -2.1; group.add(bar);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x666666 }));
        pole.position.y = -1; group.add(pole);
        return group;
    },
    createFunicular: (color) => {
        const group = new THREE.Group();
        const length = 12, width = 3.5, height = 3.5;
        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), new THREE.MeshStandardMaterial({ color: color }));
        body.position.y = 2; body.rotation.x = Math.PI / 8; group.add(body);
        const windows = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, height * 0.45, length * 0.95), new THREE.MeshPhysicalMaterial({ color: 0x111111, transparent: true, opacity: 0.8, metalness: 0.6 }));
        windows.position.y = 2.5; windows.rotation.x = Math.PI / 8; group.add(windows);
        return group;
    }
};

// Hauptklasse für Lifte
class SkiLift {
    constructor(type, startX, startZ, endX, endZ, scene, terrain) {
        this.type = type;
        this.config = LIFT_TYPES[type];
        this.startPos = { x: startX, z: startZ };
        this.endPos = { x: endX, z: endZ };
        this.scene = scene;
        this.terrain = terrain;
        
        this.length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
        this.height = 0;
        this.carriers = [];
        this.poles = [];
        this.group = new THREE.Group();
        
        this.build();
    }
    
    build() {
        this.buildStation(this.startPos.x, this.startPos.z, true);
        this.buildStation(this.endPos.x, this.endPos.z, false);
        
        if (this.config.category === 'funicular') {
            this.buildRails();
        } else {
            if (this.config.poleDistance > 0) this.buildPoles();
            this.buildCables();
        }
        
        this.buildCarriers();
        this.scene.add(this.group);
    }
    
    buildStation(x, z, isValley) {
        const stationGroup = new THREE.Group();
        const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
        const cat = this.config.category;
        
        const isDetachable = ['detachable', 'gondola', 'chondola', 'bicable', 'tricable', 'funitel'].includes(cat);
        const isFixed = cat === 'fixed';
        const isPendulum = cat === 'tramway';

        if (isDetachable) {
            // Ultra-Detailed Doppelmayr D-Line / UNI-G Terminal
            const width = 8, length = 18, height = 5;
            
            // Concrete base
            const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1.0 });
            const base = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 1.5, length - 2), concreteMat);
            base.position.set(0, y + 0.75, 0);
            stationGroup.add(base);
            
            // Turnstiles
            if (isValley) {
                for(let i=0; i<4; i++) {
                    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 1), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
                    gate.position.set(width/2 + 0.5, y + 2, -length/2 + 3 + i*1.5);
                    stationGroup.add(gate);
                }
            }

            // Sleek Sloped Polycarbonate Roof (D-Line shape)
            const profile = new THREE.Shape();
            profile.moveTo(-length/2, 0); 
            profile.lineTo(-length/2, height * 0.8); 
            profile.quadraticCurveTo(-length/2, height, -length/2 + 2, height); 
            profile.lineTo(length/2, height * 0.65); 
            profile.lineTo(length/2, 0); 

            const roofGeo = new THREE.ExtrudeGeometry(profile, { depth: width, bevelEnabled: true, bevelThickness: 0.2 });
            roofGeo.center(); 
            const shellMat = new THREE.MeshStandardMaterial({ color: this.config.color || 0x223344, roughness: 0.1, metalness: 0.6 });
            const roof = new THREE.Mesh(roofGeo, shellMat);
            roof.position.set(0, y + height/2 + 1.5, 0);
            roof.rotation.y = Math.PI / 2; // Orient along Z
            stationGroup.add(roof);

            // Side panoramic glass
            const glassGeo = new THREE.ExtrudeGeometry(profile, { depth: width * 1.02, bevelEnabled: false });
            glassGeo.center();
            const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x050505, transparent: true, opacity: 0.75, transmission: 0.5, metalness: 0.8 });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            glass.position.set(0, y + height/2 + 0.5, 0);
            glass.rotation.y = Math.PI / 2;
            glass.scale.set(1, 0.5, 1); // Only upper half is glass
            stationGroup.add(glass);
            
            // LED Screen on front (entrance side)
            const ledScreen = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.8, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffaa00, emissiveIntensity: 0.8 })
            );
            ledScreen.position.set(0, y + height - 0.5, -length/2 - 0.1);
            stationGroup.add(ledScreen);

            // Detailed Bullwheel
            const wheelGroup = new THREE.Group();
            const rim = new THREE.Mesh(new THREE.TorusGeometry(width/2 - 0.6, 0.2, 16, 32), new THREE.MeshStandardMaterial({ color: 0x992222, metalness: 0.8 }));
            rim.rotation.x = Math.PI/2; wheelGroup.add(rim);
            for(let i=0; i<6; i++) {
                const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, width - 1.2, 16), new THREE.MeshStandardMaterial({ color: 0x992222 }));
                spoke.rotation.z = Math.PI/2; spoke.rotation.y = (Math.PI / 3) * i; wheelGroup.add(spoke);
            }
            const motorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            motorHub.position.y = 0.5; wheelGroup.add(motorHub);
            
            // Emergeny drive (blue box)
            const emergDrive = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x2244cc }));
            emergDrive.position.set(1.2, 0.5, 0); wheelGroup.add(emergDrive);
            
            wheelGroup.position.set(0, y + height - 0.5, isValley ? length/4 : -length/4);
            stationGroup.add(wheelGroup);
            
            // Tension rails
            const railMat = new THREE.MeshStandardMaterial({ color: 0x555 });
            const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 6), railMat);
            rail1.position.set(-1.5, y + height - 1.2, wheelGroup.position.z + (isValley ? -2 : 2));
            const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 6), railMat);
            rail2.position.set(1.5, y + height - 1.2, wheelGroup.position.z + (isValley ? -2 : 2));
            stationGroup.add(rail1, rail2);
            
            // Tire conveyors (Reifenförderer)
            const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            for (let side of [-width/2 + 0.8, width/2 - 0.8]) {
                for (let zPos = -length/2 + 1; zPos < length/2; zPos += 0.8) {
                    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), tireMat);
                    tire.rotation.z = Math.PI/2; tire.position.set(side, y + height - 1.2, zPos);
                    stationGroup.add(tire);
                }
            }

            // Concrete Pillar
            const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, height, 16), concreteMat);
            pillar1.position.set(0, y + height/2, isValley ? length/4 : -length/4);
            stationGroup.add(pillar1);
            
            // Operator cabin
            const opCabin = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), new THREE.MeshStandardMaterial({ color: 0xAAAAAA }));
            opCabin.position.set(width/2 + 1, y + 3, 0);
            const opWin = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.5, 3.8), new THREE.MeshPhysicalMaterial({ color: 0x111111, transparent:true, opacity:0.8 }));
            opWin.position.copy(opCabin.position);
            stationGroup.add(opCabin, opWin);

        } else if (isFixed) {
            // Detailed Open Fixed Grip Station
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 6, 16), new THREE.MeshStandardMaterial({ color: 0x777777 }));
            pillar.position.set(0, y + 3, 0);
            stationGroup.add(pillar);

            const wheelGroup = new THREE.Group();
            const rim = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.2, 16, 32), new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.5 }));
            rim.rotation.x = Math.PI/2; wheelGroup.add(rim);
            for(let i=0; i<8; i++) {
                const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7, 16), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
                spoke.rotation.z = Math.PI/2; spoke.rotation.y = (Math.PI / 4) * i; wheelGroup.add(spoke);
            }
            const motor = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            motor.position.y = 1; wheelGroup.add(motor);
            wheelGroup.position.set(0, y + 6, 0);
            stationGroup.add(wheelGroup);

            if (isValley) {
                const carpet = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
                carpet.position.set(-3.5, y + 0.1, -4);
                stationGroup.add(carpet);
                const light = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), new THREE.MeshStandardMaterial({ color: 0x111 }));
                light.position.set(-1.5, y + 1.5, -6);
                const green = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0x22cc22, emissive: 0x22cc22 }));
                green.rotation.x = Math.PI/2; green.position.set(-1.5, y + 1.5, -5.7);
                stationGroup.add(light, green);
            }

        } else if (isPendulum) {
            const width = 16, length = 24, height = 15;
            const concrete = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1 });
            const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), concrete);
            base.position.set(0, y + height/2, 0);
            stationGroup.add(base);

            const portal = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, height * 0.8, length + 0.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            portal.position.set(0, y + height * 0.4, 0);
            stationGroup.add(portal);
            
            const saddle = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 2, 4), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
            saddle.position.set(0, y + height, isValley ? length/2 : -length/2);
            stationGroup.add(saddle);
        } else {
            // Surface Lifts
            const base = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 6), new THREE.MeshStandardMaterial({ color: 0xCCCCCC }));
            base.position.set(0, y + 0.5, 0);
            stationGroup.add(base);
            const motor = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 3), new THREE.MeshStandardMaterial({ color: 0x3355cc }));
            motor.position.set(0, y + 2, 0);
            stationGroup.add(motor);
            const bullwheel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x555555 }));
            bullwheel.position.set(0, y + 2.5, isValley ? 2 : -2);
            stationGroup.add(bullwheel);
        }

        stationGroup.position.set(x, 0, z);
        const targetX = isValley ? this.endPos.x : this.startPos.x;
        const targetZ = isValley ? this.endPos.z : this.startPos.z;
        stationGroup.lookAt(targetX, 0, targetZ); // +Z zeigt zur anderen Station
        this.group.add(stationGroup);
    }
    
    buildPoles() {
        const poleCount = Math.max(1, Math.floor(this.length / this.config.poleDistance));
        const dx = (this.endPos.x - this.startPos.x) / poleCount;
        const dz = (this.endPos.z - this.startPos.z) / poleCount;
        
        // FIXED 90-degree Rotation bug: 
        // angle from start to end in XZ plane
        const angle = Math.atan2(dx, dz);
        
        this.poles.push({ x: this.startPos.x, z: this.startPos.z, isStation: true });
        
        for (let i = 1; i < poleCount; i++) {
            const x = this.startPos.x + dx * i;
            const z = this.startPos.z + dz * i;
            const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
            
            // Calculate pitch angle for the sheaves (tilt to match cable slope)
            const nextX = this.startPos.x + dx * (i+1);
            const nextZ = this.startPos.z + dz * (i+1);
            const nextY = this.terrain ? this.terrain.getHeightAt(nextX, nextZ) : 0;
            const dist = Math.sqrt(dx*dx + dz*dz);
            const pitch = Math.atan2(nextY - y, dist);

            const { group, topHeight } = this.createPole(pitch);
            group.position.set(x, y, z);
            
            // No + Math.PI/2 here! The arm is constructed along X, and when angle=0 (pointing +Z), 
            // X is already perpendicular to Z.
            group.rotation.y = angle;
            
            this.group.add(group);
            this.poles.push({ x, y, z, topHeight: y + topHeight });
        }
        this.poles.push({ x: this.endPos.x, z: this.endPos.z, isStation: true });
    }
    
    // Ultra-Detailed Lift Tower
    createPole(pitch = 0) {
        const group = new THREE.Group();
        const cat = this.config.category;
        const isBig = ['gondola', 'chondola', 'tricable', 'bicable', 'funitel'].includes(cat);
        const isLattice = ['tramway', 'tricable', 'bicable'].includes(cat);
        const isFunitel = cat === 'funitel';

        const baseHeight = isLattice ? 18 : isBig ? 14 : cat === 'detachable' ? 12 : 8;
        const height = baseHeight + Math.random() * 3;
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x808588, metalness: 0.7, roughness: 0.4 });
        
        const topY = height + 2;
        const gauge = cat === 'surface' ? 1.5 : (this.config.seats > 4 || this.config.cabinSize > 8 ? 5.2 : 4.0);

        if (isLattice) {
            // LATTICE TOWER (Gittermast)
            const baseW = 6;
            const topW = 2;
            for (let dx of [-1, 1]) {
                for (let dz of [-1, 1]) {
                    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, height, 8), metalMat);
                    leg.position.set(dx * (baseW+topW)/4, height/2, dz * (baseW+topW)/4);
                    leg.rotation.z = dx * Math.atan((baseW - topW) / 2 / height);
                    leg.rotation.x = -dz * Math.atan((baseW - topW) / 2 / height);
                    group.add(leg);
                }
            }
            // Cross braces
            for (let yL = 2; yL < height; yL += 4) {
                const w = baseW - (baseW - topW) * (yL / height);
                const brace = new THREE.Mesh(new THREE.BoxGeometry(w*2, 0.1, w*2), new THREE.MeshStandardMaterial({ color: 0x555555, wireframe: true }));
                brace.position.y = yL;
                group.add(brace);
            }
        } else if (isFunitel) {
            // PORTAL TOWER (Funitel)
            const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, height, 16), metalMat);
            legL.position.set(-gauge/2 - 1, height/2, 0);
            const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, height, 16), metalMat);
            legR.position.set(gauge/2 + 1, height/2, 0);
            group.add(legL, legR);
        } else {
            // STANDARD TUBULAR TOWER
            const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2, 16), new THREE.MeshStandardMaterial({ color: 0x666666 }));
            pedestal.position.y = 1; group.add(pedestal);
            const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x333333 }));
            flange.position.y = 2.1; group.add(flange);
            
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, height, 16), metalMat);
            pole.position.y = height / 2 + 2; pole.castShadow = true; group.add(pole);
            
            // Ladder
            const lGrp = new THREE.Group();
            const rL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height, 8), metalMat); rL.position.set(-0.3, height/2+2, 0.6);
            const rR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height, 8), metalMat); rR.position.set(-0.1, height/2+2, 0.6);
            lGrp.add(rL, rR);
            for(let j=0; j<height; j+=0.3) {
                const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), metalMat);
                st.rotation.z = Math.PI/2; st.position.set(-0.2, j+2, 0.6); lGrp.add(st);
            }
            group.add(lGrp);
        }

        if (gauge > 0) {
            // Main Cross Arm
            const arm = new THREE.Mesh(new THREE.BoxGeometry(gauge + 2.0, 0.4, 0.5), metalMat);
            arm.position.y = topY; group.add(arm);
            
            // Catwalk & Railings
            const catwalk = new THREE.Mesh(new THREE.BoxGeometry(gauge + 1.8, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, transparent: true, opacity: 0.8 }));
            catwalk.position.set(0, topY - 0.25, 0.8); group.add(catwalk);
            const railing = new THREE.Mesh(new THREE.BoxGeometry(gauge + 1.8, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0xcc2222, wireframe: true }));
            railing.position.set(0, topY + 0.15, 1.4); group.add(railing);
            
            // Lifting Frames
            const liftingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
            liftingL.position.set(-gauge/2 - 0.4, topY + 0.75, 0);
            const liftingR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
            liftingR.position.set(gauge/2 + 0.4, topY + 0.75, 0);
            group.add(liftingL, liftingR);

            // Sheave Trains (Rollenbatterien) or Saddles
            if (cat === 'tramway') {
                // Curved Tramway Saddles
                for (let side of [-gauge/2, gauge/2]) {
                    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 4), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
                    saddle.position.set(side, topY + 0.4, 0);
                    saddle.rotation.x = -pitch; // Align with cable
                    group.add(saddle);
                }
            } else {
                // Wheels for gondolas/chairs
                const rollCount = isBig ? 8 : 4; 
                for (let side of [-gauge/2, gauge/2]) {
                    const assembly = new THREE.Group();
                    const mainBeam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, rollCount * 0.45), new THREE.MeshStandardMaterial({ color: 0xcccc00 }));
                    assembly.add(mainBeam);
                    
                    for(let w=0; w<rollCount; w++) {
                        const zPos = (w - (rollCount-1)/2) * 0.45;
                        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
                        tire.rotation.z = Math.PI/2; tire.position.set(0.1, 0.2, zPos);
                        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 }));
                        rim.rotation.z = Math.PI/2; rim.position.set(0.1, 0.2, zPos);
                        assembly.add(tire, rim);
                    }
                    
                    if (isFunitel) {
                        // Funitel has double sheave trains on each side!
                        const innerAssembly = assembly.clone();
                        innerAssembly.position.set(side - 1.4, topY, 0);
                        innerAssembly.rotation.x = -pitch; // TILT!
                        group.add(innerAssembly);
                        assembly.position.set(side + 1.4, topY, 0);
                    } else if (cat === 'tricable' || cat === 'bicable') {
                        // 3S has massive saddles + central wheel assembly
                        const saddleL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 3), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
                        saddleL.position.set(-0.3, 0.2, 0); assembly.add(saddleL);
                        const saddleR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 3), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
                        saddleR.position.set(0.3, 0.2, 0); assembly.add(saddleR);
                        assembly.position.set(side, topY, 0);
                    } else {
                        assembly.position.set(side, topY, 0);
                    }
                    
                    // TILT TO MATCH CABLE PITCH
                    assembly.rotation.x = -pitch;
                    
                    group.add(assembly);
                }
            }
        }
        return { group, topHeight: topY + 0.4 }; // +0.4 for wheel radius
    }
    
    buildCables() {
        const cat = this.config.category;
        const isSurface = cat === 'surface';
        const isPendulum = cat === 'tramway';
        const isFunitel = cat === 'funitel';
        
        const gauge = isPendulum ? 0 : isSurface ? 1.5 : (this.config.seats > 4 || this.config.cabinSize > 8 ? 5.2 : 4.0);
        let offsets = gauge > 0 ? [-gauge/2, gauge/2] : [0];
        
        if (isFunitel) {
            offsets = [-gauge/2 - 1.4, -gauge/2 + 1.4, gauge/2 - 1.4, gauge/2 + 1.4]; // 4 ropes total
        }
        
        if (this.poles.length <= 2 || isPendulum) {
            const cableHeight = isSurface ? 2 : 12;
            const startY = (this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0) + cableHeight;
            const endY = (this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0) + cableHeight;
            this.drawCableSegment(this.startPos.x, startY, this.startPos.z, this.endPos.x, endY, this.endPos.z, offsets);
        } else {
            for (let i = 0; i < this.poles.length - 1; i++) {
                const p1 = this.poles[i], p2 = this.poles[i+1];
                const y1 = p1.isStation ? (this.terrain ? this.terrain.getHeightAt(p1.x, p1.z) : 0) + (isSurface ? 2 : 12) : p1.topHeight;
                const y2 = p2.isStation ? (this.terrain ? this.terrain.getHeightAt(p2.x, p2.z) : 0) + (isSurface ? 2 : 12) : p2.topHeight;
                this.drawCableSegment(p1.x, y1, p1.z, p2.x, y2, p2.z, offsets);
            }
        }
    }
    
    drawCableSegment(x1, y1, z1, x2, y2, z2, offsets) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
        const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2, midZ = (z1 + z2) / 2;
        
        offsets.forEach(offset => {
            const cableGroup = new THREE.Group();
            const ropeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 });
            const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, length, 8), ropeMat);
            cableGroup.add(cable);
            
            if (['tricable', 'tramway'].includes(this.config.category)) {
                const track1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, length, 8), ropeMat);
                track1.position.set(-0.3, 0.2, 0);
                const track2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, length, 8), ropeMat);
                track2.position.set(0.3, 0.2, 0);
                cableGroup.add(track1, track2);
            }
            
            cableGroup.position.set(midX, midY, midZ);
            cableGroup.lookAt(new THREE.Vector3(x2, y2, z2));
            cableGroup.rotateX(Math.PI / 2);
            cableGroup.translateX(offset);
            this.group.add(cableGroup);
        });
    }

    buildRails() {
        const railCount = 50;
        const dx = (this.endPos.x - this.startPos.x) / railCount;
        const dz = (this.endPos.z - this.startPos.z) / railCount;
        
        for (let i = 0; i < railCount; i++) {
            const x = this.startPos.x + dx * i, z = this.startPos.z + dz * i;
            const nx = this.startPos.x + dx * (i+1), nz = this.startPos.z + dz * (i+1);
            const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
            const ny = this.terrain ? this.terrain.getHeightAt(nx, nz) : 0;
            
            const sleeper = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.5), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
            sleeper.position.set(x, y + 0.1, z);
            sleeper.lookAt(nx, ny, nz);
            this.group.add(sleeper);
            
            for (let side of [-1, 1]) {
                const track = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, Math.sqrt(dx*dx + dz*dz) + 0.1), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
                track.position.set(x + (dz/Math.sqrt(dx*dx+dz*dz))*side, y + 0.3, z - (dx/Math.sqrt(dx*dx+dz*dz))*side);
                track.lookAt(nx + (dz/Math.sqrt(dx*dx+dz*dz))*side, ny + 0.3, nz - (dx/Math.sqrt(dx*dx+dz*dz))*side);
                this.group.add(track);
            }
        }
    }
    
    buildCarriers() {
        if (['tramway', 'funicular'].includes(this.config.category)) {
            const c1 = LiftModels['create' + (this.config.model.charAt(0).toUpperCase() + this.config.model.slice(1))](this.config.color, this.config.cabinSize);
            const c2 = LiftModels['create' + (this.config.model.charAt(0).toUpperCase() + this.config.model.slice(1))](this.config.color, this.config.cabinSize);
            this.group.add(c1, c2);
            this.carriers.push({ mesh: c1, progress: 0, direction: 1 });
            this.carriers.push({ mesh: c2, progress: 1, direction: -1 });
        } else {
            const spacing = this.config.category === 'gondola' ? 35 : 25;
            const carrierCount = Math.max(4, Math.floor((this.length * 2) / spacing));
            
            for (let i = 0; i < carrierCount; i++) {
                let carrier;
                if(this.config.model === 'gondola') carrier = LiftModels.createGondola(this.config.color, this.config.cabinSize);
                else if(this.config.model === 'bigGondola') carrier = LiftModels.createBigGondola(this.config.color, this.config.cabinSize);
                else if(this.config.model === 'chair') carrier = LiftModels.createChair(this.config.color, this.config.seats, this.config.bubble);
                else carrier = LiftModels.createChair(this.config.color, 4, false); // Fallback
                
                this.group.add(carrier);
                this.carriers.push({ mesh: carrier, progress: i / carrierCount, direction: 1 });
            }
        }
    }
    
    update(deltaTime) {
        const speed = this.config.speed * 0.00001;
        const isPendulum = ['tramway', 'funicular'].includes(this.config.category);
        const isSurface = this.config.category === 'surface';
        const isFunicular = this.config.category === 'funicular';
        
        this.carriers.forEach(carrier => {
            if (isPendulum) {
                carrier.progress += speed * 2 * carrier.direction;
                if (carrier.progress >= 1) { carrier.progress = 1; carrier.direction = -1; }
                else if (carrier.progress <= 0) { carrier.progress = 0; carrier.direction = 1; }
                
                const x = this.startPos.x + (this.endPos.x - this.startPos.x) * carrier.progress;
                const z = this.startPos.z + (this.endPos.z - this.startPos.z) * carrier.progress;
                const startY = this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0;
                const endY = this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0;
                
                if (isFunicular) {
                    const y = this.terrain.getHeightAt(x, z);
                    carrier.mesh.position.set(x, y + 0.5, z);
                    const nextX = x + (this.endPos.x - this.startPos.x) * 0.01 * carrier.direction;
                    const nextZ = z + (this.endPos.z - this.startPos.z) * 0.01 * carrier.direction;
                    const nextY = this.terrain.getHeightAt(nextX, nextZ);
                    carrier.mesh.lookAt(nextX, nextY + 0.5, nextZ);
                } else {
                    const baseY = startY + (endY - startY) * carrier.progress + 14;
                    const sag = Math.sin(carrier.progress * Math.PI) * 1.5;
                    carrier.mesh.position.set(x, baseY - sag - 2, z);
                    carrier.mesh.rotation.y = Math.atan2(this.endPos.x - this.startPos.x, this.endPos.z - this.startPos.z);
                }
            } else {
                carrier.progress += speed;
                if (carrier.progress >= 1) carrier.progress -= 1;
                
                const isGoingUp = carrier.progress < 0.5;
                const actProgress = isGoingUp ? (carrier.progress * 2) : (1 - (carrier.progress - 0.5) * 2);
                
                const x = this.startPos.x + (this.endPos.x - this.startPos.x) * actProgress;
                const z = this.startPos.z + (this.endPos.z - this.startPos.z) * actProgress;
                
                let baseY = 0;
                if (this.poles.length > 2) {
                    const idx = Math.floor(actProgress * (this.poles.length - 1));
                    const p1 = this.poles[idx], p2 = this.poles[idx + 1];
                    const localProg = (actProgress * (this.poles.length - 1)) - idx;
                    const y1 = p1.isStation ? (this.terrain ? this.terrain.getHeightAt(p1.x, p1.z) : 0) + (isSurface ? 2 : 12) : p1.topHeight;
                    const y2 = p2.isStation ? (this.terrain ? this.terrain.getHeightAt(p2.x, p2.z) : 0) + (isSurface ? 2 : 12) : p2.topHeight;
                    baseY = y1 + (y2 - y1) * localProg;
                } else {
                    const cableHeight = isSurface ? 2 : 12;
                    const startY = this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0;
                    const endY = this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0;
                    baseY = startY + (endY - startY) * actProgress + cableHeight;
                }
                
                const sag = isSurface ? 0 : Math.sin(actProgress * Math.PI) * 1.5;
                const y = baseY - sag - (isSurface ? 0.5 : 2);
                const gauge = isSurface ? 1.5 : (this.config.seats > 4 || this.config.cabinSize > 8 ? 5.2 : 4.0);
                const dx = this.endPos.x - this.startPos.x, dz = this.endPos.z - this.startPos.z;
                const len = Math.sqrt(dx*dx + dz*dz);
                const sideDir = isGoingUp ? 1 : -1;
                
                carrier.mesh.position.set(x + (-dz/len) * (gauge / 2) * sideDir, y, z + (dx/len) * (gauge / 2) * sideDir);
                carrier.mesh.rotation.y = isGoingUp ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
            }
        });
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { LIFT_TYPES, SkiLift };