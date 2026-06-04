import { NAVIGATION_GRACE_MS } from "../shared/constants.js";

let navigationGraceUntil = 0;

export function markNavigation() {
  navigationGraceUntil = Date.now() + NAVIGATION_GRACE_MS;
}

export function isInNavigationGrace() {
  return Date.now() < navigationGraceUntil;
}
