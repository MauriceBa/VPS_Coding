/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Gebäude-Typen und Erstellung
 */

const BUILDING_TYPES = {
    // ========== INFRASTRUKTUR ==========
    mountainStation: {
        name: '🏔️ Mountain Station',
        category: 'infrastructure',
        cost: 50000,
        size: { width: 8, height: 6, depth: 10 },
        color: 0x4a5568,
        description: 'Upper endpoint of a lift'
    },
    valleyStation: {
        name: '🏠 Valley Station',
        category: 'infrastructure',
        cost: 40000,
        size: { width: 10, height: 5, depth: 12 },
        color: 0x2d3748,
        description: 'Lower endpoint of a lift'
    },
    parking: {
        name: '🅿️ Parking',
        category: 'infrastructure',
        cost: 15000,
        size: { width: 20, height: 0.5, depth: 30 },
        color: 0x222222,
        capacity: 100, // Autos
        description: 'Parking lot for guests'
    },
    snowCannon: {
        name: '❄️ Snow Cannon',
        category: 'infrastructure',
        cost: 8000,
        size: { width: 2, height: 3, depth: 3 },
        color: 0xe2e8f0,
        description: 'Provides snow - improves slope quality'
    },
    rescueStation: {
        name: '🚑 Rescue Station',
        category: 'infrastructure',
        cost: 30000,
        size: { width: 6, height: 4, depth: 8 },
        color: 0xe53e3e,
        description: 'Mountain rescue - increases safety'
    },
    
    // ========== SERVICE & GASTRONOMIE ==========
    ticketOffice: {
        name: '🎫 Ticket Office',
        category: 'service',
        cost: 10000,
        size: { width: 4, height: 3, depth: 4 },
        color: 0x3182ce,
        description: 'Sells lift tickets'
    },
    infoPoint: {
        name: 'ℹ️ Info Point',
        category: 'service',
        cost: 5000,
        size: { width: 3, height: 4, depth: 3 },
        color: 0x2b6cb0,
        description: 'Information for guests'
    },
    skiRental: {
        name: '⛷️ Ski Rental',
        category: 'service',
        cost: 25000,
        size: { width: 8, height: 4, depth: 6 },
        color: 0xed8936,
        description: 'Equipment for guests'
    },
    skiSchool: {
        name: '🎿 Ski School',
        category: 'service',
        cost: 20000,
        size: { width: 6, height: 4, depth: 6 },
        color: 0xd69e2e,
        description: 'Ski courses for beginners'
    },
    fastFood: {
        name: '🍟 Fast Food',
        category: 'service',
        cost: 35000,
        size: { width: 6, height: 5, depth: 6 },
        color: 0xe53e3e,
        incomePerVisitor: 5,
        description: 'Quick food on the go'
    },
    hut: {
        name: '🍽️ Ski Hut',
        category: 'service',
        cost: 45000,
        size: { width: 8, height: 6, depth: 8 },
        color: 0x8B4513,
        incomePerVisitor: 15,
        description: 'Cozy hut for skiers'
    },
    cafe: {
        name: '☕ Mountain Cafe',
        category: 'service',
        cost: 40000,
        size: { width: 7, height: 5, depth: 7 },
        color: 0x7b341e,
        incomePerVisitor: 10,
        description: 'Coffee and cake with a view'
    },
    restaurant: {
        name: '🍕 Mountain Restaurant',
        category: 'service',
        cost: 80000,
        size: { width: 12, height: 8, depth: 10 },
        color: 0xc53030,
        incomePerVisitor: 25,
        description: 'Large restaurant with sun terrace'
    },
    bar: {
        name: '🍺 Après-Ski Bar',
        category: 'service',
        cost: 60000,
        size: { width: 8, height: 5, depth: 8 },
        color: 0xd69e2e,
        incomePerVisitor: 20,
        description: 'Party in the evening!'
    },
    observationDeck: {
        name: '🔭 Observation Deck',
        category: 'service',
        cost: 15000,
        size: { width: 5, height: 2, depth: 5 },
        color: 0xa0aec0,
        description: 'Panoramic view'
    },
    
    // ========== UNTERKÜNFTE ==========
    hostel: {
        name: '🛏️ Youth Hostel',
        category: 'accommodation',
        cost: 100000,
        size: { width: 15, height: 10, depth: 12 },
        color: 0x4fd1c5,
        capacity: 50,
        income: 1000,
        description: 'Cheap accommodation'
    },
    apartment: {
        name: '🏢 Apartments',
        category: 'accommodation',
        cost: 250000,
        size: { width: 12, height: 15, depth: 12 },
        color: 0x805ad5,
        capacity: 40,
        income: 2500,
        description: 'Multiple apartments'
    },
    chalet: {
        name: '🏡 Chalet',
        category: 'accommodation',
        cost: 150000,
        size: { width: 8, height: 6, depth: 8 },
        color: 0x9c4221,
        capacity: 8,
        income: 1500,
        description: 'Cozy wooden house'
    },
    hotel: {
        name: '🏨 Hotel',
        category: 'accommodation',
        cost: 500000,
        size: { width: 20, height: 15, depth: 15 },
        color: 0x2b6cb0,
        capacity: 100,
        income: 5000,
        description: 'Luxury hotel on the mountain'
    },
    chapel: {
        name: '⛪ Mountain Chapel',
        category: 'accommodation',
        cost: 25000,
        size: { width: 4, height: 8, depth: 6 },
        color: 0xffffff,
        description: 'Small chapel on the mountain'
    }
};

function createBuilding(type, x, y, z) {
    const config = BUILDING_TYPES[type];
    if (!config) return null;

    const group = new THREE.Group();
    
    // Hauptgebäude
    const geometry = new THREE.BoxGeometry(
        config.size.width,
        config.size.height,
        config.size.depth
    );
    const material = new THREE.MeshStandardMaterial({ 
        color: config.color,
        roughness: 0.8 
    });
    const mainBuilding = new THREE.Mesh(geometry, material);
    mainBuilding.position.y = config.size.height / 2;
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    group.add(mainBuilding);

    // Dächer je nach Typ
    if (type === 'hut' || type === 'chalet') {
        const roofGeometry = new THREE.ConeGeometry(
            Math.max(config.size.width, config.size.depth) * 0.8,
            config.size.height * 0.6,
            4
        );
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = config.size.height + (config.size.height * 0.3);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
    } else if (type === 'hotel') {
        const roofGeometry = new THREE.BoxGeometry(
            config.size.width + 1,
            1,
            config.size.depth + 1
        );
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = config.size.height + 0.5;
        group.add(roof);
    }

    // Y-Position wird nun korrekt auf das Terrain-Level gesetzt
    group.position.set(x, y, z);
    
    // Zufällige Rotation
    group.rotation.y = Math.random() * Math.PI * 2;

    return {
        type: type,
        config: config,
        mesh: group,
        position: { x, y, z }
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BUILDING_TYPES, createBuilding };
}