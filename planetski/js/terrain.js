/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Terrain & Pisten
 */

// ===== Konstanten =====
const HEIGHTMAP_RESOLUTION = 50;
const MOUNTAIN_HEIGHT = 20;
const DETAIL_HEIGHT_1 = 2;
const DETAIL_HEIGHT_2 = 0.5;
const TREE_COUNT = 200;
const TREE_MIN_HEIGHT = 3;
const TREE_MAX_HEIGHT = 12;
const SNOWFALL_PARTICLE_COUNT = 2000;
const SNOWFALL_RESET_HEIGHT = 30;
const VALLEY_MAX_HEIGHT = 2;
const FOREST_MAX_HEIGHT = 10;
const ROCK_MAX_HEIGHT = 18;

class Terrain {
  /**
   * Erstellt das Terrain mit Höhenkarte, Mesh und Bäumen.
   * @param {number} size - Kantenlänge der Karte in Metern.
   * @param {Object} scene - Three.js-Szene.
   */
  constructor(size, scene) {
    this.size = size;
    this.scene = scene;
    this.heightMap = [];
    this.slopeMap = new Map(); // Speichert welche Zellen Pisten sind

    this.generateHeightMap();
    this.createTerrain();
    this.createTrees();
  }

  /**
   * Generiert die prozedurale Höhenkarte (Mehrfrequenz-Sinus).
   * @returns {void}
   */
  generateHeightMap() {
    // Prozedurale Höhengenerierung
    const resolution = HEIGHTMAP_RESOLUTION;
    for (let x = 0; x <= resolution; x++) {
      this.heightMap[x] = [];
      for (let z = 0; z <= resolution; z++) {
        // Kombination aus mehreren Frequenzen für natürlichen Look
        const nx = x / resolution;
        const nz = z / resolution;

        // Hauptberg
        let height = Math.sin(nx * Math.PI) * Math.sin(nz * Math.PI) * MOUNTAIN_HEIGHT;

        // Kleinere Details
        height += Math.sin(nx * 10) * Math.cos(nz * 10) * DETAIL_HEIGHT_1;
        height += Math.sin(nx * 20) * Math.sin(nz * 20) * DETAIL_HEIGHT_2;

        // Höhenbereich: 0 bis 25
        height = Math.max(0, height);

        this.heightMap[x][z] = height;
      }
    }
  }

  /**
   * Erstellt das Terrain-Mesh mit Vertex-Farben und Grid-Helper.
   * @returns {void}
   */
  createTerrain() {
    // Boden-Geometrie mit Vertex-Colors für Höhenstufen
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.heightMap.length - 1,
      this.heightMap[0].length - 1,
    );

    const positions = geometry.attributes.position.array;
    const colors = [];

    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor((i / 3) % this.heightMap.length);
      const z = Math.floor(i / 3 / this.heightMap.length);

      const height = this.heightMap[x]?.[z] || 0;
      positions[i + 2] = height; // Z is up in Three.js (rotated later)

