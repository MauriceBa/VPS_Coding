/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Alle Lifte (realistische Skilift-Typen)
 */

const LIFT_TYPES = {
    // ========== SURFACE LIFTS ==========
    magicCarpet: {
        name: '✨ Magic Carpet',
        category: 'surface',
        cost: 15000,
        capacity: 1200, 
        speed: 3, 
        maxLength: 100,
        maxHeight: 20,
        description: 'Conveyor belt for beginners and kids',
        color: 0xFF6B6B,
        poleDistance: 20,
        model: 'conveyor'
    },
    
    ropeTow: {
        name: '🪢 Rope Tow',
        category: 'surface',
        cost: 8000,
        capacity: 600,
        speed: 10,
        maxLength: 300,
        maxHeight: 50,
        description: 'Simple rope tow for 1 person',
        color: 0xFFA500,
        poleDistance: 25,
        model: 'rope'
    },
    
    platterLift: {
        name: '🍽️ Platter Lift',
        category: 'surface',
        cost: 10000,
        capacity: 800,
        speed: 12,
        maxLength: 400,
        maxHeight: 80,
        description: 'Platter to clamp between the legs',
        color: 0x9B59B6,
        poleDistance: 20,
        model: 'platter'
    },
    
    tbar: {
        name: '🎿 T-Bar',
        category: 'surface',
        cost: 12000,
        capacity: 1000,
        speed: 14,
        maxLength: 500,
        maxHeight: 120,
        description: 'T-shaped bar for 1-2 people',
        color: 0xE74C3C,
        poleDistance: 18,
        model: 'tbar'
    },
    
    // ========== FIXED GRIP CHAIRLIFTS ==========
    chair1Fixed: {
        name: '🪑 1-Seater Chair (fixed)',
        category: 'fixed',
        cost: 25000,
        capacity: 800,
        speed: 10,
        maxLength: 800,
        maxHeight: 250,
        description: 'Classic single chair',
        color: 0x3498DB,
        poleDistance: 35,
        seats: 1,
        model: 'chair',
        bubble: false
    },
    
    chair2Fixed: {
        name: '🪑🪑 2-Seater Chair (fixed)',
        category: 'fixed',
        cost: 35000,
        capacity: 1200,
        speed: 12,
        maxLength: 1200,
        maxHeight: 350,
        description: 'Two-seater chair with fixed grip',
        color: 0x2980B9,
        poleDistance: 40,
        seats: 2,
        model: 'chair',
        bubble: false
    },
    
    chair3Fixed: {
        name: '🪑🪑🪑 3-Seater Chair (fixed)',
        category: 'fixed',
        cost: 45000,
        capacity: 1500,
        speed: 12,
        maxLength: 1400,
        maxHeight: 400,
        description: 'Three-seater chair',
        color: 0x1ABC9C,
        poleDistance: 45,
        seats: 3,
        model: 'chair',
        bubble: false
    },
    
    chair4Fixed: {
        name: '🪑×4 4-Seater Chair (fixed)',
        category: 'fixed',
        cost: 55000,
        capacity: 1800,
        speed: 13,
        maxLength: 1600,
        maxHeight: 500,
        description: 'Four-seater chair - workhorse of the Alps',
        color: 0x16A085,
        poleDistance: 50,
        seats: 4,
        model: 'chair',
        bubble: false
    },
    
    chair6Fixed: {
        name: '🪑×6 6-Seater Chair (fixed)',
        category: 'fixed',
        cost: 70000,
        capacity: 2200,
        speed: 14,
        maxLength: 1800,
        maxHeight: 600,
        description: 'Six-seater with fixed grip',
        color: 0x27AE60,
        poleDistance: 55,
        seats: 6,
        model: 'chair',
        bubble: false
    },
    
    // ========== DETACHABLE CHAIRLIFTS ==========
    chair2Detach: {
        name: '⚡ 2-Seater Chair (detachable)',
        category: 'detachable',
        cost: 60000,
        capacity: 1600,
        speed: 18,
        maxLength: 2000,
        maxHeight: 700,
        description: 'Detachable two-seater chair',
        color: 0xF39C12,
        poleDistance: 60,
        seats: 2,
        model: 'chair',
        bubble: false
    },
    
    chair3Detach: {
        name: '⚡⚡ 3-Seater Chair (detachable)',
        category: 'detachable',
        cost: 75000,
        capacity: 2000,
        speed: 18,
        maxLength: 2200,
        maxHeight: 800,
        description: 'Detachable three-seater chair',
        color: 0xE67E22,
        poleDistance: 65,
        seats: 3,
        model: 'chair',
        bubble: false
    },
    
    chair4Detach: {
        name: '⚡⚡⚡ 4-Seater Chair (detachable)',
        category: 'detachable',
        cost: 90000,
        capacity: 2400,
        speed: 20,
        maxLength: 2500,
        maxHeight: 900,
        description: 'Detachable four-seater chair',
        color: 0xD35400,
        poleDistance: 70,
        seats: 4,
        model: 'chair',
        bubble: true
    },
    
    chair6Detach: {
        name: '⚡⚡⚡⚡ 6-Seater Chair (detachable)',
        category: 'detachable',
        cost: 120000,
        capacity: 3200,
        speed: 22,
        maxLength: 3000,
        maxHeight: 1100,
        description: 'Modern six-seater with bubble',
        color: 0xC0392B,
        poleDistance: 85,
        seats: 6,
        model: 'chair',
        bubble: true
    },
    
    chair8Detach: {
        name: '⚡⚡⚡⚡⚡ 8-Seater Chair (detachable)',
        category: 'detachable',
        cost: 150000,
        capacity: 4000,
        speed: 24,
        maxLength: 3500,
        maxHeight: 1300,
        description: 'High-performance eight-seater',
        color: 0x8E44AD,
        poleDistance: 100,
        seats: 8,
        model: 'chair',
        bubble: true
    },
    
    // ========== GONDOLAS ==========
    gondola4: {
        name: '🚠 Gondola 1S 4P',
        category: 'gondola',
        cost: 100000,
        capacity: 1600,
        speed: 18,
        maxLength: 3000,
        maxHeight: 1000,
        description: '4-person gondola',
        color: 0xF1C40F,
        poleDistance: 80,
        cabinSize: 4,
        model: 'gondola'
    },
    
    gondola6: {
        name: '🚠 Gondola 1S 6P',
        category: 'gondola',
        cost: 120000,
        capacity: 2000,
        speed: 20,
        maxLength: 3500,
        maxHeight: 1200,
        description: '6-person gondola',
        color: 0xF39C12,
        poleDistance: 90,
        cabinSize: 6,
        model: 'gondola'
    },
    
    gondola8: {
        name: '🚠 Gondola 1S 8P',
        category: 'gondola',
        cost: 140000,
        capacity: 2400,
        speed: 20,
        maxLength: 4000,
        maxHeight: 1400,
        description: '8-person gondola',
        color: 0xE67E22,
        poleDistance: 100,
        cabinSize: 8,
        model: 'gondola'
    },
    
    gondola10: {
        name: '🚠 Gondola 1S 10P',
        category: 'gondola',
        cost: 160000,
        capacity: 2800,
        speed: 22,
        maxLength: 4500,
        maxHeight: 1600,
        description: '10-person gondola',
        color: 0xD35400,
        poleDistance: 110,
        cabinSize: 10,
        model: 'gondola'
    },
    
    gondola12: {
        name: '🚠 Gondola 1S 12P',
        category: 'gondola',
        cost: 180000,
        capacity: 3200,
        speed: 22,
        maxLength: 5000,
        maxHeight: 1800,
        description: '12-person gondola',
        color: 0xE74C3C,
        poleDistance: 120,
        cabinSize: 12,
        model: 'gondola'
    },
    
    // ========== BICABLE/TRICABLE ==========
    gondola2S18: {
        name: '🚡 Gondola 2S 18P',
        category: 'bicable',
        cost: 250000,
        capacity: 2000,
        speed: 25,
        maxLength: 6000,
        maxHeight: 2000,
        description: 'Bicable gondola (18P)',
        color: 0x9B59B6,
        poleDistance: 150,
        cabinSize: 18,
        model: 'bigGondola'
    },
    
    gondola3S35: {
        name: '🚡 Gondola 3S 35P',
        category: 'tricable',
        cost: 400000,
        capacity: 2500,
        speed: 28,
        maxLength: 8000,
        maxHeight: 2500,
        description: 'Tricable gondola (35P)',
        color: 0x8E44AD,
        poleDistance: 200,
        cabinSize: 35,
        model: 'bigGondola'
    },
    
    funitel: {
        name: '🚡 Funitel 30P',
        category: 'funitel',
        cost: 350000,
        capacity: 3000,
        speed: 27,
        maxLength: 7000,
        maxHeight: 2200,
        description: 'Funitel - dual loop',
        color: 0x1ABC9C,
        poleDistance: 180,
        cabinSize: 30,
        model: 'funitel'
    },
    
    // ========== AERIAL TRAMWAY / PENDELBAHN ==========
    tramway50: {
        name: '🚠 Aerial Tramway 50P',
        category: 'tramway',
        cost: 500000,
        capacity: 800,
        speed: 35,
        maxLength: 10000,
        maxHeight: 3000,
        description: 'Large aerial tramway (50P)',
        color: 0xE91E63,
        poleDistance: 0, 
        cabinSize: 50,
        model: 'tramway'
    },
    
    tramway100: {
        name: '🚠 Aerial Tramway 100P',
        category: 'tramway',
        cost: 800000,
        capacity: 1200,
        speed: 40,
        maxLength: 12000,
        maxHeight: 3500,
        description: 'Giant aerial tramway (100P)',
        color: 0xAD1457,
        poleDistance: 0,
        cabinSize: 100,
        model: 'tramway'
    },
    
    tramway150: {
        name: '🚠 Aerial Tramway 150P',
        category: 'tramway',
        cost: 1200000,
        capacity: 1600,
        speed: 42,
        maxLength: 15000,
        maxHeight: 4000,
        description: 'Mega aerial tramway (150P)',
        color: 0x880E4F,
        poleDistance: 0,
        cabinSize: 150,
        model: 'tramway'
    },
    
    tramway200: {
        name: '🚠 Aerial Tramway 200P (Double Decker!)',
        category: 'tramway',
        cost: 2000000,
        capacity: 2400,
        speed: 45,
        maxLength: 20000,
        maxHeight: 4500,
        description: 'VANOISE EXPRESS Style - Double Decker!',
        color: 0x4A148C,
        poleDistance: 0,
        cabinSize: 200,
        model: 'doubleDecker'
    },
    
    // ========== CHONDOLA ==========
    chondola: {
        name: '🚠+🪑 Chondola',
        category: 'chondola',
        cost: 180000,
        capacity: 2800,
        speed: 21,
        maxLength: 2800,
        maxHeight: 1200,
        description: 'Mix of 6-seater chair and 10P gondola',
        color: 0x00BCD4,
        poleDistance: 75,
        model: 'chondola'
    },
    
    // ========== RAIL-BASED ==========
    funicular: {
        name: '🚞 Funicular',
        category: 'funicular',
        cost: 600000,
        capacity: 1000,
        speed: 15,
        maxLength: 5000,
        maxHeight: 1500,
        description: 'Rail-based funicular',
        color: 0x795548,
        poleDistance: 0,
        model: 'funicular'
    },
    
    undergroundFunicular: {
        name: '🚇 Underground Funicular',
        category: 'funicular',
        cost: 1500000,
        capacity: 1500,
        speed: 20,
        maxLength: 8000,
        maxHeight: 2000,
        description: 'Underground funicular',
        color: 0x5D4037,
        poleDistance: 0,
        model: 'underground'
    },
    
    inclinedElevator: {
        name: '🛗 Inclined Elevator',
        category: 'funicular',
        cost: 400000,
        capacity: 600,
        speed: 12,
        maxLength: 2000,
        maxHeight: 800,
        description: 'Inclined elevator',
        color: 0x607D8B,
        poleDistance: 0,
        model: 'funicular'
    }
};

