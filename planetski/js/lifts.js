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
        capacity: 1500,
        speed: 3, // km/h - langsam aber stetig
        maxLength: 100,
        maxHeight: 20,
        description: 'Förderband für Anfänger und Kinder',
        color: 0xFF6B6B,
        poleDistance: 20,
        model: 'conveyor'
    },
    
    ropeTow: {
        name: '🪢 Seilzug',
        category: 'surface',
        cost: 8000,
        capacity: 600,
        speed: 10,
        maxLength: 300,
        maxHeight: 50,
        description: 'Einfacher Seilzug für 1 Person',
        color: 0xFFA500,
        poleDistance: 25,
        model: 'rope'
    },
    
    platterLift: {
        name: '🍽️ Plattenlift',
        category: 'surface',
        cost: 10000,
        capacity: 800,
        speed: 12,
        maxLength: 400,
        maxHeight: 80,
        description: 'Platte zwischen die Beine klemmen',
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
        description: 'T-förmiger Bügel für 1-2 Personen',
        color: 0xE74C3C,
        poleDistance: 18,
        model: 'tbar'
    },
    
    // ========== FIXED GRIP CHAIRLIFTS ==========
    chair1Fixed: {
        name: '🪑 1er Sessel (fix)',
        category: 'fixed',
        cost: 25000,
        capacity: 800,
        speed: 10,
        maxLength: 800,
        maxHeight: 250,
        description: 'Klassischer Einzelsessel',
        color: 0x3498DB,
        poleDistance: 35,
        seats: 1,
        model: 'chair',
        bubble: false
    },
    
    chair2Fixed: {
        name: '🪑🪑 2er Sessel (fix)',
        category: 'fixed',
        cost: 35000,
        capacity: 1200,
        speed: 12,
        maxLength: 1200,
        maxHeight: 350,
        description: 'Zweiersessel mit festem Griff',
        color: 0x2980B9,
        poleDistance: 40,
        seats: 2,
        model: 'chair',
        bubble: false
    },
    
    chair3Fixed: {
        name: '🪑🪑🪑 3er Sessel (fix)',
        category: 'fixed',
        cost: 45000,
        capacity: 1500,
        speed: 12,
        maxLength: 1400,
        maxHeight: 400,
        description: 'Dreiersessel',
        color: 0x1ABC9C,
        poleDistance: 45,
        seats: 3,
        model: 'chair',
        bubble: false
    },
    
    chair4Fixed: {
        name: '🪑×4 4er Sessel (fix)',
        category: 'fixed',
        cost: 55000,
        capacity: 1800,
        speed: 13,
        maxLength: 1600,
        maxHeight: 500,
        description: 'Vierersessel - Arbeitstier der Alpen',
        color: 0x16A085,
        poleDistance: 50,
        seats: 4,
        model: 'chair',
        bubble: false
    },
    
    chair6Fixed: {
        name: '🪑×6 6er Sessel (fix)',
        category: 'fixed',
        cost: 70000,
        capacity: 2200,
        speed: 14,
        maxLength: 1800,
        maxHeight: 600,
        description: 'Sechsser mit festem Griff',
        color: 0x27AE60,
        poleDistance: 55,
        seats: 6,
        model: 'chair',
        bubble: false
    },
    
    // ========== DETACHABLE CHAIRLIFTS ==========
    chair2Detach: {
        name: '⚡ 2er Sessel (kuppelbar)',
        category: 'detachable',
        cost: 60000,
        capacity: 1600,
        speed: 18,
        maxLength: 2000,
        maxHeight: 700,
        description: 'Kuppelbarer Zweiersessel',
        color: 0xF39C12,
        poleDistance: 60,
        seats: 2,
        model: 'chair',
        bubble: false
    },
    
    chair3Detach: {
        name: '⚡⚡ 3er Sessel (kuppelbar)',
        category: 'detachable',
        cost: 75000,
        capacity: 2000,
        speed: 18,
        maxLength: 2200,
        maxHeight: 800,
        description: 'Kuppelbarer Dreiersessel',
        color: 0xE67E22,
        poleDistance: 65,
        seats: 3,
        model: 'chair',
        bubble: false
    },
    
    chair4Detach: {
        name: '⚡⚡⚡ 4er Sessel (kuppelbar)',
        category: 'detachable',
        cost: 90000,
        capacity: 2400,
        speed: 20,
        maxLength: 2500,
        maxHeight: 900,
        description: 'Kuppelbarer Vierersessel',
        color: 0xD35400,
        poleDistance: 70,
        seats: 4,
        model: 'chair',
        bubble: true
    },
    
    chair6Detach: {
        name: '⚡⚡⚡⚡ 6er Sessel (kuppelbar)',
        category: 'detachable',
        cost: 120000,
        capacity: 3200,
        speed: 22,
        maxLength: 3000,
        maxHeight: 1100,
        description: 'Moderner Sechsser mit Blendschutz',
        color: 0xC0392B,
        poleDistance: 85,
        seats: 6,
        model: 'chair',
        bubble: true
    },
    
    chair8Detach: {
        name: '⚡⚡⚡⚡⚡ 8er Sessel (kuppelbar)',
        category: 'detachable',
        cost: 150000,
        capacity: 4000,
        speed: 24,
        maxLength: 3500,
        maxHeight: 1300,
        description: 'Hochleistungs-Achter',
        color: 0x8E44AD,
        poleDistance: 100,
        seats: 8,
        model: 'chair',
        bubble: true
    },
    
    // ========== GONDOLAS ==========
    gondola4: {
        name: '🚠 Gondel 1S 4P',
        category: 'gondola',
        cost: 100000,
        capacity: 1600,
        speed: 18,
        maxLength: 3000,
        maxHeight: 1000,
        description: '4-Personen-Gondel',
        color: 0xF1C40F,
        poleDistance: 80,
        cabinSize: 4,
        model: 'gondola'
    },
    
    gondola6: {
        name: '🚠 Gondel 1S 6P',
        category: 'gondola',
        cost: 120000,
        capacity: 2000,
        speed: 20,
        maxLength: 3500,
        maxHeight: 1200,
        description: '6-Personen-Gondel',
        color: 0xF39C12,
        poleDistance: 90,
        cabinSize: 6,
        model: 'gondola'
    },
    
    gondola8: {
        name: '🚠 Gondel 1S 8P',
        category: 'gondola',
        cost: 140000,
        capacity: 2400,
        speed: 20,
        maxLength: 4000,
        maxHeight: 1400,
        description: '8-Personen-Gondel',
        color: 0xE67E22,
        poleDistance: 100,
        cabinSize: 8,
        model: 'gondola'
    },
    
    gondola10: {
        name: '🚠 Gondel 1S 10P',
        category: 'gondola',
        cost: 160000,
        capacity: 2800,
        speed: 22,
        maxLength: 4500,
        maxHeight: 1600,
        description: '10-Personen-Gondel',
        color: 0xD35400,
        poleDistance: 110,
        cabinSize: 10,
        model: 'gondola'
    },
    
    gondola12: {
        name: '🚠 Gondel 1S 12P',
        category: 'gondola',
        cost: 180000,
        capacity: 3200,
        speed: 22,
        maxLength: 5000,
        maxHeight: 1800,
        description: '12-Personen-Gondel',
        color: 0xE74C3C,
        poleDistance: 120,
        cabinSize: 12,
        model: 'gondola'
    },
    
    // ========== BICABLE/TRICABLE ==========
    gondola2S18: {
        name: '🚡 Gondel 2S 18P',
        category: 'bicable',
        cost: 250000,
        capacity: 2000,
        speed: 25,
        maxLength: 6000,
        maxHeight: 2000,
        description: 'Zweiseil-Gondel (18P)',
        color: 0x9B59B6,
        poleDistance: 150,
        cabinSize: 18,
        model: 'bigGondola'
    },
    
    gondola3S35: {
        name: '🚡 Gondel 3S 35P',
        category: 'tricable',
        cost: 400000,
        capacity: 2500,
        speed: 28,
        maxLength: 8000,
        maxHeight: 2500,
        description: 'Triseil-Gondel (35P)',
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
        description: 'Funitel - zwei Ebenen',
        color: 0x1ABC9C,
        poleDistance: 180,
        cabinSize: 30,
        model: 'funitel'
    },
    
    // ========== AERIAL TRAMWAY / PENDELBAHN ==========
    tramway50: {
        name: '🚠 Pendelbahn 50P',
        category: 'tramway',
        cost: 500000,
        capacity: 800,
        speed: 35,
        maxLength: 10000,
        maxHeight: 3000,
        description: 'Große Pendelbahn (50P)',
        color: 0xE91E63,
        poleDistance: 0, // Nur Stationen
        cabinSize: 50,
        model: 'tramway'
    },
    
    tramway100: {
        name: '🚠 Pendelbahn 100P',
        category: 'tramway',
        cost: 800000,
        capacity: 1200,
        speed: 40,
        maxLength: 12000,
        maxHeight: 3500,
        description: 'Riesen-Pendelbahn (100P)',
        color: 0xAD1457,
        poleDistance: 0,
        cabinSize: 100,
        model: 'tramway'
    },
    
    tramway150: {
        name: '🚠 Pendelbahn 150P',
        category: 'tramway',
        cost: 1200000,
        capacity: 1600,
        speed: 42,
        maxLength: 15000,
        maxHeight: 4000,
        description: 'Mega-Pendelbahn (150P)',
        color: 0x880E4F,
        poleDistance: 0,
        cabinSize: 150,
        model: 'tramway'
    },
    
    tramway200: {
        name: '🚠 Pendelbahn 200P (Doppelstock!)',
        category: 'tramway',
        cost: 2000000,
        capacity: 2400,
        speed: 45,
        maxLength: 20000,
        maxHeight: 4500,
        description: 'VANOISE EXPRESS Style - Doppelstock!',
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
        description: 'Mix aus 6er-Sessel und 10P-Gondel',
        color: 0x00BCD4,
        poleDistance: 75,
        model: 'chondola'
    },
    
    // ========== RAIL-BASED ==========
    funicular: {
        name: '🚞 Standseilbahn',
        category: 'funicular',
        cost: 600000,
        capacity: 1000,
        speed: 15,
        maxLength: 5000,
        maxHeight: 1500,
        description: 'Schiengebundene Standseilbahn',
        color: 0x795548,
        poleDistance: 0,
        model: 'funicular'
    },
    
    undergroundFunicular: {
        name: '🚇 Untergrundbahn',
        category: 'funicular',
        cost: 1500000,
        capacity: 1500,
        speed: 20,
        maxLength: 8000,
        maxHeight: 2000,
        description: 'Unterirdische Standseilbahn',
        color: 0x5D4037,
        poleDistance: 0,
        model: 'underground'
    },
    
    inclinedElevator: {
        name: '🛗 Schrägaufzug',
        category: 'funicular',
        cost: 400000,
        capacity: 600,
        speed: 12,
        maxLength: 2000,
        maxHeight: 800,
        description: 'Schräg fahrender Aufzug',
        color: 0x607D8B,
        poleDistance: 0,
        model: 'elevator'
    }
};

