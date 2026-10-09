// ===== EXPERIMENTAL.JS - Browser-Entry (ES Module) =====
// Kümmert sich um DOM & Three.js. Die reinen Logikfunktionen
// liegen in js/experimental/ und sind unit-testbar.

import {
  ROOM_COLORS,
  ROOM_CAMERA,
  ROOM_POSITIONS,
  ROOM_BEHAVIOR,
  CODING,
  SECRET_STYLES,
  CHAT,
  MATRIX,
} from "./js/experimental/constants.js";
import { generateAIResponse } from "./js/experimental/aiChat.js";
import { computeCodingHours, formatCodingDuration } from "./js/experimental/dashboard.js";
import { matchesKonamiSequence, pushKonamiKey } from "./js/experimental/konami.js";
import { isCorrectRiddleAnswer } from "./js/experimental/riddle.js";
import { createEggHuntState, recordEggFound } from "./js/experimental/easterEggs.js";
import {
  computeDragRotation,
  computeRaycastNDC,
  createLights,
  createFloor,
  createDesk,
  createRoomObjects,
} from "./js/experimental/threeRoom.js";
import { launchConfetti } from "./js/experimental/confetti.js";

// ===== 1. THREE.JS INTERAKTIVER RAUM =====
let scene,
  camera,
  renderer,
  objects = [];
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };

/**
 * Baut die Three.js-Szene auf und startet die Animation.
 * @returns {void}
 */
function initThreeJS() {
  const container = document.getElementById("three-container");
  if (!container) return;

  const canvas = document.getElementById("three-canvas");

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(ROOM_COLORS.background);

  // Camera
  camera = new THREE.PerspectiveCamera(
    ROOM_CAMERA.fov,
    container.clientWidth / container.clientHeight,
    ROOM_CAMERA.near,
    ROOM_CAMERA.far,
  );
  camera.position.z = ROOM_POSITIONS.cameraZ;
  camera.position.y = ROOM_POSITIONS.cameraY;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;

  // Lights, Floor, Desk
  createLights(THREE).forEach((light) => scene.add(light));
  scene.add(createFloor(THREE));
  scene.add(createDesk(THREE, scene));

  // Interaktive Objekte
  objects = createRoomObjects(THREE);
  objects.forEach((obj) => scene.add(obj));

  // Mouse Events
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("click", onMouseClick);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onMouseUp);

  // Handle resize
  window.addEventListener("resize", onWindowResize);

  animate();
}

/**
 * Startet das Ziehen (Maus).
 * @param {MouseEvent} event - Das mousedown-Event.
 * @returns {void}
 */
function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
}

/**
 * Dreht die Ziel-Rotation während des Ziehens (Neigung geclampt).
 * @param {MouseEvent} event - Das mousemove-Event.
 * @returns {void}
 */
function onMouseMove(event) {
  if (!isDragging) return;

  const deltaMove = {
    x: event.clientX - previousMousePosition.x,
    y: event.clientY - previousMousePosition.y,
  };

  targetRotation = computeDragRotation(targetRotation, deltaMove);

  previousMousePosition = { x: event.clientX, y: event.clientY };
}

/**
 * Beendet das Ziehen (Maus).
 * @returns {void}
 */
function onMouseUp() {
  isDragging = false;
}

/**
 * Startet das Ziehen (Touch, 1 Finger).
 * @param {TouchEvent} event - Das touchstart-Event.
 * @returns {void}
 */
function onTouchStart(event) {
  if (event.touches.length === 1) {
    isDragging = true;
    previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
}

/**
 * Dreht die Ziel-Rotation während des Ziehens (Touch, keine Neigungs-Begrenzung).
 * @param {TouchEvent} event - Das touchmove-Event.
 * @returns {void}
 */
function onTouchMove(event) {
  if (!isDragging || event.touches.length !== 1) return;

  const deltaMove = {
    x: event.touches[0].clientX - previousMousePosition.x,
    y: event.touches[0].clientY - previousMousePosition.y,
  };

  targetRotation = computeDragRotation(
    targetRotation,
    deltaMove,
    ROOM_BEHAVIOR.rotationSensitivity,
    null,
  );

  previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  event.preventDefault();
}

/**
 * Raycast bei Klick: Highlightet das getroffene Objekt und zeigt dessen Info.
 * @param {MouseEvent} event - Das click-Event.
 * @returns {void}
 */
function onMouseClick(event) {
  if (isDragging) return;

  const canvas = document.getElementById("three-canvas");
  const rect = canvas.getBoundingClientRect();

  const mouse = new THREE.Vector2();
  const ndc = computeRaycastNDC(event, rect);
  mouse.x = ndc.x;
  mouse.y = ndc.y;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    let object = intersects[0].object;
    while (object.parent && !object.userData.clickable) {
      object = object.parent;
    }

    if (object.userData.clickable) {
      highlightObject(object);
      showObjectInfo(object.userData.name);
    }
  }
}

