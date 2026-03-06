/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Gebäude & Einrichtungen
 */

const BUILDING_TYPES = {
    // Berg/Talstationen
    mountainStation: {
        name: '🏔️ Bergstation',
        cost: 5000,
        income: 0,
        description: 'Oberer Endpunkt eines Lifts',
        category: 'infrastructure',
        color: 0x8B4513,
        width: 4,
        height: 3,
        depth: 4
    },
    valleyStation: {
        name: '🏠 Talstation',
        cost: 3000,
        income: 0,
        description: 'Unterer Endpunkt eines Lifts',
        category: 'infrastructure',
        color: 0xA0522D,
        width: 5,
        height: 2.5,
        depth: 5
    },
    
    // Gastronomie
    hut: {
        name: '🍽️ Skihütte',
        cost: 8000,
        income: 50,
        incomePerVisitor: 2,
        description: 'Gemütliche Hütte für Skifahrer',
        category: 'service',
        color: 0x8B4513,
        width: 6,
        height: 4,
        depth: 5
    },
    restaurant: {
        name: '🍕 Bergrestaurant',
        cost: 15000,
        income: 100,
        incomePerVisitor: 5,
        description: 'Großes Restaurant mit Sonnenterrasse',
        category: 'service',
        color: 0xCD853F,
        width: 8,
        height: 5,
        depth: 7
    },
    fastFood: {
        name: '🍟 Fast Food',
        cost: 6000,
        income: 80,
        incomePerVisitor: 3,
        description: 'Schnelles Essen für unterwegs',
        category: 'service',
        color: 0xFF6B35,
        width: 5,
        height: 3,
        depth: 4
    },
    cafe: {
        name: '☕ Bergcafé',
        cost: 7000,
        income: 40,
        incomePerVisitor: 2,
        description: 'Kaffee und Kuchen mit Aussicht',
        category: 'service',
        color: 0x8B4513,
        width: 5,
        height: 3.5,
        depth: 5
    },
    bar: {
        name: '🍺 Après-Ski Bar',
        cost: 12000,
        income: 120,
        incomePerVisitor: 8,
        description: 'Party am Abend!',
        category: 'service',
        color: 0x4a0e4e,
        width: 7,
        height: 4,
        depth: 6
    },
    
    // Service
    parking: {
        name: '🅿️ Parkplatz',
        cost: 2000,
        income: 10,
        description: 'Parkplatz für Gäste',
        category: 'service',
        color: 0x4a5568,
        width: 8,
        height: 0.2,
        depth: 10
    },
    snowCannon: {
        name: '❄️ Schneekanone',
        cost: 3000,
        income: 0,
        description: 'Sorgt für Schnee - verbessert Pistenqualität',
        category: 'service',
        color: 0xFFFFFF,
        width: 1,
        height: 2,
        depth: 1
    },
    rescueStation: {
        name: '🚑 Rettungsstation',
        cost: 10000,
        income: 0,
        description: 'Bergrettung - erhöht Sicherheit',
        category: 'service',
        color: 0xFF0000,
        width: 6,
        height: 3.5,
        depth: 5
    },
    skiSchool: {
        name: '🎿 Skischule',
        cost: 8000,
        income: 60,
        description: 'Skikurse für Anfänger',
        category: 'service',
        color: 0xFFD700,
        width: 6,
        height: 3,
        depth: 5
    },
    skiRental: {
        name: '⛷️ Skiverleih',
        cost: 9000,
        income: 70,
        description: 'Ausrüstung für Gäste',
        category: 'service',
        color: 0x4169E1,
        width: 7,
        height: 3.5,
        depth: 6
    },
    infoPoint: {
        name: 'ℹ️ Infopoint',
        cost: 3000,
        income: 5,
        description: 'Information für Gäste',
        category: 'service',
        color: 0x00CED1,
        width: 4,
        height: 2.5,
        depth: 3
    },
    ticketOffice: {
        name: '🎫 Ticketbüro',
        cost: 5000,
        income: 0,
        description: 'Verkauft Liftkarten',
        category: 'service',
        color: 0x32CD32,
        width: 5,
        height: 3,
        depth: 4
    },
    
    // Unterkünfte
    hotel: {
        name: '🏨 Hotel',
        cost: 50000,
        income: 500,
        description: 'Luxushotel am Berg',
        category: 'accommodation',
        color: 0xFFD700,
        width: 10,
        height: 12,
        depth: 8
    },
    hostel: {
        name: '🛏️ Jugendherberge',
        cost: 15000,
        income: 150,
        description: 'Günstige Übernachtung',
        category: 'accommodation',
        color: 0x98FB98,
        width: 7,
        height: 6,
        depth: 6
    },
    chalet: {
        name: '🏡 Chalet',
        cost: 35000,
        income: 300,
        description: 'Gemütliches Holzhaus',
        category: 'accommodation',
        color: 0xDEB887,
        width: 8,
        height: 5,
        depth: 7
    },
    apartment: {
        name: '🏢 Ferienwohnungen',
        cost: 40000,
        income: 350,
        description: 'Mehrere Wohnungen',
        category: 'accommodation',
        color: 0x87CEEB,
        width: 9,
        height: 8,
        depth: 7
    },
    
    // Sonstiges
    observationDeck: {
        name: '🔭 Aussichtsplattform',
        cost: 12000,
        income: 20,
        description: 'Panorama-Aussicht',
        category: 'service',
        color: 0xC0C0C0,
        width: 8,
        height: 6,
        depth: 8
    },
    chapel: {
        name: '⛪ Bergkapelle',
        cost: 18000,
        income: 0,
        description: 'Kleine Kapelle am Berg',
        category: 'service',
        color: 0xF5F5DC,
        width: 5,
        height: 8,
        depth: 7
    }
};

