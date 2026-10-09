/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Skifahrer-Animationen
 */

// ===== Konstanten =====
const MAX_SKIERS = 200; // Maximum gleichzeitig sichtbar
const VISITORS_PER_SKIER = 10;
const SKIER_MIN_SPEED = 5;
const SKIER_SPEED_VARIANCE = 10;
const MAX_SKIER_SPEED = 25;
const DOWNHILL_SLOPE_THRESHOLD = 0.1;
const UPHILL_SLOPE_THRESHOLD = -0.05;
const LIFT_USE_CHANCE = 0.001;
const LIFT_NEAR_DISTANCE = 50;
const RESET_RADIUS = 40;

class SkierSystem {
  /**
   * Erstellt das Skifahrer-System.
   * @param {Object} scene - Three.js-Szene.
   * @param {Object} terrain - Terrain-Objekt.
   * @param {Array} lifts - Liste der Lifte.
   * @param {Array} buildings - Liste der Gebäude.
   */
  constructor(scene, terrain, lifts, buildings) {
    this.scene = scene;
    this.terrain = terrain;
    this.lifts = lifts;
    this.buildings = buildings;

    this.skiers = [];
    this.maxSkiers = MAX_SKIERS; // Maximum gleichzeitig sichtbar

    this.skierColors = [
      0xff0000, // Rot
      0x00ff00, // Grün
      0x0000ff, // Blau
      0xffff00, // Gelb
      0xff00ff, // Magenta
      0x00ffff, // Cyan
      0xffa500, // Orange
      0x800080, // Lila
      0xffc0cb, // Pink
      0xffffff, // Weiß
    ];

    this.jacketColors = [
      0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xff8844, 0x8844ff,
    ];
  }

  /**
   * Aktualisiert Spawn-Menge und Animationen aller Skifahrer.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @param {number} visitorCount - Aktuelle Besucherzahl.
   * @returns {void}
   */
  update(deltaTime, visitorCount) {
    // Skifahrer-Anzahl basierend auf Besuchern
    const targetSkiers = Math.min(this.maxSkiers, Math.floor(visitorCount / VISITORS_PER_SKIER));

    // Neue Skifahrer spawnen
    while (this.skiers.length < targetSkiers) {
      this.spawnSkier();
    }

    // Zu viele Skifahrer entfernen
    while (this.skiers.length > targetSkiers) {
      const skier = this.skiers.pop();
      this.scene.remove(skier.mesh);
    }

    // Skifahrer updaten
    this.skiers.forEach((skier) => {
      this.updateSkier(skier, deltaTime);
    });
  }

  /**
   * Spawnt einen neuen Skifahrer (Bergstation oder zufällig am Berg).
   * @returns {void}
   */
  spawnSkier() {
    // Zufällige Startposition (oben am Berg oder bei einem Lift)
    let startPos;

    if (this.lifts.length > 0 && Math.random() > 0.3) {
      // Starte bei einer Bergstation
      const lift = this.lifts[Math.floor(Math.random() * this.lifts.length)];
      startPos = {
        x: lift.endPos.x + (Math.random() - 0.5) * 10,
        z: lift.endPos.z + (Math.random() - 0.5) * 10,
      };
    } else {
      // Zufällig am Berg
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      startPos = {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
      };
    }

    const y = this.terrain ? this.terrain.getHeightAt(startPos.x, startPos.z) : 0;
    startPos.y = y;

    const skier = this.createSkierMesh();
    skier.mesh.position.set(startPos.x, startPos.y, startPos.z);
    this.scene.add(skier.mesh);

    this.skiers.push({
      mesh: skier.mesh,
      position: startPos,
      velocity: { x: 0, y: 0, z: 0 },
      state: "skiing", // skiing, on_lift, waiting
      speed: SKIER_MIN_SPEED + Math.random() * SKIER_SPEED_VARIANCE,
      turnSpeed: 0.5 + Math.random() * 1,
      direction: Math.random() * Math.PI * 2,
      target: null,
      animationTime: Math.random() * 100,
    });
  }

