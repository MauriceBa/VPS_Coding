/**
 * Three.js-Raum: Bau des interaktiven Schreibtisch-Zimmers.
 * Die Geometrie-Funktionen sind DOM-frei (Three.js global via Parameter).
 * Die Mathematik-Helfer sind rein und unit-testbar.
 */

import { ROOM_COLORS, ROOM_DIMENSIONS, ROOM_POSITIONS, ROOM_BEHAVIOR } from "./constants.js";

/**
 * Reine Mathematik: Maus-Delta → Ziel-Rotation (geclampte Neigung).
 * @param {{x: number, y: number}} targetRotation - Aktuelle Ziel-Rotation.
 * @param {{x: number, y: number}} deltaMove - Maus-Delta in Pixeln.
 * @param {number} [sensitivity] - Rotations-Empfindlichkeit pro Pixel.
 * @param {number|null} [maxTilt] - Maximale Neigung (null = kein Clamp).
 * @returns {{x: number, y: number}} Neue Ziel-Rotation.
 */
export function computeDragRotation(
  targetRotation,
  deltaMove,
  sensitivity = ROOM_BEHAVIOR.rotationSensitivity,
  maxTilt = ROOM_BEHAVIOR.maxTilt,
) {
  const tilt = targetRotation.x + deltaMove.y * sensitivity;
  return {
    y: targetRotation.y + deltaMove.x * sensitivity,
    x: maxTilt === null ? tilt : Math.max(-maxTilt, Math.min(maxTilt, tilt)),
  };
}

/**
 * Reine Mathematik: Client-Koordinaten → normalisierte Device-Koordinaten (für Raycasting).
 * @param {{clientX: number, clientY: number}} event - Maus-/Touch-Position.
 * @param {{left: number, top: number, width: number, height: number}} rect - Canvas-Bounding-Rect.
 * @returns {{x: number, y: number}} NDC-Koordinaten (-1 bis 1).
 */
export function computeRaycastNDC(event, rect) {
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
  };
}

/**
 * Erstellt die Beleuchtung des Raums.
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object[]} [ambientLight, pointLight, pointLight2].
 */
export function createLights(THREE) {
  const ambientLight = new THREE.AmbientLight(ROOM_COLORS.ambientLight, 0.4);

  const pointLight = new THREE.PointLight(ROOM_COLORS.pointLightPrimary, 1, 100);
  pointLight.position.set(5, 5, 5);
  pointLight.castShadow = true;

  const pointLight2 = new THREE.PointLight(ROOM_COLORS.pointLightSecondary, 0.5, 100);
  pointLight2.position.set(-5, 3, 5);

  return [ambientLight, pointLight, pointLight2];
}

/**
 * Erstellt den Boden des Raums.
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object} Boden-Mesh.
 */
export function createFloor(THREE) {
  const floorGeometry = new THREE.PlaneGeometry(
    ROOM_DIMENSIONS.floorSize,
    ROOM_DIMENSIONS.floorSize,
  );
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: ROOM_COLORS.floor,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = ROOM_POSITIONS.floorY;
  floor.receiveShadow = true;
  return floor;
}

/**
 * Erstellt den Schreibtisch inkl. Beine (Beine werden der Szene hinzugefügt).
 * @param {Object} THREE - Three.js-Namespace (global).
 * @param {Object} scene - Three.js-Szene.
 * @returns {Object} Tisch-Mesh.
 */