// Lift-Modelle erstellen
const LiftModels = {
    // Surface Lifts
    createConveyor: (color) => {
        const group = new THREE.Group();
        
        // Förderband
        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        belt.position.y = 0.5;
        group.add(belt);
        
        // Gummimatte
        const mat = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.05, 5.8),
            new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.9 
            });
        );
        mat.position.y = 0.65;
        group.add(mat);
        
        // Seitengeländer
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
        
        // Griff
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: color })
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.y = -0.8;
        group.add(handle);
        
        // Seil
        const rope = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 2, 4),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        rope.position.y = 0;
        group.add(rope);
        
        return group;
    },
    
    createPlatter: (color) => {
        const group = new THREE.Group();
        
        // Platte
        const plate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16),
            new THREE.MeshStandardMaterial({ color: color })
        );
        plate.position.y = -1;
        group.add(plate);
        
        // Stange
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1.8, 4),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        pole.position.y = -0.1;
        group.add(pole);
        
        return group;
    },
    
    createTBar: (color) => {
        const group = new THREE.Group();
        
        // T-Querstange
        const bar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4),
            new THREE.MeshStandardMaterial({ color: color })
        );
        bar.rotation.z = Math.PI / 2;
        bar.position.y = -0.9;
        group.add(bar);
        
        // Polster an den Enden
        for (let side of [-0.55, 0.55]) {
            const pad = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            pad.rotation.z = Math.PI / 2;
            pad.position.set(side, -0.9, 0);
            group.add(pad);
        }
        
        // Vertikale Stange
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        pole.position.y = -0.1;
        group.add(pole);
        
        return group;
    },
    
    // Chairlifts
    createChair: (color, seats, hasBubble) => {
        const group = new THREE.Group();
        
        // Gestell
        const frame = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 2.2, 4),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        frame.position.y = -1;
        group.add(frame);
        
        // Sitzbank
        const seatWidth = seats * 0.55;
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(seatWidth, 0.08, 0.5),
            new THREE.MeshStandardMaterial({ color: color })
        );
        seat.position.y = -2.1;
        group.add(seat);
        
        // Rückenlehne
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(seatWidth, 0.5, 0.08),
            new THREE.MeshStandardMaterial({ color: color })
        );
        back.position.set(0, -1.8, -0.25);
        group.add(back);
        
        // Armlehnen
        for (let i = 0; i <= seats; i++) {
            const arm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.35, 4),
                new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            arm.position.set(-seatWidth/2 + i * (seatWidth/seats), -1.9, 0);
            group.add(arm);
        }
        
        // Blendschutz (Bubble)
        if (hasBubble) {
            const bubbleGroup = new THREE.Group();
            
            // Glaskuppel
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(seatWidth * 0.45, 12, 12, 0, Math.PI * 2, 0, Math.PI/2),
                new THREE.MeshPhysicalMaterial({ 
                    color: 0x87CEEB,
                    transparent: true,
                    opacity: 0.25,
                    transmission: 0.9,
                    thickness: 0.1
                })
            );
            dome.position.y = -1.8;
            bubbleGroup.add(dome);
            
            // Rahmen
            const frameBar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, seatWidth * 0.9, 4),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            frameBar.rotation.z = Math.PI / 2;
            frameBar.position.set(0, -1.3, 0);
            bubbleGroup.add(frameBar);
            
            group.add(bubbleGroup);
        }
        
        return group;
    },
    
    // Gondolas
    createGondola: (color, size) => {
        const group = new THREE.Group();
        
        // Seil-Aufhängung
        const hanger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.5, 4),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        hanger.position.y = -0.5;
        group.add(hanger);
        
        // Kabinen-Größe basierend auf Kapazität
        const scales = { 4: 1, 6: 1.2, 8: 1.4, 10: 1.6, 12: 1.8, 18: 2.2, 35: 3 };
        const scale = scales[size] || 1;
        
        // Kabine
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.8 * scale, 2.2 * scale, 1.6 * scale),
            new THREE.MeshStandardMaterial({ color: color })
        );
        cabin.position.y = -1.8 * scale;
        cabin.castShadow = true;
        group.add(cabin);
        
        // Fenster
        const windowMat = new THREE.MeshPhysicalMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.4,
            transmission: 0.8
        });
        
        // Seitenfenster
        for (let side of [-1, 1]) {
            const window_ = new THREE.Mesh(
                new THREE.PlaneGeometry(1.4 * scale, 1.2 * scale),
                windowMat
            );
            window_.position.set(side * (0.9 * scale + 0.01), -1.8 * scale, 0);
            window_.rotation.y = side * Math.PI / 2;
            group.add(window_);
        }
        
        // Front-/Rückfenster
        for (let end of [-1, 1]) {
            const window_ = new THREE.Mesh(
                new THREE.PlaneGeometry(1.4 * scale, 1 * scale),
                windowMat
            );
            window_.position.set(0, -1.8 * scale, end * (0.8 * scale + 0.01));
            if (end === -1) window_.rotation.y = Math.PI;
            group.add(window_);
        }
        
        return group;
    },
    
    // Big Gondola / Funitel
    createBigGondola: (color, size) => {
        const group = new THREE.Group();
        const scale = size > 20 ? 2.5 : 2;
        
        // Doppelte Aufhängung für Bicable/Tricable
        for (let x of [-0.8, 0.8]) {
            const hanger = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1.2, 4),
                new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            hanger.position.set(x, -0.4, 0);
            group.add(hanger);
        }
        
        // Querträger
        const crossbar = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.1, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        crossbar.position.y = -1;
        group.add(crossbar);
        
        // Große Kabine
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(3 * scale, 2.5 * scale, 2.5 * scale),
            new THREE.MeshStandardMaterial({ color: color })
        );
        cabin.position.y = -2.3 * scale;
        group.add(cabin);
        
        return group;
    },
    
    // Funitel (zwei Ebenen)
    createFunitel: (color, size) => {
        const group = new THREE.Group();
        
        // Oberdeck
        const upper = LiftModels.createGondola(color, 15);
        upper.position.y = 1.5;
        group.add(upper);
        
        // Unterdeck
        const lower = LiftModels.createGondola(color, 15);
        lower.position.y = -1;
        group.add(lower);
        
        // Verbindung
        const connector = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 2.5, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        connector.position.y = 0.25;
        group.add(connector);
        
        return group;
    },
    
    // Aerial Tramway / Pendelbahn
    createTramway: (color, size) => {
        const group = new THREE.Group();
        
        // Skalierung basierend auf Größe
        const scales = { 50: 2, 100: 3, 150: 3.5, 200: 4 };
        const scale = scales[size] || 2;
        
        // Vierfache Aufhängung
        for (let x of [-1.2, -0.4, 0.4, 1.2]) {
            const hanger = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.06, 1.5, 4),
                new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            hanger.position.set(x, -0.5, 0);
            group.add(hanger);
        }
        
        // Riesige Kabine
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(5 * scale, 3.5 * scale, 3 * scale),
            new THREE.MeshStandardMaterial({ color: color })
        );
        cabin.position.y = -2.8 * scale;
        group.add(cabin);
        
        // Panoramafenster
        const windowMat = new THREE.MeshPhysicalMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
            transmission: 0.9
        });
        
        const frontWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(4 * scale, 2.5 * scale),
            windowMat
        );
        frontWindow.position.set(0, -2.8 * scale, 1.5 * scale + 0.02);
        group.add(frontWindow);
        
        return group;
    },
    
    // Double Decker Tramway (VANOISE EXPRESS Style)
    createDoubleDecker: (color) => {
        const group = new THREE.Group();
        
        // Oberdeck
        const upper = LiftModels.createTramway(color, 100);
        upper.scale.set(0.8, 0.8, 0.8);
        upper.position.y = 3;
        group.add(upper);
        
        // Unterdeck
        const lower = LiftModels.createTramway(color, 100);
        lower.scale.set(0.8, 0.8, 0.8);
        lower.position.y = -1;
        group.add(lower);
        
        // Verbindungsstruktur
        for (let x of [-1.5, 0, 1.5]) {
            const pillar = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 4, 0.4),
                new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            pillar.position.set(x, 1, 0);
            group.add(pillar);
        }
        
        return group;
    },
    
    // Chondola (Mix aus Chair und Gondola)
    createChondola: (color) => {
        const group = new THREE.Group();
        
        // Abwechselnd: mal Sessel, mal Gondel
        // Dies wird im Lift-Controller gemanagt
        // Hier erstellen wir beide Varianten
        
        return LiftModels.createChair(color, 6, true);
    },
    
    // Funicular
    createFunicular: (color) => {
        const group = new THREE.Group();
        
        // Waggon
        const wagon = new THREE.Mesh(
            new THREE.BoxGeometry(8, 3.5, 3),
            new THREE.MeshStandardMaterial({ color: color })
        );
        wagon.position.y = 1.75;
        wagon.castShadow = true;
        group.add(wagon);
        
        // Fenster
        const windowMat = new THREE.MeshPhysicalMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.4
        });
        
        for (let i = 0; i < 4; i++) {
            const win = new THREE.Mesh(
                new THREE.PlaneGeometry(1.5, 1.2),
                windowMat
            );
            win.position.set(-3 + i * 2, 2.2, 1.51);
            group.add(win);
        }
        
        // Räder
        for (let x of [-3, 3]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.4, 0);
            group.add(wheel);
        }
        
        return group;
    },
    
    // Underground Funicular
    createUnderground: (color) => {
        const group = LiftModels.createFunicular(color);
        
        // Tunnel-Portal Marker
        const portal = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 1, 16, 1, true, 0, Math.PI),
            new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                side: THREE.DoubleSide
            }
        );
        portal.position.y = 0.5;
        portal.rotation.z = Math.PI / 2;
        group.add(portal);
        
        return group;
    },
    
    // Inclined Elevator
    createElevator: (color) => {
        const group = new THREE.Group();
        
        // Kabine
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 3, 2),
            new THREE.MeshStandardMaterial({ color: color })
        );
        cabin.position.y = 1.5;
        group.add(cabin);
        
        // Tür
        const door = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 2.2),
            new THREE.MeshStandardMaterial({ 
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.5
            }
        );
        door.position.set(0, 1.5, 1.01);
        group.add(door);
        
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
        this.group = new THREE.Group();
        
        this.build();
    }
    
    build() {
        // Stationen
        this.buildStation(this.startPos.x, this.startPos.z, true);
        this.buildStation(this.endPos.x, this.endPos.z, false);
        
        // Stützen (nicht für Pendelbahnen)
        if (this.config.poleDistance > 0) {
            this.buildPoles();
        }
        
        // Seile
        this.buildCables();
        
        // Carrier
        this.buildCarriers();
        
        this.scene.add(this.group);
    }
    
    buildStation(x, z, isValley) {
        const stationGroup = new THREE.Group();
        
        // Höhe ermitteln
        const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
        
        // Station-Größe basierend auf Lift-Typ
        const isBigStation = ['tramway', 'bicable', 'tricable', 'funitel', 'funicular'].includes(this.config.category);
        const width = isBigStation ? 10 : 6;
        const depth = isBigStation ? 12 : 8;
        const height = isValley ? 4 : 5;
        
        // Gebäude
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color: isValley ? 0x8B4513 : 0xA0522D })
        );
        building.position.y = y + height / 2;
        building.castShadow = true;
        stationGroup.add(building);
        
        // Dach
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(Math.max(width, depth) * 0.6, 2.5, 4),
            new THREE.MeshStandardMaterial({ color: 0x2d3748 })
        );
        roof.position.y = y + height + 1.25;
        roof.rotation.y = Math.PI / 4;
        stationGroup.add(roof);
        
        // Antrieb
        if (isValley) {
            const driveWheel = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 0.8, 16),
                new THREE.MeshStandardMaterial({ color: 0x4a5568 })
            );
            driveWheel.rotation.z = Math.PI / 2;
            driveWheel.position.set(0, y + height - 1, depth/2 + 1);
            stationGroup.add(driveWheel);
            
            // Animation
            const animate = () => {
                driveWheel.rotation.x += 0.02;
                requestAnimationFrame(animate);
            };
            animate();
        }
        
        // Typ-Schild
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.2, 0.3),
            new THREE.MeshStandardMaterial({ 
                color: this.config.color,
                emissive: this.config.color,
                emissiveIntensity: 0.3
            });
        );
        sign.position.set(0, y + height + 1, isValley ? depth/2 + 0.2 : -depth/2 - 0.2);
        stationGroup.add(sign);
        
        stationGroup.position.set(x, 0, z);
        this.group.add(stationGroup);
    }
    
    buildPoles() {
        const poleCount = Math.max(1, Math.floor(this.length / this.config.poleDistance));
        const dx = (this.endPos.x - this.startPos.x) / poleCount;
        const dz = (this.endPos.z - this.startPos.z) / poleCount;
        
        for (let i = 1; i < poleCount; i++) {
            const x = this.startPos.x + dx * i;
            const z = this.startPos.z + dz * i;
            const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
            
            const pole = this.createPole();
            pole.position.set(x, y, z);
            
            // Ausrichtung
            const angle = Math.atan2(this.endPos.z - this.startPos.z, this.endPos.x - this.startPos.x);
            pole.rotation.y = -angle;
            
            this.group.add(pole);
        }
    }
    
    createPole() {
        const group = new THREE.Group();
        
        // Höhe basierend auf Lift-Typ
        const baseHeight = this.config.category === 'gondola' ? 12 : 
                          this.config.category === 'detachable' ? 10 : 8;
        const height = baseHeight + Math.random() * 3;
        
        // Hauptstütze
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, height, 8),
            new THREE.MeshStandardMaterial({ color: 0x718096 })
        );
        pole.position.y = height / 2;
        pole.castShadow = true;
        group.add(pole);
        
        // Querträger
        const armWidth = this.config.seats > 4 ? 4 : 3;
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(armWidth, 0.15, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x4a5568 })
        );
        arm.position.y = height - 1.5;
        group.add(arm);
        
        // Rollen
        for (let side of [-armWidth/2 + 0.2, armWidth/2 - 0.2]) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 0.15, 12),
                new THREE.MeshStandardMaterial({ color: 0x2d3748 })
            );
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(side, height - 1.5, 0);
            group.add(wheel);
        }
        
        return group;
    }
    
    buildCables() {
        const segments = 20;
        const cableHeight = 10;
        
        const startY = this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) + cableHeight : cableHeight;
        const endY = this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) + cableHeight : cableHeight;
        
        // Hauptseil
        const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, this.length, 4);
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cable = new THREE.Mesh(cableGeo, cableMat);
        
        cable.rotation.z = Math.PI / 2;
        cable.rotation.y = Math.atan2(this.endPos.z - this.startPos.z, this.endPos.x - this.startPos.x);
        
        const midX = (this.startPos.x + this.endPos.x) / 2;
        const midZ = (this.startPos.z + this.endPos.z) / 2;
        const midY = (startY + endY) / 2;
        
        // Neigung für Höhenunterschied
        const slope = Math.atan2(endY - startY, this.length);
        cable.rotation.z += slope;
        
        cable.position.set(midX, midY, midZ);
        this.group.add(cable);
    }
    
    buildCarriers() {
        if (this.config.category === 'tramway' || this.config.category === 'funicular') {
            // Pendelbahn: nur 2 große Kabinen
            this.createPendulumCarriers();
        } else {
            // Umlaufbahn: viele kleine Carrier
            this.createCirculatingCarriers();
        }
    }
    
    createPendulumCarriers() {
        // Kabine 1
        const carrier1 = this.createCarrierMesh();
        carrier1.position.set(this.startPos.x, 15, this.startPos.z);
        this.group.add(carrier1);
        
        this.carriers.push({
            mesh: carrier1,
            progress: 0,
            direction: 1
        });
        
        // Kabine 2
        const carrier2 = this.createCarrierMesh();
        carrier2.position.set(this.endPos.x, 15, this.endPos.z);
        this.group.add(carrier2);
        
        this.carriers.push({
            mesh: carrier2,
            progress: 1,
            direction: -1
        });
    }
    
    createCirculatingCarriers() {
        const spacing = this.type === 'chondola' ? 25 : 
                       this.config.category === 'gondola' ? 20 : 15;
        const carrierCount = Math.max(3, Math.floor(this.length / spacing));
        
        for (let i = 0; i < carrierCount; i++) {
            // Bei Chondola: abwechselnd Sessel und Gondel
            const isGondola = this.type === 'chondola' && i % 3 === 0;
            
            const carrier = this.createCarrierMesh(isGondola);
            this.carriers.push({
                mesh: carrier,
                progress: i / carrierCount,
                direction: 1
            });
            this.group.add(carrier);
        }
    }
    
    createCarrierMesh(forceGondola = false) {
        const model = forceGondola ? 'gondola' : this.config.model;
        const color = this.config.color;
        const size = this.config.cabinSize || this.config.seats || 4;
        
        switch(model) {
            case 'conveyor':
                return LiftModels.createConveyor(color);
            case 'rope':
                return LiftModels.createRope(color);
            case 'platter':
                return LiftModels.createPlatter(color);
            case 'tbar':
                return LiftModels.createTBar(color);
            case 'chair':
                return LiftModels.createChair(color, size, this.config.bubble);
            case 'gondola':
                return LiftModels.createGondola(color, size);
            case 'bigGondola':
                return LiftModels.createBigGondola(color, size);
            case 'funitel':
                return LiftModels.createFunitel(color, size);
            case 'tramway':
                return LiftModels.createTramway(color, size);
            case 'doubleDecker':
                return LiftModels.createDoubleDecker(color);
            case 'funicular':
            case 'underground':
                return LiftModels.createFunicular(color);
            case 'elevator':
                return LiftModels.createElevator(color);
            case 'chondola':
                return LiftModels.createChair(color, 6, true);
            default:
                return LiftModels.createChair(color, 4, false);
        }
    }
    
    update(deltaTime) {
        const speed = this.config.speed * 0.00002;
        
        this.carriers.forEach(carrier => {
            if (this.config.category === 'tramway' || this.config.category === 'funicular') {
                // Pendelbewegung
                carrier.progress += speed * carrier.direction;
                
                if (carrier.progress >= 1) {
                    carrier.progress = 1;
                    carrier.direction = -1;
                } else if (carrier.progress <= 0) {
                    carrier.progress = 0;
                    carrier.direction = 1;
                }
            } else {
                // Umlaufbewegung
                carrier.progress += speed;
                if (carrier.progress >= 1) carrier.progress = 0;
            }
            
            // Position berechnen
            const x = this.startPos.x + (this.endPos.x - this.startPos.x) * carrier.progress;
            const z = this.startPos.z + (this.endPos.z - this.startPos.z) * carrier.progress;
            
            // Höhe mit Durchhang
            const cableHeight = 10;
            const startY = this.terrain ? this.terrain.getHeightAt(this.startPos.x, this.startPos.z) : 0;
            const endY = this.terrain ? this.terrain.getHeightAt(this.endPos.x, this.endPos.z) : 0;
            const baseY = startY + (endY - startY) * carrier.progress + cableHeight;
            
            // Durchhang in der Mitte
            const sag = Math.sin(carrier.progress * Math.PI) * 1.5;
            const y = baseY - sag - 2; // -2 für Carrier-Höhe
            
            carrier.mesh.position.set(x, y, z);
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LIFT_TYPES, SkiLift };
}
