/**
 * Dashboard: Berechnung der Coding-Zeit.
 * Reine Logik, ohne DOM – unit-testbar.
 */

import { CODING } from "./constants.js";

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;

/**
 * Berechnet die seit CODING.startHour Uhr verstrichene Coding-Zeit.
 * @param {Date} now - Aktuelle Zeit.
 * @returns {{hours: number, minutes: number}} Angezeigte Stunden/Minuten (auf 0–8h / 0–59m begrenzt).
 */
export function computeCodingHours(now) {
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    CODING.startHour,
    0,
    0,
  );
  const hours = Math.floor((now - startOfDay) / MS_PER_HOUR);
  const minutes = Math.floor(((now - startOfDay) % MS_PER_HOUR) / MS_PER_MINUTE);

  return {
    hours: Math.max(0, Math.min(hours, CODING.maxDisplayHours)),
    minutes: Math.max(0, Math.min(minutes, CODING.maxDisplayMinutes)),
  };
}

/**
 * Formatiert die Coding-Zeit für die Anzeige.
 * @param {number} hours - Stunden.
 * @param {number} minutes - Minuten.
 * @returns {string} Z. B. "8h 59m".
 */
export function formatCodingDuration(hours, minutes) {
  return `${hours}h ${minutes}m`;
}