      // Farbe basierend auf Höhe
      const color = this.getTerrainColor(height);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.x = -Math.PI / 2;
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Gitter für Editor-Modus
    this.gridHelper = new THREE.GridHelper(this.size, 20, 0x4ecca3, 0x4a5568);
    this.gridHelper.position.y = 0.1;
    this.scene.add(this.gridHelper);
  }

  /**
   * Liefert die Vertex-Farbe für eine Terrain-Höhe.
   * @param {number} height - Höhe.
   * @returns {Object} THREE.Color.
   */
  getTerrainColor(height) {
    if (height < VALLEY_MAX_HEIGHT) {
      // Tal: Grün
      return new THREE.Color(0x228b22);
    } else if (height < FOREST_MAX_HEIGHT) {
      // Unterer Hang: Wald
      return new THREE.Color(0x2d5a3d);
    } else if (height < ROCK_MAX_HEIGHT) {
      // Mittlerer Hang: Fels/Schnee-Übergang
      return new THREE.Color(0x808080);
    } else {
      // Gipfel: Schnee
      return new THREE.Color(0xffffff);
    }
  }

  /**
   * Verteilt zufällige Bäume im mittleren Höhenbereich.
   * @returns {void}
   */
  createTrees() {
    // Zufällige Bäume auf dem Hang
    const treeCount = TREE_COUNT;

    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * this.size * 0.8;
      const z = (Math.random() - 0.5) * this.size * 0.8;
      const height = this.getHeightAt(x, z);

      // Nur Bäume im mittleren Höhenbereich
      if (height > TREE_MIN_HEIGHT && height < TREE_MAX_HEIGHT) {
        this.createTree(x, z, height);
      }
    }
  }

  /**
   * Erstellt einen einzelnen Baum (Stamm, Krone, Schnee).
   * @param {number} x - X-Position.
   * @param {number} z - Z-Position.
   * @param {number} y - Höhe (Terrain).
   * @returns {void}
   */
  createTree(x, z, y) {
    const treeGroup = new THREE.Group();

    // Stamm
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3728 }),
    );
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Krone (mehrere Ebenen)
    const levels = 3;
    for (let i = 0; i < levels; i++) {
      const size = 1.5 - i * 0.3;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(size, 1.5, 6),
        new THREE.MeshStandardMaterial({
          color: i === levels - 1 ? 0x1a5c3a : 0x0d3320,
          roughness: 0.9,
        }),
      );
      cone.position.y = 1.5 + i * 0.8;
      cone.castShadow = true;
      treeGroup.add(cone);
    }

    // Schnee auf dem Baum
    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    snow.position.y = 3.5;
    treeGroup.add(snow);

    treeGroup.position.set(x, y, z);

    // Zufällige Rotation und Skalierung
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4;
    treeGroup.scale.set(scale, scale, scale);

    this.scene.add(treeGroup);
  }

  /**
   * Interpolierte Terrain-Höhe an einer Position (bilinear).
   * @param {number} x - X-Position.
   * @param {number} z - Z-Position.
   * @returns {number} Höhe.
   */
  getHeightAt(x, z) {
    // Interpolierte Höhe an einer Position
    const resolution = this.heightMap.length - 1;
    const halfSize = this.size / 2;

    const nx = ((x + halfSize) / this.size) * resolution;
    const nz = ((z + halfSize) / this.size) * resolution;

    const x0 = Math.floor(nx);
    const z0 = Math.floor(nz);
    const x1 = Math.min(x0 + 1, resolution);
    const z1 = Math.min(z0 + 1, resolution);

    const fx = nx - x0;
    const fz = nz - z0;

    const h00 = this.heightMap[x0]?.[z0] || 0;
    const h10 = this.heightMap[x1]?.[z0] || 0;
    const h01 = this.heightMap[x0]?.[z1] || 0;
    const h11 = this.heightMap[x1]?.[z1] || 0;

    return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz;
  }

  /**
   * Erstellt eine Piste zwischen zwei Punkten (mit Schildern).
   * @param {number} startX - Start X.
   * @param {number} startZ - Start Z.
   * @param {number} endX - Ende X.
   * @param {number} endZ - Ende Z.
   * @param {string} difficulty - 'blue' | 'red' | 'black'.
   * @returns {Object} THREE.Group der Piste.
   */
  // Piste erstellen
  createSlope(startX, startZ, endX, endZ, difficulty = "blue") {
    const slopeGroup = new THREE.Group();

    // Pisten-Breite
    const width = difficulty === "black" ? 8 : difficulty === "red" ? 12 : 15;

    // Pisten-Geometrie
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
    const segments = Math.floor(length / 2);

    const geometry = new THREE.PlaneGeometry(width, length, 4, segments);
    const positions = geometry.attributes.position.array;

    // Pisten-Farbe
    const colors = {
      blue: 0x4169e1, // Blau - leicht
      red: 0xdc143c, // Rot - mittel
      black: 0x1a1a1a, // Schwarz - schwer
    };

    // Höhe entlang der Piste anpassen
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const z = startZ + (endZ - startZ) * t;
      const height = this.getHeightAt(x, z);

      // Alle Vertices in dieser Segment-Ebene anpassen
      for (let w = 0; w <= 4; w++) {
        const idx = (i * 5 + w) * 3;
        positions[idx + 2] = height + 0.05; // Leicht über Terrain
      }
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: colors[difficulty] || colors.blue,
      roughness: 0.4,
      metalness: 0.1,
    });

    const slope = new THREE.Mesh(geometry, material);
    slope.rotation.x = -Math.PI / 2;

    // Rotation zur Ausrichtung
    const angle = Math.atan2(endZ - startZ, endX - startX);
    slope.rotation.z = -angle + Math.PI / 2;

    // Position (Mitte zwischen Start und Ende)
    slope.position.set((startX + endX) / 2, 0, (startZ + endZ) / 2);

    slope.receiveShadow = true;
    slopeGroup.add(slope);

    // Pisten-Schilder
    this.createSlopeSigns(slopeGroup, startX, startZ, endX, endZ, difficulty);

    this.scene.add(slopeGroup);

    return slopeGroup;
  }

  /**
   * Erstellt die Pisten-Schilder am Startpunkt.
   * @param {Object} group - Pisten-Gruppe.
   * @param {number} startX - Start X.
   * @param {number} startZ - Start Z.
   * @param {number} endX - Ende X.
   * @param {number} endZ - Ende Z.
   * @param {string} difficulty - Schwierigkeit.
   * @returns {void}
   */
  createSlopeSigns(group, startX, startZ, endX, endZ, difficulty) {
    const colors = {
      blue: 0x4169e1,
      red: 0xdc143c,
      black: 0x1a1a1a,
    };

    // Schild am Start
    const signGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const signMaterial = new THREE.MeshStandardMaterial({
      color: colors[difficulty],
      emissive: colors[difficulty],
      emissiveIntensity: 0.3,
    });

    const sign = new THREE.Mesh(signGeometry, signMaterial);
    const startHeight = this.getHeightAt(startX, startZ);
    sign.position.set(startX - 2, startHeight + 1, startZ);
    group.add(sign);

    // Stange für Schild
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x4a5568 }),
    );
    pole.position.set(startX - 2, startHeight + 0.75, startZ);
    group.add(pole);
  }

  /**
   * Erstellt das Schneefall-Partikelsystem.
   * @returns {Object} THREE.Points Schneefall-System.
   */
  // Schneefall-Effekt
  createSnowfall() {
    const particleCount = SNOWFALL_PARTICLE_COUNT;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions.push(
        (Math.random() - 0.5) * this.size,
        Math.random() * 30,
        (Math.random() - 0.5) * this.size,
      );
      velocities.push(
        (Math.random() - 0.5) * 0.1,
        -Math.random() * 0.2 - 0.1,
        (Math.random() - 0.5) * 0.1,
      );
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
    });

    this.snowSystem = new THREE.Points(geometry, material);
    this.snowVelocities = velocities;
    this.scene.add(this.snowSystem);

    return this.snowSystem;
  }

  /**
   * Aktualisiert die Schneepartikel (Fall + Reset am Boden).
   * @returns {void}
   */
  updateSnowfall() {
    if (!this.snowSystem) return;

    const positions = this.snowSystem.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += this.snowVelocities[i];
      positions[i + 1] += this.snowVelocities[i + 1];
      positions[i + 2] += this.snowVelocities[i + 2];

      // Zurücksetzen wenn zu tief
      if (positions[i + 1] < 0) {
        positions[i + 1] = SNOWFALL_RESET_HEIGHT;
        positions[i] = (Math.random() - 0.5) * this.size;
        positions[i + 2] = (Math.random() - 0.5) * this.size;
      }
    }

    this.snowSystem.geometry.attributes.position.needsUpdate = true;
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Terrain };
}
