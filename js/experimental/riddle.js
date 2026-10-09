/**
 * Rätsel: Antwortprüfung.
 * Reine Logik, ohne DOM – unit-testbar.
 */

import { RIDDLE_ANSWERS } from "./constants.js";

/**
 * Prüft die Rätsel-Antwort (case-insign, trimmt).
 * @param {string} answer - Die Nutzerantwort.
 * @returns {boolean} True, wenn die Antwort korrekt ist.
 */
export function isCorrectRiddleAnswer(answer) {
  return RIDDLE_ANSWERS.includes(answer.toLowerCase().trim());
}