/**
 * Lässt ein Objekt hüpfen (Bounce-Animation).
 * @param {Object} object - Das Three.js-Objekt.
 * @returns {void}
 */
function highlightObject(object) {
  const originalY = object.position.y;
  let bounce = 0;
  const animateBounce = () => {
    bounce += ROOM_BEHAVIOR.bounceStep;
    object.position.y = originalY + Math.sin(bounce) * ROOM_BEHAVIOR.bounceHeight;
    if (bounce < Math.PI) {
      requestAnimationFrame(animateBounce);
    } else {
      object.position.y = originalY;
    }
  };
  animateBounce();
}

/**
 * Hebt die Info-Karte eines Objekts hervor und scrollt zu ihr.
 * @param {string} name - Name des Objekts (laptop, coffee, plant, books).
 * @returns {void}
 */
function showObjectInfo(name) {
  const cards = document.querySelectorAll(".object-card");
  cards.forEach((card) => {
    card.style.borderColor = SECRET_STYLES.cardBorderColor;
    card.style.transform = "scale(1)";
  });

  const targetCard = document.querySelector(`[data-object="${name}"]`);
  if (targetCard) {
    targetCard.style.borderColor = SECRET_STYLES.highlightColor;
    targetCard.style.transform = "scale(1.05)";
    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      targetCard.style.borderColor = SECRET_STYLES.cardBorderColor;
      targetCard.style.transform = "scale(1)";
    }, SECRET_STYLES.secretResetMs);
  }
}

/**
 * Passt Kamera und Renderer an die Container-Größe an.
 * @returns {void}
 */
