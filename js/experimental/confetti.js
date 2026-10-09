/**
 * Konfetti-Effekt (DOM-abhängig, wird im Browser gestartet).
 */

import { CONFETTI } from "./constants.js";

/**
 * Startet den Konfetti-Regen: Erzeugt CONFETTI.count divs, die über den Bildschirm fallen.
 * @returns {void}
 */
export function launchConfetti() {
  for (let i = 0; i < CONFETTI.count; i++) {
    const confetti = document.createElement("div");
    confetti.style.cssText = `
            position: fixed;
            width: ${CONFETTI.sizePx}px;
            height: ${CONFETTI.sizePx}px;
            background: ${CONFETTI.colors[Math.floor(Math.random() * CONFETTI.colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -${CONFETTI.sizePx}px;
            border-radius: ${Math.random() > 0.5 ? "50%" : "0"};
            z-index: ${CONFETTI.zIndex};
            pointer-events: none;
        `;
    document.body.appendChild(confetti);

    const duration = CONFETTI.minDurationMs + Math.random() * CONFETTI.randomDurationMs;
    const rotation = Math.random() * 360;

    confetti.animate(
      [
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(${window.innerHeight}px) rotate(${rotation}deg)`, opacity: 0 },
      ],
      {
        duration: duration,
        easing: CONFETTI.easing,
      },
    ).onfinish = () => confetti.remove();
  }
}