// Gebäude erstellen
function createBuilding(type, x, z) {
    const config = BUILDING_TYPES[type];
    if (!config) return null;
    
    const group = new THREE.Group();
    
    // Hauptgebäude
    const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
    const material = new THREE.MeshStandardMaterial({ 
        color: config.color,
        roughness: 0.7
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.y = config.height / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);
    
    // Spezielle Details je nach Typ
    switch(type) {
        case 'hut':
            // Dach
            const hutRoof = new THREE.Mesh(
                new THREE.ConeGeometry(4, 2, 4),
                new THREE.MeshStandardMaterial({ color: 0x2d3748 })
            );
            hutRoof.position.y = config.height + 1;
            hutRoof.rotation.y = Math.PI / 4;
            group.add(hutRoof);
            
            // Rauch aus dem Schornstein
            createSmokeEffect(group, 1.5, config.height + 2, 1);
            break;
            
        case 'restaurant':
            // Großes Dach
            const restRoof = new THREE.Mesh(
                new THREE.BoxGeometry(9, 0.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x2d3748 })
            );
            restRoof.position.y = config.height + 0.25;
            group.add(restRoof);
            
            // Terrasse
            const terrace = new THREE.Mesh(
                new THREE.BoxGeometry(8, 0.3, 3),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            terrace.position.set(0, 0.15, 5);
            group.add(terrace);
            break;
            
        case 'hotel':
            // Mehrere Etagen sichtbar
            for (let i = 1; i < 4; i++) {
                const floor = new THREE.Mesh(
                    new THREE.BoxGeometry(config.width + 0.2, 0.2, config.depth + 0.2),
                    new THREE.MeshStandardMaterial({ color: 0x2d3748 })
                );
                floor.position.y = (config.height / 4) * i;
                group.add(floor);
            }
            
            // Hotel-Schild
            const sign = new THREE.Mesh(
                new THREE.BoxGeometry(4, 1, 0.2),
                new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.3 })
            );
            sign.position.set(0, config.height - 2, config.depth/2 + 0.2);
            group.add(sign);
            break;
            
        case 'snowCannon':
            // Kanonen-Rohr
            const cannon = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x718096 })
            );
            cannon.rotation.x = Math.PI / 3;
            cannon.position.set(0, 1.5, 0.5);
            group.add(cannon);
            
            // Schneepartikel-System
            createSnowEffect(group, 0, 2, 1);
            break;
            
        case 'parking':
            // Linien markieren
            for (let i = -3; i <= 3; i += 1.5) {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.05, config.depth - 1),
                    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
                );
                line.position.set(i * 1, 0.15, 0);
                group.add(line);
            }
            break;
            
        case 'fastFood':
            // Schild
            const ffSign = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.8, 0.2),
                new THREE.MeshStandardMaterial({ color: 0xFF0000 })
            );
            ffSign.position.set(0, config.height + 0.4, config.depth/2 + 0.2);
            group.add(ffSign);
            break;
            
        case 'cafe':
            // Café-Terrasse
            const cafeTerrace = new THREE.Mesh(
                new THREE.BoxGeometry(config.width + 2, 0.2, 2),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            cafeTerrace.position.set(0, 0.1, config.depth/2 + 1);
            group.add(cafeTerrace);
            break;
            
        case 'bar':
            // Blinkende Lichter
            for (let i = 0; i < 5; i++) {
                const light = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 8, 8),
                    new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xFF00FF : 0x00FFFF })
                );
                light.position.set(-2 + i, config.height + 0.5, config.depth/2 + 0.2);
                group.add(light);
            }
            break;
            
        case 'rescueStation':
            // Rotes Kreuz Schild
            const crossV = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 1.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFF0000, emissiveIntensity: 0.5 })
            );
            crossV.position.set(0, config.height + 1, config.depth/2 + 0.3);
            group.add(crossV);
            
            const crossH = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.3, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFF0000, emissiveIntensity: 0.5 })
            );
            crossH.position.set(0, config.height + 1, config.depth/2 + 0.3);
            group.add(crossH);
            break;
            
        case 'skiSchool':
            // Übungshügel
            const hill = new THREE.Mesh(
                new THREE.ConeGeometry(2, 1, 4),
                new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
            );
            hill.position.set(0, 0.5, config.depth/2 + 2);
            group.add(hill);
            break;
            
        case 'skiRental':
            // Skiständer draußen
            for (let i = 0; i < 8; i++) {
                const ski = new THREE.Mesh(
                    new THREE.BoxGeometry(0.05, 1.5, 0.05),
                    new THREE.MeshStandardMaterial({ color: 0xFF0000 })
                );
                ski.position.set(-2 + i * 0.3, 0.75, config.depth/2 + 1);
                ski.rotation.z = 0.1;
                group.add(ski);
            }
            break;
            
        case 'chalet':
            // Typisches Holzchalet-Dach
            const chaletRoof = new THREE.Mesh(
                new THREE.ConeGeometry(config.width * 0.7, 2, 4),
                new THREE.MeshStandardMaterial({ color: 0x4a3728 })
            );
            chaletRoof.position.y = config.height + 1;
            chaletRoof.rotation.y = Math.PI / 4;
            group.add(chaletRoof);
            
            // Balkon
            const balcony = new THREE.Mesh(
                new THREE.BoxGeometry(config.width, 0.2, 2),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            balcony.position.set(0, config.height/2, config.depth/2 + 1);
            group.add(balcony);
            break;
            
        case 'apartment':
            // Mehrere Balkone
            for (let floor = 1; floor < 4; floor++) {
                const aptBalcony = new THREE.Mesh(
                    new THREE.BoxGeometry(config.width - 1, 0.2, 1.5),
                    new THREE.MeshStandardMaterial({ color: 0xCCCCCC })
                );
                aptBalcony.position.set(0, floor * 2, config.depth/2 + 0.8);
                group.add(aptBalcony);
            }
            break;
            
        case 'observationDeck':
            // Aussichtsplattform höher
            const deck = new THREE.Mesh(
                new THREE.CylinderGeometry(config.width/2, config.width/2, 0.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            deck.position.y = config.height;
            group.add(deck);
            
            // Teleskop
            const telescope = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            telescope.position.set(0, config.height + 0.75, 0);
            group.add(telescope);
            break;
            
        case 'chapel':
            // Kirchturm
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1.5, 4, 6),
                new THREE.MeshStandardMaterial({ color: config.color })
            );
            tower.position.y = config.height + 2;
            group.add(tower);
            
            // Kreuz
            const chapelCrossV = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 1, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xFFD700 })
            );
            chapelCrossV.position.set(0, config.height + 5, 0);
            group.add(chapelCrossV);
            
            const chapelCrossH = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.2, 0.1),
                new THREE.MeshStandardMaterial({ color: 0xFFD700 })
            );
            chapelCrossH.position.set(0, config.height + 5.2, 0);
            group.add(chapelCrossH);
            break;
    }
    
    group.position.set(x, 0, z);
    return {
        mesh: group,
        type: type,
        config: config,
        x: x,
        z: z,
        visitors: 0
    };
}

