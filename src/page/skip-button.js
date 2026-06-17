import {
  CLICK_COOLDOWN_MS,
  COUNTDOWN_PATTERN,
  MESSAGE_SOURCE,
  MESSAGE_TYPES
} from "../shared/constants.js";
import { SKIP_BUTTON_SELECTORS } from "../shared/selectors.js";
import { getBridgeToken } from "./bridge-token.js";
import { getPlayer, isVisible } from "./dom.js";

let lastTrustedClickAt = 0;

export function findSkipButton() {
  const player = getPlayer() || document;

  for (const selector of SKIP_BUTTON_SELECTORS) {
    for (const element of player.querySelectorAll(selector)) {
      if (!isVisible(element)) {
        continue;
      }

      if (selector === ".ytp-skip-ad-button") {
        return element;
      }

      const text = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`;
      if (COUNTDOWN_PATTERN.test(text)) {
        continue;
      }

      return element.closest(".ytp-skip-ad-button, .ytp-ad-skip-button-modern, button") || element;
    }
  }

  for (const element of player.querySelectorAll("button, .ytp-button, div[class*='skip']")) {
    const text = (element.textContent || element.getAttribute("aria-label") || "").trim();
    if (!text || COUNTDOWN_PATTERN.test(text)) {
      continue;
    }

    if (/^pular$/i.test(text) || /^skip$/i.test(text) || /^ignorar$/i.test(text)) {
      return element;
    }
  }

  return null;
}

export function requestTrustedClick(button) {
  const token = getBridgeToken();
  if (!token) {
    return false;
  }

  const now = Date.now();
  if (now - lastTrustedClickAt < CLICK_COOLDOWN_MS) {
    return false;
  }

  lastTrustedClickAt = now;

  const rect = button.getBoundingClientRect();
  window.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: MESSAGE_TYPES.trustedClick,
      token,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    },
    "*"
  );

  return true;
}

export function resetTrustedClickCooldown() {
  lastTrustedClickAt = 0;
}
