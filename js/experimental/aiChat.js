/**
 * KI-Chat: Wissensdatenbank und Antwortlogik.
 * Reine Logik, ohne DOM – unit-testbar.
 */

/** @type {Object<string, string>} */
export const AI_KNOWLEDGE = {
  technologien:
    "Meine Top-Technologien sind: **React** für Frontend, **Node.js** fürs Backend, **Three.js** für 3D, und **Python** für AI/ML. Ich liebe es, neue Tools auszuprobieren!",
  projekte:
    "Aktuell arbeite ich an: **Personal Website 3.0** (diese Seite!), einem **AI Chat Bot**, und einer **Mobile App**. Check sie im Dashboard!",
  stack:
    "Mein bevorzugter Stack: Frontend mit **React/Vue**, Backend mit **Node.js/Express**, Datenbank **PostgreSQL/MongoDB**, und deployed auf **Vercel/AWS**.",
  lerne:
    "Gerade lerne ich: **Three.js** für 3D-Web-Animationen, **Rust** für Performance-kritische Teile, und experimentiere mit **LLMs**!",
  buch: 'Ich lese gerade "Clean Code" von Robert C. Martin (60% durch) und "Atomic Habits" von James Clear (30% durch).',
  kaffee:
    "Kaffee ist mein treuer Begleiter! ☕ Heute schon 3 Tassen. Ohne Koffein läuft hier nichts. 😄",
  hobby:
    "Neben Coding: Videospiele 🎮, Wandern 🥾, gute Bücher 📚, und experimentieren mit neuem Tech.",
  berlin: "Ja, ich bin in Berlin! Aktuell 8°C und leicht bewölkt. Typisches Februar-Wetter. 🌤️",
  ziele:
    "Meine Ziele 2026: Mehr Open Source Contributions, eine erfolgreiche App veröffentlichen, und Rust meistern!",
  default:
    "Interessante Frage! 😊 Ich bin eine KI-Version von Maurice. Frag mich ruhig was über meine Projekte, Skills oder Interessen!",
};

const GREETING_RESPONSE = "Hey! 👋 Schön, dass du hier bist! Was möchtest du über mich wissen?";

/**
 * Erzeugt eine KI-Antwort auf eine Nutzernachricht.
 * Prüft die Nachricht gegen die Wissensdatenbank (Reihenfolge ist relevant).
 * @param {string} message - Die Nutzernachricht.
 * @returns {string} Die KI-Antwort.
 */
export function generateAIResponse(message) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("technolog") || lowerMsg.includes("stack") || lowerMsg.includes("tools")) {
    return AI_KNOWLEDGE.technologien;
  }
  if (lowerMsg.includes("projekt") || lowerMsg.includes("arbeit")) {
    return AI_KNOWLEDGE.projekte;
  }
  if (lowerMsg.includes("lern") || lowerMsg.includes("lerne") || lowerMsg.includes("study")) {
    return AI_KNOWLEDGE.lerne;
  }
  if (lowerMsg.includes("buch") || lowerMsg.includes("lesen") || lowerMsg.includes("book")) {
    return AI_KNOWLEDGE.buch;
  }
  if (lowerMsg.includes("kaffee") || lowerMsg.includes("coffee")) {
    return AI_KNOWLEDGE.kaffee;
  }
  if (
    lowerMsg.includes("hobby") ||
    lowerMsg.includes("interesse") ||
    lowerMsg.includes("freizeit")
  ) {
    return AI_KNOWLEDGE.hobby;
  }
  if (lowerMsg.includes("berlin") || lowerMsg.includes("standort") || lowerMsg.includes("wohn")) {
    return AI_KNOWLEDGE.berlin;
  }
  if (lowerMsg.includes("ziel") || lowerMsg.includes("goal") || lowerMsg.includes("plan")) {
    return AI_KNOWLEDGE.ziele;
  }
  if (lowerMsg.includes("hallo") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
    return GREETING_RESPONSE;
  }

  return AI_KNOWLEDGE.default;
}