function onWindowResize() {
  const container = document.getElementById("three-container");
  if (!container || !camera || !renderer) return;

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Animations-Loop: weiche Rotation, schwebende Objekte, Rendering.
 * @returns {void}
 */
function animate() {
  requestAnimationFrame(animate);

  if (scene) {
    // Smooth camera rotation
    scene.rotation.y += (targetRotation.y - scene.rotation.y) * ROOM_BEHAVIOR.cameraSmoothing;
    scene.rotation.x += (targetRotation.x - scene.rotation.x) * ROOM_BEHAVIOR.cameraSmoothing;

    // Animate objects slightly
    objects.forEach((obj, index) => {
      obj.position.y +=
        Math.sin(Date.now() * ROOM_BEHAVIOR.objectFloatSpeed + index) *
        ROOM_BEHAVIOR.objectFloatAmplitude;
    });
  }

  renderer.render(scene, camera);
}

// ===== 2. DASHBOARD =====
/**
 * Initialisiert das Dashboard (Coding-Zeit + Datum).
 * @returns {void}
 */
function initDashboard() {
  // Update coding hours (simulated)
  updateCodingHours();
  setInterval(updateCodingHours, CODING.updateIntervalMs); // Update every minute

  // Set today's date
  const todayDate = document.getElementById("today-date");
  if (todayDate) {
    const options = { weekday: "short", day: "numeric", month: "short" };
    todayDate.textContent = new Date().toLocaleDateString("de-DE", options);
  }
}

/**
 * Aktualisiert die angezeigte Coding-Zeit des Tages.
 * @returns {void}
 */
function updateCodingHours() {
  const codingHours = document.getElementById("coding-hours");
  if (!codingHours) return;

  const { hours, minutes } = computeCodingHours(new Date());
  codingHours.textContent = formatCodingDuration(hours, minutes);
}

// ===== 3. SECRETS & EASTER EGGS =====
let eggHuntState = createEggHuntState();

// Konami Code
let konamiCode = [];

document.addEventListener("keydown", (e) => {
  konamiCode = pushKonamiKey(konamiCode, e.key);

  if (matchesKonamiSequence(konamiCode)) {
    unlockKonami();
  }
});

/**
 * Schaltet den Retro-Modus frei (Konami-Code gefunden) + Konfetti.
 * @returns {void}
 */
function unlockKonami() {
  const konamiBox = document.getElementById("konami-box");
  if (!konamiBox || konamiBox.classList.contains("unlocked")) return;

  konamiBox.classList.add("unlocked");
  konamiBox.querySelector(".secret-locked").classList.add("hidden");
  konamiBox.querySelector(".secret-unlocked").classList.remove("hidden");

  // Confetti effect
  launchConfetti();
}

/**
 * Prüft die Rätsel-Antwort und schaltet bei Erfolg den Inhalt frei.
 * @returns {void}
 */
export function checkRiddle() {
  const input = document.getElementById("riddle-answer");
  const answer = input.value.toLowerCase().trim();

  if (isCorrectRiddleAnswer(answer)) {
    const riddleBox = document.getElementById("riddle-box");
    riddleBox.classList.add("unlocked");
    riddleBox.querySelector(".secret-locked").classList.add("hidden");
    riddleBox.querySelector(".secret-unlocked").classList.remove("hidden");
    launchConfetti();
  } else {
    input.style.borderColor = SECRET_STYLES.errorColor;
    setTimeout(() => {
      input.style.borderColor = "";
    }, SECRET_STYLES.errorResetMs);
  }
}

/**
 * Registriert ein gefundenes Easter Egg und aktualisiert die Anzeige.
 * @param {number} eggNumber - Nummer des Eggs (1–5).
 * @returns {void}
 */
export function findEgg(eggNumber) {
  const result = recordEggFound(eggHuntState, eggNumber);
  if (result.found === eggHuntState.found) return; // Schon gefunden
  eggHuntState = result;

  const eggIndicator = document.getElementById(`egg-${eggNumber}`);
  if (eggIndicator) {
    eggIndicator.classList.add("found");
  }

  document.getElementById("eggs-found").textContent = eggHuntState.count;

  // Hide the found egg button
  const eggButton = document.getElementById(`hidden-egg-${eggNumber}`);
  if (eggButton) {
    eggButton.style.display = "none";
  }

  if (eggHuntState.complete) {
    const easterBox = document.getElementById("easter-box");
    easterBox.classList.add("unlocked");
    easterBox.querySelector(".secret-locked").classList.add("hidden");
    easterBox.querySelector(".secret-unlocked").classList.remove("hidden");
    launchConfetti();
  }
}

// ===== 4. JOURNEY SCROLL ANIMATION =====
/**
 * Scroll-Animationen für die Journey-Kapitel (Parallax + Fortschrittsbalken).
 * @returns {void}
 */
function initJourneyScroll() {
  const chapters = document.querySelectorAll(".journey-chapter");
  const progressFill = document.getElementById("journey-progress");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.3 },
  );

  chapters.forEach((chapter) => observer.observe(chapter));

  // Parallax effect for chapter visuals
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;

    chapters.forEach((chapter) => {
      const rect = chapter.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = (centerY - viewportCenter) / window.innerHeight;

      const layer1 = chapter.querySelector(".layer-1");
      const layer2 = chapter.querySelector(".layer-2");

      if (layer1) {
        layer1.style.transform = `translateY(${distance * -30}px)`;
      }
      if (layer2) {
        layer2.style.transform = `translateY(${distance * -50}px)`;
      }
    });

    // Update progress bar
    const journeySection = document.getElementById("journey");
    if (journeySection && progressFill) {
      const rect = journeySection.getBoundingClientRect();
      const sectionHeight = journeySection.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(100, (scrolled / (sectionHeight - window.innerHeight)) * 100);
      progressFill.style.height = `${progress}%`;
    }
  });
}

// ===== 5. AI CHAT =====
/**
 * Enter im Chat-Input sendet die Nachricht.
 * @param {KeyboardEvent} event - Das keypress-Event.
 * @returns {void}
 */
export function handleChatKeypress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

/**
 * Setzt den Vorschals-Text ins Input-Feld und sendet ihn.
 * @param {string} text - Der Vorschlag-Text.
 * @returns {void}
 */
