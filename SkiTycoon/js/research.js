/**
 * Research module — pure, DOM-free unlock logic.
 *
 * Decides whether a building, research or unit may be built/trained based on
 * the current state. A requirement is met when EITHER the building level OR
 * the research level of the required id is high enough (matching the legacy
 * game.js behaviour). No DOM, no localStorage — safe to import from Node.
 */

import { BLD_DATA, RES_DATA, UNIT_DATA } from "./economy.js";

/**
 * Checks whether all requirements of a building/research/unit are met.
 * A single requirement passes when the building level OR the research level
 * of the required id reaches the demanded level.
 * @param {Object<string, number>|undefined} reqs - map of required id -> level
 * @param {Object} state - game state
 * @returns {boolean} true when every requirement is satisfied
 */
export function checkReqs(reqs, state) {
  if (!reqs) return true;
  return Object.entries(reqs).every(
    ([r, lvl]) => (state.bld[r] || 0) >= lvl || (state.tech[r] || 0) >= lvl,
  );
}

/**
 * Builds a per-requirement status list (used by the renderers to show
 * which prerequisites are missing).
 * @param {Object<string, number>|undefined} reqs - map of required id -> level
 * @param {Object} state - game state
 * @returns {Array<{key: string, level: number, has: boolean, name: string}>}
 */
export function getReqStatus(reqs, state) {
  if (!reqs) return [];
  return Object.entries(reqs).map(([r, lvl]) => {
    const has = (state.bld[r] || 0) >= lvl || (state.tech[r] || 0) >= lvl;
    const name = BLD_DATA[r]?.name || RES_DATA[r]?.name || r;
    return { key: r, level: lvl, has, name };
  });
}

/**
 * Whether a building's prerequisites are met.
 * @param {string} bldId - id of the building
 * @param {Object} state - game state
 * @returns {boolean}
 */
export function canBuild(bldId, state) {
  return checkReqs(BLD_DATA[bldId].req, state);
}

/**
 * Whether a research's prerequisites are met.
 * @param {string} techId - id of the research
 * @param {Object} state - game state
 * @returns {boolean}
 */
export function canResearch(techId, state) {
  return checkReqs(RES_DATA[techId].req, state);
}

/**
 * Whether a unit's prerequisites are met.
 * @param {string} unitId - id of the unit
 * @param {Object} state - game state
 * @returns {boolean}
 */
export function canTrain(unitId, state) {
  return checkReqs(UNIT_DATA[unitId].req, state);
}