  /**
   * Erstellt das Mesh eines Skifahrers (Kopf, Körper, Beine, Ski, Stöcke).
   * @returns {Object} Mesh-Teile (mesh, body, head, leftSki, rightSki, leftPole, rightPole).
   */
  createSkierMesh() {
    const group = new THREE.Group();

    // Zufällige Farben
    const jacketColor = this.jacketColors[Math.floor(Math.random() * this.jacketColors.length)];
    const pantsColor = 0x333333; // Dunkle Hose

    // Körper (Zylinder + Kugeln für Capsule-Look)
    const bodyGroup = new THREE.Group();

    const bodyCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: jacketColor }),
    );
    bodyCyl.position.y = 0.8;
    bodyGroup.add(bodyCyl);

    // Obere Kugel
    const bodyTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshStandardMaterial({ color: jacketColor }),
    );
    bodyTop.position.y = 1.1;
    bodyGroup.add(bodyTop);

    // Untere Kugel
    const bodyBottom = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshStandardMaterial({ color: jacketColor }),
    );
    bodyBottom.position.y = 0.5;
    bodyGroup.add(bodyBottom);

    group.add(bodyGroup);

    // Kopf
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffccaa }),
    );
    head.position.y = 1.35;
    group.add(head);

    // Helm/Mütze
    const hat = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: this.skierColors[Math.floor(Math.random() * this.skierColors.length)],
      }),
    );
    hat.position.y = 1.38;
    group.add(hat);

    // Beine/Hose (Zylinder + Kugeln)
    const legsGroup = new THREE.Group();

    const legsCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: pantsColor }),
    );
    legsCyl.position.y = 0.3;
    legsGroup.add(legsCyl);

    const legsTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshStandardMaterial({ color: pantsColor }),
    );
    legsTop.position.y = 0.55;
    legsGroup.add(legsTop);

    const legsBottom = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshStandardMaterial({ color: pantsColor }),
    );
    legsBottom.position.y = 0.05;
    legsGroup.add(legsBottom);

    group.add(legsGroup);

    // Ski
    const skiGeo = new THREE.BoxGeometry(0.08, 0.02, 1.2);
    const skiMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const leftSki = new THREE.Mesh(skiGeo, skiMat);
    leftSki.position.set(-0.15, 0.02, 0);
    group.add(leftSki);

    const rightSki = new THREE.Mesh(skiGeo, skiMat);
    rightSki.position.set(0.15, 0.02, 0);
    group.add(rightSki);

    // Skistöcke
    const poleGeo = new THREE.CylinderGeometry(0.01, 0.01, 1, 4);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

    const leftPole = new THREE.Mesh(poleGeo, poleMat);
    leftPole.position.set(-0.35, 0.8, 0.2);
    leftPole.rotation.x = 0.3;
    leftPole.name = "leftPole"; // FIX: Name vergeben
    group.add(leftPole);

    const rightPole = new THREE.Mesh(poleGeo, poleMat);
    rightPole.position.set(0.35, 0.8, 0.2);
    rightPole.rotation.x = 0.3;
    rightPole.name = "rightPole"; // FIX: Name vergeben
    group.add(rightPole);

    // Schatten
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);

    return { mesh: group, body: bodyGroup, head, leftSki, rightSki, leftPole, rightPole };
  }

  /**
   * Dispatche die Skifahrer-Animation je nach Zustand.
   * @param {Object} skier - Skifahrer-Objekt.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @returns {void}
   */
  updateSkier(skier, deltaTime) {
    skier.animationTime += deltaTime;

    switch (skier.state) {
      case "skiing":
        this.updateSkiing(skier, deltaTime);
        break;
      case "on_lift":
        this.updateOnLift(skier, deltaTime);
        break;
      case "waiting":
        this.updateWaiting(skier, deltaTime);
        break;
    }
  }

  /**
   * Skifahrer fährt (Bewegung, Hangabtrieb, Neigung).
   * @param {Object} skier - Skifahrer-Objekt.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @returns {void}
   */
  updateSkiing(skier, deltaTime) {
    // Zufällige Richtungsänderung (carving)
    skier.direction += Math.sin(skier.animationTime * skier.turnSpeed) * 0.02;

    // Bewegung
    const dx = Math.cos(skier.direction) * skier.speed * deltaTime;
    const dz = Math.sin(skier.direction) * skier.speed * deltaTime;

    skier.position.x += dx;
    skier.position.z += dz;

    // Höhe anpassen
    if (this.terrain) {
      skier.position.y = this.terrain.getHeightAt(skier.position.x, skier.position.z);

      // Hangabtrieb
      const heightAhead = this.terrain.getHeightAt(
        skier.position.x + dx * 2,
        skier.position.z + dz * 2,
      );
      const slope = (skier.position.y - heightAhead) / (skier.speed * deltaTime * 2);

      // Schneller bergab, langsamer bergauf
      if (slope > DOWNHILL_SLOPE_THRESHOLD) {
        skier.speed = Math.min(skier.speed * 1.01, MAX_SKIER_SPEED);
      } else if (slope < UPHILL_SLOPE_THRESHOLD) {
        skier.speed *= 0.99;
      }
    }

    // Skifahrer neigt sich in Kurven
    const lean = Math.sin(skier.animationTime * skier.turnSpeed) * 0.3;
    skier.mesh.rotation.z = lean;
    skier.mesh.rotation.y = -skier.direction;

    // FIX: Stöcke per Name animieren, robuster gegen Kinderzahl-Änderungen
    const poleSwing = Math.sin(skier.animationTime * 3) * 0.3;
    const leftPole = skier.mesh.getObjectByName("leftPole");
    const rightPole = skier.mesh.getObjectByName("rightPole");
    if (leftPole) leftPole.rotation.x = 0.3 + poleSwing;
    if (rightPole) rightPole.rotation.x = 0.3 - poleSwing;

    // Position updaten
    skier.mesh.position.set(skier.position.x, skier.position.y, skier.position.z);

    // Außerhalb der Karte?
    const mapSize = this.terrain ? this.terrain.size / 2 : 60;
    if (Math.abs(skier.position.x) > mapSize || Math.abs(skier.position.z) > mapSize) {
      // Zurücksetzen zum Start
      this.resetSkier(skier);
    }

    // Zufällig Lift benutzen
    if (Math.random() < LIFT_USE_CHANCE) {
      this.findNearestLift(skier);
    }
  }

  /**
   * Animation während der Liftfahrt (langsames Drehen).
   * @param {Object} skier - Skifahrer-Objekt.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @returns {void}
   */
  updateOnLift(skier, deltaTime) {
    // Wird vom Lift-System gemanagt
    // Hier nur Animation
    skier.mesh.rotation.y += deltaTime;
  }

  /**
   * Animation während der Lift-Wartezeit (Wechsel zu 'skiing' nach 5s).
   * @param {Object} skier - Skifahrer-Objekt.
   * @param {number} deltaTime - Vergangene Zeit in Sekunden.
   * @returns {void}
   */
  updateWaiting(skier, deltaTime) {
    // Wartet auf Lift
    skier.mesh.rotation.y = Math.sin(skier.animationTime) * 0.2;

    // Nach kurzer Weile weiterfahren
    if (skier.animationTime > 5) {
      skier.state = "skiing";
    }
  }

  /**
   * Findet den nächsten Lift in Reichweite und fährt Richtung Bergstation.
   * @param {Object} skier - Skifahrer-Objekt.
   * @returns {void}
   */
  findNearestLift(skier) {
    let nearest = null;
    let nearestDist = Infinity;

    this.lifts.forEach((lift) => {
      if (!lift.endPos) return;

      const dx = lift.endPos.x - skier.position.x;
      const dz = lift.endPos.z - skier.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < nearestDist && dist < LIFT_NEAR_DISTANCE) {
        nearestDist = dist;
        nearest = lift;
      }
    });

    if (nearest) {
      // Zum Lift fahren
      skier.target = nearest.endPos;
      const dx = skier.target.x - skier.position.x;
      const dz = skier.target.z - skier.position.z;
      skier.direction = Math.atan2(dz, dx);
    }
  }

  /**
   * Setzt den Skifahrer zurück an eine Bergstation (oder zufällig).
   * @param {Object} skier - Skifahrer-Objekt.
   * @returns {void}
   */
  resetSkier(skier) {
    // Zurück zum Start (bei einer Bergstation)
    if (this.lifts.length > 0) {
      const lift = this.lifts[Math.floor(Math.random() * this.lifts.length)];
      skier.position.x = lift.endPos.x + (Math.random() - 0.5) * 10;
      skier.position.z = lift.endPos.z + (Math.random() - 0.5) * 10;
    } else {
      skier.position.x = (Math.random() - 0.5) * RESET_RADIUS;
      skier.position.z = (Math.random() - 0.5) * RESET_RADIUS;
    }

    skier.position.y = this.terrain
      ? this.terrain.getHeightAt(skier.position.x, skier.position.z)
      : 0;
    skier.direction = Math.random() * Math.PI * 2;
    skier.speed = SKIER_MIN_SPEED + Math.random() * SKIER_SPEED_VARIANCE;
    skier.state = "skiing";
  }

  /**
   * Entfernt alle Skifahrer aus der Szene.
   * @returns {void}
   */
  dispose() {
    this.skiers.forEach((skier) => {
      this.scene.remove(skier.mesh);
    });
    this.skiers = [];
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SkierSystem };
}