// Rauch-Effekt für Hütten
function createSmokeEffect(parent, x, y, z) {
    const particleCount = 5;
    const particles = [];
    
    setInterval(() => {
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 6, 6),
            new THREE.MeshBasicMaterial({ 
                color: 0x888888, 
                transparent: true, 
                opacity: 0.6 
            })
        );
        smoke.position.set(x, y, z);
        parent.add(smoke);
        
        let age = 0;
        const animateSmoke = () => {
            age++;
            smoke.position.y += 0.02;
            smoke.position.x += (Math.random() - 0.5) * 0.02;
            smoke.scale.multiplyScalar(1.02);
            smoke.material.opacity -= 0.005;
            
            if (age < 120 && smoke.material.opacity > 0) {
                requestAnimationFrame(animateSmoke);
            } else {
                parent.remove(smoke);
            }
        };
        animateSmoke();
    }, 800);
}

// Schnee-Effekt für Schneekanonen
function createSnowEffect(parent, x, y, z) {
    setInterval(() => {
        for (let i = 0; i < 3; i++) {
            const snow = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
            );
            snow.position.set(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2);
            parent.add(snow);
            
            const velocity = {
                x: (Math.random() - 0.3) * 0.1,
                y: 0.1 + Math.random() * 0.1,
                z: 0.1 + Math.random() * 0.1
            };
            
            let age = 0;
            const animateSnow = () => {
                age++;
                snow.position.x += velocity.x;
                snow.position.y += velocity.y;
                snow.position.z += velocity.z;
                velocity.y -= 0.005; // Schwerkraft
                
                if (age < 60 && snow.position.y > 0) {
                    requestAnimationFrame(animateSnow);
                } else {
                    parent.remove(snow);
                }
            };
            animateSnow();
        }
    }, 100);
}

// Export für andere Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BUILDING_TYPES, createBuilding };
}