export function sendSuggestion(text) {
  document.getElementById("chat-input").value = text;
  sendMessage();
}

/**
 * Sendet die Nutzernachricht und simuliert die KI-Antwort.
 * @returns {void}
 */
export function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  // Simulate AI thinking
  setTimeout(
    () => {
      const response = generateAIResponse(message);
      addMessage(response, "ai");
    },
    CHAT.thinkingDelayMinMs + Math.random() * CHAT.thinkingDelayRandomMs,
  );
}

/**
 * Fügt eine Nachricht (user/ai) ein Chat-Verlauf hinzu.
 * @param {string} text - Nachrichten-Text.
 * @param {string} sender - 'user' oder 'ai'.
 * @returns {void}
 */
function addMessage(text, sender) {
  const container = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const avatar = sender === "ai" ? CHAT.aiAvatar : CHAT.userAvatar;

  messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

// ===== RETRO MODE =====
/**
 * Aktiviert den Retro-Modus (Overlay).
 * @returns {void}
 */
export function activateRetroMode() {
  document.getElementById("retro-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

/**
 * Deaktiviert den Retro-Modus (Overlay).
 * @returns {void}
 */
export function deactivateRetroMode() {
  document.getElementById("retro-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}

// ===== MATRIX MODE =====
let matrixInterval;

/**
 * Schaltet den Matrix-Modus an/aus.
 * @returns {void}
 */
export function toggleMatrixMode() {
  const canvas = document.getElementById("matrix-canvas");
  const closeBtn = document.getElementById("matrix-close");

  if (canvas.classList.contains("hidden")) {
    canvas.classList.remove("hidden");
    closeBtn.classList.remove("hidden");
    startMatrixEffect();
  } else {
    canvas.classList.add("hidden");
    closeBtn.classList.add("hidden");
    stopMatrixEffect();
  }
}

/**
 * Startet den Matrix-Regen (Canvas 2D).
 * @returns {void}
 */
function startMatrixEffect() {
  const canvas = document.getElementById("matrix-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%^&*";
  const fontSize = MATRIX.fontSize;
  const columns = canvas.width / fontSize;
  const drops = [];

  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * MATRIX.initialDropOffset;
  }

  function draw() {
    ctx.fillStyle = MATRIX.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = MATRIX.color;
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > MATRIX.resetProbability) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  matrixInterval = setInterval(draw, MATRIX.intervalMs);
}

/**
 * Stoppt den Matrix-Regen.
 * @returns {void}
 */
function stopMatrixEffect() {
  if (matrixInterval) {
    clearInterval(matrixInterval);
  }
}

// ===== EVENT-BINDINGS (ersetzen die former Inline-Handler) =====
/**
 * Verknüpft die DOM-Elemente mit den globalen Funktionen.
 * @returns {void}
 */
function bindEventHandlers() {
  // Rätsel-Prüfen-Button (war vorher inline onclick="checkRiddle()")
  const riddleButton = document.querySelector("#riddle-box .riddle-input button");
  if (riddleButton) {
    riddleButton.addEventListener("click", checkRiddle);
  }

  // Versteckte Easter Eggs (waren vorher inline onclick="findEgg(n)")
  document.querySelectorAll(".hidden-egg").forEach((button) => {
    button.addEventListener("click", () => {
      findEgg(Number(button.id.replace("egg", "")));
    });
  });

  // Chat-Vorschläge (waren vorher inline onclick="sendSuggestion(...)")
  document.querySelectorAll(".suggestion-btn").forEach((button) => {
    button.addEventListener("click", () => {
      sendSuggestion(button.dataset.suggestion || button.textContent);
    });
  });

  // Chat-Enter (war vorher inline onkeypress="handleKeypress(event)")
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keypress", handleChatKeypress);
  }

  // Senden-Button (war vorher inline onclick="sendMessage()")
  const sendButton = document.querySelector(".send-btn");
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function () {
  initThreeJS();
  initDashboard();
  initJourneyScroll();
  bindEventHandlers();

  // Object card click handlers
  document.querySelectorAll(".object-card").forEach((card) => {
    card.addEventListener("click", () => {
      const objectName = card.dataset.object;
      const object = objects.find((obj) => obj.userData.name === objectName);
      if (object) {
        highlightObject(object);
      }
    });
  });
});