export function createDesk(THREE, scene) {
  const deskGeometry = new THREE.BoxGeometry(
    ROOM_DIMENSIONS.deskWidth,
    ROOM_DIMENSIONS.deskHeight,
    ROOM_DIMENSIONS.deskDepth,
  );
  const deskMaterial = new THREE.MeshStandardMaterial({ color: ROOM_COLORS.desk });
  const desk = new THREE.Mesh(deskGeometry, deskMaterial);
  desk.position.y = 0;
  desk.castShadow = true;
  desk.receiveShadow = true;

  // Desk legs
  const legGeometry = new THREE.BoxGeometry(
    ROOM_DIMENSIONS.legWidth,
    ROOM_DIMENSIONS.legHeight,
    ROOM_DIMENSIONS.legWidth,
  );
  const legMaterial = new THREE.MeshStandardMaterial({ color: ROOM_COLORS.floor });
  const legPositions = [
    [-ROOM_DIMENSIONS.legOffsetX, ROOM_DIMENSIONS.legOffsetY, ROOM_DIMENSIONS.legOffsetZ],
    [ROOM_DIMENSIONS.legOffsetX, ROOM_DIMENSIONS.legOffsetY, ROOM_DIMENSIONS.legOffsetZ],
    [-ROOM_DIMENSIONS.legOffsetX, ROOM_DIMENSIONS.legOffsetY, -ROOM_DIMENSIONS.legOffsetZ],
    [ROOM_DIMENSIONS.legOffsetX, ROOM_DIMENSIONS.legOffsetY, -ROOM_DIMENSIONS.legOffsetZ],
  ];
  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(...pos);
    leg.castShadow = true;
    scene.add(leg);
  });

  return desk;
}

/**
 * Erstellt den Laptop (klickbares Objekt).
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object} Laptop-Gruppe.
 */
export function createLaptop(THREE) {
  const laptopGroup = new THREE.Group();

  const laptopBaseGeometry = new THREE.BoxGeometry(
    ROOM_DIMENSIONS.laptopWidth,
    ROOM_DIMENSIONS.laptopBaseHeight,
    ROOM_DIMENSIONS.laptopDepth,
  );
  const laptopMaterial = new THREE.MeshStandardMaterial({
    color: ROOM_COLORS.laptop,
    metalness: 0.5,
    roughness: 0.4,
  });
  const laptopBase = new THREE.Mesh(laptopBaseGeometry, laptopMaterial);
  laptopBase.castShadow = true;
  laptopGroup.add(laptopBase);

  const laptopScreenGeometry = new THREE.BoxGeometry(
    ROOM_DIMENSIONS.laptopWidth,
    ROOM_DIMENSIONS.laptopScreenHeight,
    ROOM_DIMENSIONS.laptopScreenDepth,
  );
  const laptopScreen = new THREE.Mesh(laptopScreenGeometry, laptopMaterial);
  laptopScreen.position.set(0, 0.4, -0.4);
  laptopScreen.rotation.x = 0.2;
  laptopScreen.castShadow = true;
  laptopGroup.add(laptopScreen);

  const screenGlowGeometry = new THREE.PlaneGeometry(
    ROOM_DIMENSIONS.screenGlowWidth,
    ROOM_DIMENSIONS.screenGlowHeight,
  );
  const screenGlowMaterial = new THREE.MeshBasicMaterial({
    color: ROOM_COLORS.screenGlow,
    transparent: true,
    opacity: ROOM_DIMENSIONS.screenGlowOpacity,
  });
  const screenGlow = new THREE.Mesh(screenGlowGeometry, screenGlowMaterial);
  screenGlow.position.set(0, 0.4, -0.37);
  screenGlow.rotation.x = 0.2;
  laptopGroup.add(screenGlow);

  laptopGroup.position.set(
    ROOM_POSITIONS.laptop.x,
    ROOM_POSITIONS.laptop.y,
    ROOM_POSITIONS.laptop.z,
  );
  laptopGroup.userData = { name: "laptop", clickable: true };
  return laptopGroup;
}

/**
 * Erstellt die Kaffee-Tasse (klickbares Objekt).
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object} Tassen-Gruppe.
 */
