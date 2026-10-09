/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Pisten-System
 */

// ===== Konstanten =====
const CURVE_POINT_COUNT = 50;
const CURVE_OFFSET_RANGE = 20;
const AUTO_SLOPE_MAX_DIST = 80;
const AUTO_SLOPE_MIN_DIST = 20;
const AUTO_SLOPE_MIN_HEIGHT_DIFF = 10;
const AUTO_SLOPE_BLUE_MIN_DIST = 60;
const AUTO_SLOPE_RED_MIN_DIST = 40;
const SNOWPARK_FEATURE_COUNT = 3;

class SlopeSystem {
  /**
   * Erstellt das Pisten-System.
   * @param {Object} scene - Three.js-Szene.
   * @param {Object} terrain - Terrain-Objekt.
   */
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.slopes = [];
    this.slopeMeshes = [];

    this.difficulties = {
      green: { color: 0x228b22, width: 14, name: "Green" },
      blue: { color: 0x4169e1, width: 12, name: "Blue" },
      red: { color: 0xdc143c, width: 10, name: "Red" },
      black: { color: 0x1a1a1a, width: 8, name: "Black" },
      doubleBlack: { color: 0x050505, width: 6, name: "Double Black" },
      snowpark: { color: 0xff8c00, width: 15, name: "Snowpark" },
    };
  }

  /**
   * Zeichnet eine Piste von Start zu Ende (Bezier-Kurve, Schilder, ggf. Snowpark).
   * @param {number} startX - Start X.
   * @param {number} startZ - Start Z.
   * @param {number} endX - Ende X.
   * @param {number} endZ - Ende Z.
   * @param {string} difficulty - 'green' | 'blue' | 'red' | 'black' | 'doubleBlack' | 'snowpark'.
   * @returns {Object} Pisten-Objekt.
   */
  // Piste von Start zu Ende zeichnen
  createSlope(startX, startZ, endX, endZ, difficulty = "blue") {
    const config = this.difficulties[difficulty] || this.difficulties["blue"];

    // Berechne Kontrollpunkte für eine natürliche Pisten-Kurve
    const midX = (startX + endX) / 2;
    const midZ = (startZ + endZ) / 2;

    // Zufällige Abweichung für natürlichen Verlauf
    const offsetX = (Math.random() - 0.5) * CURVE_OFFSET_RANGE;
    const offsetZ = (Math.random() - 0.5) * CURVE_OFFSET_RANGE;

    const controlPoint = {
      x: midX + offsetX,
      z: midZ + offsetZ,
    };

    // Erstelle Kurvenpunkte
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(startX, 0, startZ),
      new THREE.Vector3(controlPoint.x, 0, controlPoint.z),
      new THREE.Vector3(endX, 0, endZ),
    );

    const points = curve.getPoints(CURVE_POINT_COUNT);

    // Höhen anpassen
    points.forEach((p) => {
      p.y = this.terrain.getHeightAt(p.x, p.z) + 0.1;
    });

    // Pisten-Mesh erstellen
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const colors = [];

    const color = new THREE.Color(config.color);
    const halfWidth = config.width / 2;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Richtung
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const len = Math.sqrt(dx * dx + dz * dz);

      if (len === 0) continue; // NaN-Guard

      const nx = (-dz / len) * halfWidth;
      const nz = (dx / len) * halfWidth;

      // Vier Vertices pro Segment
      const baseIdx = vertices.length / 3;

      // Linker Rand
      vertices.push(p1.x + nx, p1.y, p1.z + nz);
      vertices.push(p2.x + nx, p2.y, p2.z + nz);

      // Rechter Rand
      vertices.push(p1.x - nx, p1.y, p1.z - nz);
      vertices.push(p2.x - nx, p2.y, p2.z - nz);

      // Farben
      for (let j = 0; j < 4; j++) {
        colors.push(color.r, color.g, color.b);
      }

      // Indizes für zwei Dreiecke
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Snowpark Features
    if (difficulty === "snowpark") {
      this.createSnowparkFeatures(points);
    }

    // Pisten-Schilder
    this.createSlopeSigns(startX, startZ, endX, endZ, difficulty);

    // Speichern
    const slope = {
      start: { x: startX, z: startZ },
      end: { x: endX, z: endZ },
      control: controlPoint,
      difficulty: difficulty,
      mesh: mesh,
      points: points,
    };

    this.slopes.push(slope);
    this.slopeMeshes.push(mesh);

    return slope;
  }

  /**
   * Erstellt die Pisten-Schilder am Start und Ende.
   * @param {number} startX - Start X.
   * @param {number} startZ - Start Z.
   * @param {number} endX - Ende X.
   * @param {number} endZ - Ende Z.
   * @param {string} difficulty - Schwierigkeit.
   * @returns {void}
   */
  createSlopeSigns(startX, startZ, endX, endZ, difficulty) {
    const config = this.difficulties[difficulty] || this.difficulties["blue"];
    const color = config.color;

    const startY = this.terrain.getHeightAt(startX, startZ);
    const endY = this.terrain.getHeightAt(endX, endZ);

    // Schild am Start
    this.createSign(startX, startY, startZ, color, true);

    // Schild am Ende
    this.createSign(endX, endY, endZ, color, false);
  }

  /**
   * Erstellt ein einzelnes Pisten-Schild mit Stange.
   * @param {number} x - X-Position.
   * @param {number} y - Höhe.
   * @param {number} z - Z-Position.
   * @param {number} color - Farbe (Hex).
   * @param {boolean} isStart - true = Startschild.
   * @returns {void}
   */
  createSign(x, y, z, color, isStart) {
    const group = new THREE.Group();

    // Stange
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x666666 }),
    );
    pole.position.y = 1;
    group.add(pole);

    // Schild
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.05),
      new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
      }),
    );
    sign.position.y = 2;
    group.add(sign);

    group.position.set(x - 2, y, z);
    this.scene.add(group);
  }

  /**
   * Platziert Kicker/Rails entlang der Snowpark-Piste.
   * @param {Array} points - Pisten-Kurvenpunkte.
   * @returns {void}
   */
  createSnowparkFeatures(points) {
    // Platziere ein paar Kicker / Rails entlang der Piste
    const numFeatures = SNOWPARK_FEATURE_COUNT;
    const step = Math.floor(points.length / (numFeatures + 1));

    for (let i = 1; i <= numFeatures; i++) {
      const p = points[i * step];

      const feature = new THREE.Group();

      // Ein Kicker (Rampe)
      const kickerGeo = new THREE.BoxGeometry(3, 1.5, 4);
      // Schräge den Kicker an
      const positions = kickerGeo.attributes.position.array;
      for (let j = 0; j < positions.length; j += 3) {
        if (positions[j + 2] > 0 && positions[j + 1] > 0) {
          positions[j + 1] -= 1.5; // Vorne runterziehen
        }
      }
      kickerGeo.computeVertexNormals();

      const kicker = new THREE.Mesh(
        kickerGeo,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
      );
      feature.add(kicker);

      feature.position.set(p.x, p.y + 0.2, p.z);
      // Finde die Richtung der Piste an diesem Punkt
      const pNext = points[i * step + 1];
      feature.lookAt(pNext.x, pNext.y, pNext.z);

      this.scene.add(feature);
    }
  }

  /**
   * Findet den nächsten Pisten-Punkt für eine Position (für Skifahrer).
   * @param {number} x - X-Position.
   * @param {number} z - Z-Position.
   * @returns {Object|null} Nächster Kurvenpunkt oder null.
   */
  // Finde Pisten-Nähe für Skifahrer
  getNearestSlopePoint(x, z) {
    let nearest = null;
    let nearestDist = Infinity;

    this.slopes.forEach((slope) => {
      slope.points.forEach((p) => {
        const dx = p.x - x;
        const dz = p.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = p;
        }
      });
    });

    return nearest;
  }

  /**
   * Erstellt automatisch Pisten zwischen nahen Lift-Stationen (Bergab).
   * @param {Array} lifts - Liste der Lifte.
   * @returns {void}
   */
  // Pisten zwischen allen Lift-Stationen automatisch erstellen
  autoGenerateSlopes(lifts) {
    // Sammle alle Stationen
    const stations = [];
    lifts.forEach((lift) => {
      if (lift.startPos && lift.endPos) {
        stations.push(lift.startPos);
        stations.push(lift.endPos);
      }
    });

    // Erstelle Pisten zwischen nahen Stationen
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const s1 = stations[i];
        const s2 = stations[j];

        const dx = s1.x - s2.x;
        const dz = s1.z - s2.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Nur wenn nah beieinander und Bergab
        if (dist < AUTO_SLOPE_MAX_DIST && dist > AUTO_SLOPE_MIN_DIST) {
          const h1 = this.terrain.getHeightAt(s1.x, s1.z);
          const h2 = this.terrain.getHeightAt(s2.x, s2.z);

          // Von hoch nach runter
          if (h1 > h2 + AUTO_SLOPE_MIN_HEIGHT_DIFF) {
            const difficulty =
              dist > AUTO_SLOPE_BLUE_MIN_DIST
                ? "blue"
                : dist > AUTO_SLOPE_RED_MIN_DIST
                  ? "red"
                  : "black";
            this.createSlope(s1.x, s1.z, s2.x, s2.z, difficulty);
          } else if (h2 > h1 + AUTO_SLOPE_MIN_HEIGHT_DIFF) {
            const difficulty =
              dist > AUTO_SLOPE_BLUE_MIN_DIST
                ? "blue"
                : dist > AUTO_SLOPE_RED_MIN_DIST
                  ? "red"
                  : "black";
            this.createSlope(s2.x, s2.z, s1.x, s1.z, difficulty);
          }
        }
      }
    }
  }

  /**
   * Entfernt alle Pisten aus der Szene.
   * @returns {void}
   */
  clearAll() {
    this.slopes.forEach((slope) => {
      this.scene.remove(slope.mesh);
    });
    this.slopes = [];
    this.slopeMeshes = [];
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SlopeSystem };
}