// Verbesserte, runde Modelle
const LiftModels = {
    // Utility für runde Kabinen
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

    // Surface Lifts
    createConveyor: (color) => {
        const group = new THREE.Group();
        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        belt.position.y = 0.5;
        group.add(belt);
        
        const mat = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.05, 5.8),
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.9 })
        );
        mat.position.y = 0.65;
        group.add(mat);
        
        for (let side of [-1.2, 1.2]) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 1.2, 6),
                new THREE.MeshStandardMaterial({ color: 0x666666 })
            );
            rail.position.set(side, 1, 0);
            group.add(rail);
        }
        return group;
    },
    
    createRope: (color) => {
        const group = new THREE.Group();
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: color })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.y = -0.8;
        group.add(handle);
        
        const rope = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 2, 4),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        group.add(rope);
        return group;
    },
    
    createPlatter: (color) => {
        const group = new THREE.Group();
        const plate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
            new THREE.MeshStandardMaterial({ color: color })
        );
        plate.position.set(0, -2.1, 0.1);
        plate.rotation.x = Math.PI / 4;
        group.add(plate);
        
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        pole.position.y = -1;
        group.add(pole);
        return group;
    },
    
    createTBar: (color) => {
        const group = new THREE.Group();
        const bar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: color })
        );
        bar.rotation.z = Math.PI / 2;
        bar.position.y = -2.1;
        group.add(bar);
        
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        pole.position.y = -1;
        group.add(pole);
        return group;
    },
    
    // Modern Chairlifts
    createChair: (color, seats, hasBubble) => {
        const group = new THREE.Group();
        const seatWidth = seats * 0.55;
        
        // Curved frame pipe
        const frame = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        frame.position.y = -1;
        group.add(frame);
        
        // Seat & Backrest
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(seatWidth, 0.08, 0.5),
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 })
        );
        seat.position.set(0, -2.1, 0.1);
        group.add(seat);
        
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(seatWidth, 0.5, 0.08),
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 })
        );
        back.position.set(0, -1.8, -0.15);
        group.add(back);
        
        // Safety bar
        const safetyBar = new THREE.Group();
        const bar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, seatWidth, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, -1.7, 0.35); // closed state
        safetyBar.add(bar);
        
        // Footrests
        for (let i = 0; i < seats; i++) {
            const skiRest = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            skiRest.rotation.z = Math.PI / 2;
            skiRest.position.set(-seatWidth/2 + 0.275 + i*0.55, -2.25, 0.35);
            safetyBar.add(skiRest);
        }
        group.add(safetyBar);
        
        if (hasBubble) {
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(seatWidth * 0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI/2),
                new THREE.MeshPhysicalMaterial({ 
                    color: 0xFFAA00,
                    transparent: true,
                    opacity: 0.3,
                    transmission: 0.9,
                    roughness: 0.1,
                    thickness: 0.05,
                    side: THREE.DoubleSide
                })
            );
            dome.position.set(0, -1.8, 0.1);
            dome.rotation.x = -Math.PI / 8; // Half closed
            group.add(dome);
        }
        return group;
    },
    
    // Rounded Gondolas
    createGondola: (color, size) => {
        const group = new THREE.Group();
        const scales = { 4: 1, 6: 1.2, 8: 1.4, 10: 1.6, 12: 1.8, 18: 2.2, 35: 3 };
        const scale = scales[size] || 1;
        
        const hanger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        hanger.position.y = -0.5;
        group.add(hanger);
        
        // Rounded Cabin
        const width = 1.6 * scale, height = 2.0 * scale, depth = 1.4 * scale, radius = 0.3 * scale;
        const shape = LiftModels.createRoundedShape(width, height, radius);
        const cabinGeo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false });
        cabinGeo.center();
        
        const cabin = new THREE.Mesh(
            cabinGeo,
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.2 })
        );
        cabin.position.y = -1.8 * scale;
        cabin.castShadow = true;
        group.add(cabin);
        
        // Window wrap
        const winShape = LiftModels.createRoundedShape(width * 0.95, height * 0.45, radius * 0.8);
        const winGeo = new THREE.ExtrudeGeometry(winShape, { depth: depth * 1.05, bevelEnabled: false });
        winGeo.center();
        const windowBand = new THREE.Mesh(
            winGeo,
            new THREE.MeshPhysicalMaterial({ color: 0x111111, transparent: true, opacity: 0.7, transmission: 0.5 })
        );
        windowBand.position.y = -1.6 * scale;
        group.add(windowBand);
        
        return group;
    },
    
    createBigGondola: (color, size) => {
        const group = LiftModels.createGondola(color, size);
        // Add double suspension arms
        const crossbar = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.1, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        crossbar.position.y = -0.3;
        group.add(crossbar);
        return group;
    },
    
    createFunitel: (color, size) => {
        const group = LiftModels.createGondola(color, 15);
        const upper = LiftModels.createGondola(color, 15);
        upper.position.y = 2.5;
        group.add(upper);
        return group;
    },
    
    createTramway: (color, size) => {
        const group = new THREE.Group();
        const scales = { 50: 2, 100: 3, 150: 3.5, 200: 4 };
        const scale = scales[size] || 2;
        
        // Huge hanger
        const hanger = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 3, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        hanger.position.y = -1;
        group.add(hanger);

        // Body
        const width = 3 * scale;
        const height = 2.2 * scale;
        const depth = 2 * scale;
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color: color })
        );
        cabin.position.y = -2.5 - height/2;
        group.add(cabin);

        // Windows
        const windows = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.1, height * 0.4, depth + 0.1),
            new THREE.MeshPhysicalMaterial({ color: 0x111111, transparent: true, opacity: 0.6 })
        );
        windows.position.y = cabin.position.y + height * 0.1;
        group.add(windows);

        return group;
    },
    
    createDoubleDecker: (color) => {
        const group = new THREE.Group();
        // VANOISE EXPRESS STYLE
        const hanger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        hanger.position.y = -1;
        group.add(hanger);
        
        const width = 12;
        const height = 8;
        const depth = 6;
        
        // Base structure
        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = -6;
        group.add(body);
        
        // Color accents
        const stripeGeo = new THREE.BoxGeometry(width + 0.1, 1, depth + 0.1);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xe53e3e });
        const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe1.position.y = -6;
        group.add(stripe1);
        
        // Lower windows
        const windowGeo = new THREE.BoxGeometry(width + 0.2, 2.5, depth + 0.2);
        const winMat = new THREE.MeshPhysicalMaterial({ color: 0x112233, transparent: true, opacity: 0.8 });
        const lowerWins = new THREE.Mesh(windowGeo, winMat);
        lowerWins.position.y = -8;
        group.add(lowerWins);
        
        // Upper windows
        const upperWins = new THREE.Mesh(windowGeo, winMat);
        upperWins.position.y = -4;
        group.add(upperWins);
        
        return group;
    },
    
    createFunicular: (color) => {
        const group = new THREE.Group();
        // Sloped carriage for funicular
        const length = 10;
        const width = 3;
        const height = 3;
        
        // Create a staircase-like base
        const bodyGeo = new THREE.BoxGeometry(width, height, length);
        const body = new THREE.Mesh(
            bodyGeo,
            new THREE.MeshStandardMaterial({ color: color })
        );
        body.position.y = 2;
        
        // Angle the funicular to match average slope (about 20-30 degrees)
        body.rotation.x = Math.PI / 8;
        group.add(body);
        
        // Windows
        const windows = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.2, height * 0.4, length * 0.9),
            new THREE.MeshPhysicalMaterial({ color: 0x222222, transparent: true, opacity: 0.7 })
        );
        windows.position.y = 2.5;
        windows.rotation.x = Math.PI / 8;
        group.add(windows);
        
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
        this.poles = []; // Speichere Stützenpositionen
        this.group = new THREE.Group();
        
        this.build();
    }
    
    build() {
        // Stationen aufbauen (sie zeigen automatisch aufeinander)
        this.buildStation(this.startPos.x, this.startPos.z, true);
        this.buildStation(this.endPos.x, this.endPos.z, false);
        
        if (this.config.category === 'funicular') {
            this.buildRails();
        } else {
            if (this.config.poleDistance > 0) {
                this.buildPoles();
            }
            this.buildCables();
        }
        
        this.buildCarriers();
        this.scene.add(this.group);
    }
    
    buildStation(x, z, isValley) {
        const stationGroup = new THREE.Group();
        const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
        
        const isBigStation = ['tramway', 'bicable', 'tricable', 'funitel', 'funicular'].includes(this.config.category);
        const isSurface = this.config.category === 'surface';
        
        const width = isBigStation ? 12 : isSurface ? 4 : 8;
        const depth = isBigStation ? 14 : isSurface ? 6 : 10;
        const height = isValley ? 4 : 5;
        
        // Base Platform
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(width, 1, depth),
            new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.9 })
        );
        platform.position.y = y + 0.5;
        platform.receiveShadow = true;
        stationGroup.add(platform);
        
        if (!isSurface) {
            // Modern rounded roof
            const roofShape = new THREE.Shape();
            roofShape.absarc(0, 0, width/2, 0, Math.PI, false);
            
            const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
                depth: depth,
                bevelEnabled: false,
                curveSegments: 16
            });
            roofGeo.center();
            
            const roof = new THREE.Mesh(
                roofGeo,
                new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.3, roughness: 0.6 })
            );
            roof.position.set(0, y + height, 0);
            stationGroup.add(roof);
            
            // Support Pillars
            for (let px of [-width/2 + 0.5, width/2 - 0.5]) {
                for (let pz of [-depth/2 + 1, depth/2 - 1]) {
                    const pillar = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.3, 0.3, height - 0.5, 8),
                        new THREE.MeshStandardMaterial({ color: 0x555555 })
                    );
                    pillar.position.set(px, y + height/2 + 0.25, pz);
                    stationGroup.add(pillar);
                }
            }
        }
        
        // Drive Wheel
        const driveWheel = new THREE.Mesh(
            new THREE.CylinderGeometry(isBigStation ? 3 : 2, isBigStation ? 3 : 2, 0.4, 32),
            new THREE.MeshStandardMaterial({ color: 0x992222, metalness: 0.6, roughness: 0.4 })
        );
        driveWheel.position.set(0, y + height - 1, isValley ? depth/2 - 2 : -depth/2 + 2);
        stationGroup.add(driveWheel);
        
        stationGroup.position.set(x, 0, z);
        
        // Station ausrichten, dass sie zur anderen Station zeigt
        const targetX = isValley ? this.endPos.x : this.startPos.x;
        const targetZ = isValley ? this.endPos.z : this.startPos.z;
        stationGroup.lookAt(targetX, 0, targetZ);
        
        this.group.add(stationGroup);
    }
    
    buildPoles() {
        const poleCount = Math.max(1, Math.floor(this.length / this.config.poleDistance));
        const dx = (this.endPos.x - this.startPos.x) / poleCount;
        const dz = (this.endPos.z - this.startPos.z) / poleCount;
        const angle = Math.atan2(dx, dz);
        
        this.poles.push({ x: this.startPos.x, z: this.startPos.z, isStation: true });
        
        for (let i = 1; i < poleCount; i++) {
            const x = this.startPos.x + dx * i;
            const z = this.startPos.z + dz * i;
            const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
            
            const { group, topHeight } = this.createPole();
            group.position.set(x, y, z);
            group.rotation.y = angle + Math.PI / 2;
            
            this.group.add(group);
            this.poles.push({ x, y, z, topHeight: y + topHeight });
        }
        
        this.poles.push({ x: this.endPos.x, z: this.endPos.z, isStation: true });
    }
    
    createPole() {
        const group = new THREE.Group();
        const baseHeight = this.config.category === 'gondola' ? 12 : 
                          this.config.category === 'detachable' ? 10 : 
                          this.config.category === 'surface' ? 4 : 8;
        const height = baseHeight + Math.random() * 2;
        
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(this.config.category === 'surface' ? 0.15 : 0.3, 0.4, height, 8),
            new THREE.MeshStandardMaterial({ color: 0x718096, metalness: 0.4 })
        );
        pole.position.y = height / 2;
        pole.castShadow = true;
        group.add(pole);
        
        const isSurface = this.config.category === 'surface';
        const gauge = isSurface ? 1.5 : (this.config.seats > 4 || this.config.cabinSize > 8 ? 4.5 : 3.5);
        
        if (gauge > 0) {
            const arm = new THREE.Mesh(
                new THREE.BoxGeometry(gauge + 1.0, 0.2, 0.2),
                new THREE.MeshStandardMaterial({ color: 0x4a5568 })
            );
            arm.position.y = height - 0.5;
            group.add(arm);
            
            for (let side of [-gauge/2, gauge/2]) {
                const wheelAssembly = new THREE.Group();
                const bracket = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.3, 1.2),
                    new THREE.MeshStandardMaterial({ color: 0x888888 })
                );
                wheelAssembly.add(bracket);
                wheelAssembly.position.set(side, height - 0.5, 0);
                group.add(wheelAssembly);
            }
        }
        return { group, topHeight: height - 0.5 };
    }
    
    buildCables() {
        const isSurface = this.config.category === 'surface';
        const isPendulum = this.config.category === 'tramway';
        const gauge = isPendulum ? 0 : isSurface ? 1.5 : (this.config.seats > 4 || this.config.cabinSize > 8 ? 4.5 : 3.5);
        const offsets = gauge > 0 ? [-gauge/2, gauge/2] : [0];
        
        // Pendelbahnen hängen meist ohne Stützen frei (Start zu Ende)
        if (this.poles.length <= 2 || isPendulum) {
            const cableHeight = isSurface ? 2 : 10;
            const startY = (this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0) + cableHeight;
            const endY = (this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0) + cableHeight;
            this.drawCableSegment(this.startPos.x, startY, this.startPos.z, this.endPos.x, endY, this.endPos.z, offsets);
        } else {
            // Mit Stützen: Kabel von Stütze zu Stütze ziehen
            for (let i = 0; i < this.poles.length - 1; i++) {
                const p1 = this.poles[i];
                const p2 = this.poles[i+1];
                
                const y1 = p1.isStation ? (this.terrain ? this.terrain.getHeightAt(p1.x, p1.z) : 0) + (isSurface ? 2 : 10) : p1.topHeight;
                const y2 = p2.isStation ? (this.terrain ? this.terrain.getHeightAt(p2.x, p2.z) : 0) + (isSurface ? 2 : 10) : p2.topHeight;
                
                this.drawCableSegment(p1.x, y1, p1.z, p2.x, y2, p2.z, offsets);
            }
        }
    }
    
    drawCableSegment(x1, y1, z1, x2, y2, z2, offsets) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const midZ = (z1 + z2) / 2;
        
        offsets.forEach(offset => {
            const cableGroup = new THREE.Group();
            const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, length, 8);
            const cableMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 });
            const cable = new THREE.Mesh(cableGeo, cableMat);
            cableGroup.add(cable);
            
            if (['gondola', 'bicable', 'tricable', 'funitel'].includes(this.config.category)) {
                const haulRope = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.06, length, 8),
                    new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 })
                );
                haulRope.position.set(0, -0.4, 0);
                cableGroup.add(haulRope);
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
            const x = this.startPos.x + dx * i;
            const z = this.startPos.z + dz * i;
            const nx = this.startPos.x + dx * (i+1);
            const nz = this.startPos.z + dz * (i+1);
            
            const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
            const ny = this.terrain ? this.terrain.getHeightAt(nx, nz) : 0;
            
            // Draw a sleeper (Schwellen)
            const sleeper = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.2, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x5c4033 })
            );
            sleeper.position.set(x, y + 0.1, z);
            sleeper.lookAt(nx, ny, nz);
            this.group.add(sleeper);
            
            // Left & Right Rails
            for (let side of [-1, 1]) {
                const track = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 0.2, Math.sqrt(dx*dx + dz*dz) + 0.1),
                    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
                );
                track.position.set(x + (dz/Math.sqrt(dx*dx+dz*dz))*side, y + 0.3, z - (dx/Math.sqrt(dx*dx+dz*dz))*side);
                track.lookAt(nx + (dz/Math.sqrt(dx*dx+dz*dz))*side, ny + 0.3, nz - (dx/Math.sqrt(dx*dx+dz*dz))*side);
                this.group.add(track);
            }
        }
    }
    
    buildCarriers() {
        if (['tramway', 'funicular'].includes(this.config.category)) {
            const c1 = this.createCarrierMesh();
            const c2 = this.createCarrierMesh();
            this.group.add(c1, c2);
            this.carriers.push({ mesh: c1, progress: 0, direction: 1 });
            this.carriers.push({ mesh: c2, progress: 1, direction: -1 });
        } else {
            const spacing = this.type === 'chondola' ? 35 : this.config.category === 'gondola' ? 30 : 20;
            const carrierCount = Math.max(4, Math.floor((this.length * 2) / spacing));
            
            for (let i = 0; i < carrierCount; i++) {
                const isGondola = this.type === 'chondola' && i % 4 === 0;
                const carrier = this.createCarrierMesh(isGondola);
                this.group.add(carrier);
                this.carriers.push({ mesh: carrier, progress: i / carrierCount, direction: 1 });
            }
        }
    }
    
    createCarrierMesh(forceGondola = false) {
        const model = forceGondola ? 'gondola' : this.config.model;
        const color = this.config.color;
        const size = this.config.cabinSize || this.config.seats || 4;
        
        switch(model) {
            case 'conveyor': return LiftModels.createConveyor(color);
            case 'rope': return LiftModels.createRope(color);
            case 'platter': return LiftModels.createPlatter(color);
            case 'tbar': return LiftModels.createTBar(color);
            case 'chair': return LiftModels.createChair(color, size, this.config.bubble);
            case 'gondola': return LiftModels.createGondola(color, size);
            case 'bigGondola': return LiftModels.createBigGondola(color, size);
            case 'funitel': return LiftModels.createFunitel(color, size);
            case 'tramway': return LiftModels.createTramway(color, size);
            case 'doubleDecker': return LiftModels.createDoubleDecker(color);
            case 'funicular': case 'underground': return LiftModels.createFunicular(color);
            case 'elevator': return LiftModels.createFunicular(color);
            case 'chondola': return LiftModels.createChair(color, 6, true);
            default: return LiftModels.createChair(color, 4, false);
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
                
                // Get accurate terrain height or use straight line for tramway
                const startY = this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0;
                const endY = this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0;
                
                if (isFunicular) {
                    const y = this.terrain.getHeightAt(x, z);
                    carrier.mesh.position.set(x, y + 0.5, z);
                    
                    // Angle match
                    const nextX = x + (this.endPos.x - this.startPos.x) * 0.01 * carrier.direction;
                    const nextZ = z + (this.endPos.z - this.startPos.z) * 0.01 * carrier.direction;
                    const nextY = this.terrain.getHeightAt(nextX, nextZ);
                    carrier.mesh.lookAt(nextX, nextY + 0.5, nextZ);
                } else {
                    const baseY = startY + (endY - startY) * carrier.progress + 10;
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
                
                // Segment-based height mapping
                let baseY = 0;
                if (this.poles.length > 2) {
                    const idx = Math.floor(actProgress * (this.poles.length - 1));
                    const p1 = this.poles[idx];
                    const p2 = this.poles[idx + 1];
                    const localProg = (actProgress * (this.poles.length - 1)) - idx;
                    const y1 = p1.isStation ? (this.terrain ? this.terrain.getHeightAt(p1.x, p1.z) : 0) + (isSurface ? 2 : 10) : p1.topHeight;
                    const y2 = p2.isStation ? (this.terrain ? this.terrain.getHeightAt(p2.x, p2.z) : 0) + (isSurface ? 2 : 10) : p2.topHeight;
                    baseY = y1 + (y2 - y1) * localProg;
                } else {
                    const cableHeight = isSurface ? 2 : 10;
                    const startY = this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0;
                    const endY = this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0;
                    baseY = startY + (endY - startY) * actProgress + cableHeight;
                }
                
                const sag = isSurface ? 0 : Math.sin(actProgress * Math.PI) * 1.5;
                const y = baseY - sag - (isSurface ? 0.5 : 2);
                
                const gauge = isSurface ? 1.5 : (this.config.seats > 4 || this.config.cabinSize > 8 ? 4.5 : 3.5);
                const dx = this.endPos.x - this.startPos.x;
                const dz = this.endPos.z - this.startPos.z;
                const len = Math.sqrt(dx*dx + dz*dz);
                const sideDir = isGoingUp ? 1 : -1;
                
                carrier.mesh.position.set(
                    x + (-dz/len) * (gauge / 2) * sideDir,
                    y,
                    z + (dx/len) * (gauge / 2) * sideDir
                );
                
                carrier.mesh.rotation.y = isGoingUp ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
            }
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LIFT_TYPES, SkiLift };
}