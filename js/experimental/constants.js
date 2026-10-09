/**
 * Zentrale Konstanten für die Experimental-Seite.
 * Sammelt alle "magic numbers" der ursprünglichen experimental.js an einem Ort.
 */

// ===== 1. Three.js interaktiver Raum =====
export const ROOM_COLORS = {
  background: 0x1a1a25,
  floor: 0x2a2a35,
  desk: 0x3d3d4d,
  laptop: 0x1a1a25,
  screenGlow: 0x6366f1,
  coffee: 0x3d2817,
  pot: 0x8b4513,
  stem: 0x228b22,
  leaf: 0x32cd32,
  books: [0x6366f1, 0xf59e0b, 0x10b981],
  ambientLight: 0xffffff,
  pointLightPrimary: 0x6366f1,
  pointLightSecondary: 0xf59e0b,
};

export const ROOM_CAMERA = {
  fov: 75,
  near: 0.1,
  far: 1000,
  positionZ: 5,
  positionY: 2,
};

export const ROOM_DIMENSIONS = {
  floorSize: 10,
  deskWidth: 4,
  deskHeight: 0.1,
  deskDepth: 2,
  legWidth: 0.1,
  legHeight: 1,
  legOffsetX: 1.8,
  legOffsetY: -0.5,
  legOffsetZ: 0.8,
  laptopWidth: 1.2,
  laptopBaseHeight: 0.05,
  laptopDepth: 0.8,
  laptopScreenHeight: 0.8,
  laptopScreenDepth: 0.05,
  screenGlowWidth: 1.1,
  screenGlowHeight: 0.7,
  screenGlowOpacity: 0.3,
  cupTopRadius: 0.15,
  cupBottomRadius: 0.12,
  cupHeight: 0.3,
  coffeeRadius: 0.13,
  handleRadius: 0.08,
  handleTube: 0.02,
  potTopRadius: 0.2,
  potBottomRadius: 0.15,
  potHeight: 0.3,
  stemRadius: 0.02,
  stemHeight: 0.5,
  leafRadius: 0.1,
  leafCount: 5,
  bookWidth: 0.4,
  bookDepth: 0.05,
};

export const ROOM_POSITIONS = {
  floorY: -1,
  laptop: { x: 0, y: 0.05, z: 0 },
  coffee: { x: 1.2, y: 0.05, z: 0.3 },
  plant: { x: -1.3, y: 0.05, z: -0.5 },
  books: { x: -1.2, y: 0.05, z: 0.5 },
};

export const ROOM_BEHAVIOR = {
  rotationSensitivity: 0.01,
  maxTilt: 0.5,
  cameraSmoothing: 0.05,
  objectFloatAmplitude: 0.0005,
  objectFloatSpeed: 0.001,
  bounceStep: 0.2,
  bounceHeight: 0.1,
};

// ===== 2. Dashboard =====
export const CODING = {
  startHour: 9,
  maxDisplayHours: 8,
  maxDisplayMinutes: 59,
  updateIntervalMs: 60000,
};

// ===== 3. Secrets & Easter Eggs =====
export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
export const KONAMI_BUFFER_LENGTH = 10;

export const RIDDLE_ANSWERS = ["karte", "karten", "landkarte", "landkarten", "map"];

export const TOTAL_EGGS = 5;

export const CONFETTI = {
  colors: ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"],
  count: 50,
  sizePx: 10,
  minDurationMs: 2000,
  randomDurationMs: 2000,
  easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  zIndex: 9999,
};

export const SECRET_STYLES = {
  highlightColor: "#6366f1",
  cardBorderColor: "rgba(255, 255, 255, 0.05)",
  errorColor: "#ef4444",
  errorResetMs: 1000,
  secretResetMs: 2000,
};

// ===== 4. KI-Chat =====
export const CHAT = {
  thinkingDelayMinMs: 500,
  thinkingDelayRandomMs: 1000,
  aiAvatar: "🤖",
  userAvatar: "👤",
};

// ===== 5. Matrix-Modus =====
export const MATRIX = {
  fontSize: 14,
  intervalMs: 35,
  fadeAlpha: 0.05,
  resetProbability: 0.975,
  initialDropOffset: -100,
  color: "#0F0",
  background: "rgba(0, 0, 0, 0.05)",
};
