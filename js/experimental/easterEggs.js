/**
 * Easter-Egg-Jagd: Zustandsverwaltung.
 * Reine Logik (Reducer), ohne DOM – unit-testbar.
 */

import { TOTAL_EGGS } from "./constants.js";

export { TOTAL_EGGS };

/**
 * Erstellt den initialen Easter-Egg-Zustand.
 * @returns {{found: Set<number>, count: number}} Anfangszustand.
 */
export function createEggHuntState() {
  return { found: new Set(), count: 0 };
}

/**
 * Registriert ein gefundenes Easter Egg und liefert den neuen Zustand.
 * Bereits gefundene Eggs werden ignoriert (kein Doppelzählen).
 * @param {{found: Set<number>, count: number}} state - Aktueller Zustand.
 * @param {number} eggNumber - Nummer des gefundenen Eggs (1–TOTAL_EGGS).
 * @returns {{found: Set<number>, count: number, complete: boolean}} Neuer Zustand; complete ist true, wenn alle Eggs gefunden sind.
 */
export function recordEggFound(state, eggNumber) {
  if (state.found.has(eggNumber)) {
    return { found: state.found, count: state.count, complete: state.count === TOTAL_EGGS };
  }

  const found = new Set(state.found);
  found.add(eggNumber);
  const count = state.count + 1;

  return { found, count, complete: count === TOTAL_EGGS };
}
