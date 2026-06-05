import { NAVIGATION_GRACE_MS } from "../shared/constants.js";
import { hasActiveAdSignal } from "./dom.js";

let navigationGraceUntil = 0;

export function markNavigation() {
  navigationGraceUntil = Date.now() + NAVIGATION_GRACE_MS;
}

export function isInNavigationGrace() {
  return Date.now() < navigationGraceUntil;
}

/** Pausa pulo de anúncio só na troca de vídeo; libera se o anúncio já é visível. */
export function shouldDeferAdHandling() {
  if (!isInNavigationGrace()) {
    return false;
  }

  return !hasActiveAdSignal();
}