export function createCoffeeCup(THREE) {
  const cupGroup = new THREE.Group();

  const cupGeometry = new THREE.CylinderGeometry(
    ROOM_DIMENSIONS.cupTopRadius,
    ROOM_DIMENSIONS.cupBottomRadius,
    ROOM_DIMENSIONS.cupHeight,
    16,
  );
  const cupMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const cup = new THREE.Mesh(cupGeometry, cupMaterial);
  cup.position.y = 0.15;
  cup.castShadow = true;
  cupGroup.add(cup);

  const coffeeGeometry = new THREE.CircleGeometry(ROOM_DIMENSIONS.coffeeRadius, 16);
  const coffeeMaterial = new THREE.MeshBasicMaterial({ color: ROOM_COLORS.coffee });
  const coffee = new THREE.Mesh(coffeeGeometry, coffeeMaterial);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.28;
  cupGroup.add(coffee);

  const handleGeometry = new THREE.TorusGeometry(
    ROOM_DIMENSIONS.handleRadius,
    ROOM_DIMENSIONS.handleTube,
    8,
    16,
    Math.PI,
  );
  const handle = new THREE.Mesh(handleGeometry, cupMaterial);
  handle.position.set(0.15, 0.15, 0);
  handle.rotation.z = -Math.PI / 2;
  cupGroup.add(handle);

  cupGroup.position.set(ROOM_POSITIONS.coffee.x, ROOM_POSITIONS.coffee.y, ROOM_POSITIONS.coffee.z);
  cupGroup.userData = { name: "coffee", clickable: true };
  return cupGroup;
}

/**
 * Erstellt die Pflanze (klickbares Objekt).
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object} Pflanzen-Gruppe.
 */
export function createPlant(THREE) {
  const plantGroup = new THREE.Group();

  const potGeometry = new THREE.CylinderGeometry(
    ROOM_DIMENSIONS.potTopRadius,
    ROOM_DIMENSIONS.potBottomRadius,
    ROOM_DIMENSIONS.potHeight,
    16,
  );
  const potMaterial = new THREE.MeshStandardMaterial({ color: ROOM_COLORS.pot });
  const pot = new THREE.Mesh(potGeometry, potMaterial);
  pot.position.y = 0.15;
  pot.castShadow = true;
  plantGroup.add(pot);

  const stemGeometry = new THREE.CylinderGeometry(
    ROOM_DIMENSIONS.stemRadius,
    ROOM_DIMENSIONS.stemRadius,
    ROOM_DIMENSIONS.stemHeight,
    8,
  );
  const stemMaterial = new THREE.MeshStandardMaterial({ color: ROOM_COLORS.stem });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.55;
  plantGroup.add(stem);

  const leafGeometry = new THREE.SphereGeometry(ROOM_DIMENSIONS.leafRadius, 8, 8);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: ROOM_COLORS.leaf });
  for (let i = 0; i < ROOM_DIMENSIONS.leafCount; i++) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.y = 0.6 + i * 0.08;
    leaf.position.x = Math.sin(i * 0.8) * 0.15;
    leaf.scale.y = 0.3;
    plantGroup.add(leaf);
  }

  plantGroup.position.set(ROOM_POSITIONS.plant.x, ROOM_POSITIONS.plant.y, ROOM_POSITIONS.plant.z);
  plantGroup.userData = { name: "plant", clickable: true };
  return plantGroup;
}

/**
 * Erstellt das Buch-Regal (klickbares Objekt).
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object} Bücher-Gruppe.
 */
export function createBooks(THREE) {
  const booksGroup = new THREE.Group();

  ROOM_COLORS.books.forEach((color, i) => {
    const bookGeometry = new THREE.BoxGeometry(
      ROOM_DIMENSIONS.bookWidth,
      0.5 - i * 0.05,
      ROOM_DIMENSIONS.bookDepth,
    );
    const bookMaterial = new THREE.MeshStandardMaterial({ color: color });
    const book = new THREE.Mesh(bookGeometry, bookMaterial);
    book.position.set(0, 0.25 - i * 0.02, i * 0.06);
    book.rotation.y = i * 0.1;
    book.castShadow = true;
    booksGroup.add(book);
  });

  booksGroup.position.set(ROOM_POSITIONS.books.x, ROOM_POSITIONS.books.y, ROOM_POSITIONS.books.z);
  booksGroup.userData = { name: "books", clickable: true };
  return booksGroup;
}

/**
 * Erstellt alle klickbaren Raum-Objekte (Reihenfolge: Laptop, Kaffee, Pflanze, Bücher).
 * @param {Object} THREE - Three.js-Namespace (global).
 * @returns {Object[]} Interaktive Objekt-Gruppen.
 */
export function createRoomObjects(THREE) {
  return [createLaptop(THREE), createCoffeeCup(THREE), createPlant(THREE), createBooks(THREE)];
}
