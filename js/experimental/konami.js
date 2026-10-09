/**
 * Konami-Code: Tastenpuffer und Sequenzvergleich.
 * Reine Logik, ohne DOM – unit-testbar.
 */

import { KONAMI_SEQUENCE, KONAMI_BUFFER_LENGTH } from "./constants.js";

/**
 * Prüft, ob der Tastenpuffer der Konami-Sequenz entspricht.
 * @param {string[]} buffer - Gepufferte Tasten.
 * @returns {boolean} True, wenn der Puffer exakt der Sequenz entspricht.
 */
export function matchesKonamiSequence(buffer) {
  return buffer.join(",") === KONAMI_SEQUENCE.join(",");
}

/**
 * Führt eine Taste zum Puffer hinzu und kürzt auf die maximale Länge.
 * @param {string[]} buffer - Bisheriger Puffer.
 * @param {string} key - Eingedrückte Taste.
 * @param {number} [maxLength] - Maximale Puffergröße (Standard: KONAMI_BUFFER_LENGTH).
 * @returns {string[]} Neuer Puffer.
 */
export function pushKonamiKey(buffer, key, maxLength = KONAMI_BUFFER_LENGTH) {
  const next = [...buffer, key];
  return next.slice(-maxLength);
}
