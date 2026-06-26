import {
  CLICK_COOLDOWN_MS,
  COUNTDOWN_PATTERN,
  MESSAGE_SOURCE,
  MESSAGE_TYPES,
  PAUSE_LABEL_PATTERN,
  SKIP_LABEL_PATTERN
} from "../shared/constants.js";
import { SKIP_BUTTON_SELECTORS } from "../shared/selectors.js";
import { getBridgeToken } from "./bridge-token.js";
import { getPlayer, isVisible } from "./dom.js";

let lastTrustedClickAt = 0;

const SKIP_BUTTON_CLASSES = [
  "ytp-skip-ad-button",
  "ytp-ad-skip-button-modern",
  "ytp-ad-skip-button"
];

function getElementLabel(element) {
  return `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.trim();
}

function isPlayPauseControl(element) {
  if (!element) {
    return true;
  }

  if (element.classList.contains("ytp-play-button")) {
    return true;
  }

  const label = getElementLabel(element).toLowerCase();
  return PAUSE_LABEL_PATTERN.test(label) && !SKIP_LABEL_PATTERN.test(label);
}

function isSkipCountdown(element) {
  return COUNTDOWN_PATTERN.test(getElementLabel(element));
}

function isSkipControl(element) {
  if (!element || !isVisible(element) || isPlayPauseControl(element) || isSkipCountdown(element)) {
    return false;
  }

  if (SKIP_BUTTON_CLASSES.some((className) => element.classList.contains(className))) {
    return true;
  }

  if (element.closest(SKIP_BUTTON_CLASSES.map((className) => `.${className}`).join(", "))) {
    return true;
  }

  const label = getElementLabel(element);
  return SKIP_LABEL_PATTERN.test(label) && !PAUSE_LABEL_PATTERN.test(label);
}

export function findSkipButton() {
  const player = getPlayer() || document;

  for (const selector of SKIP_BUTTON_SELECTORS) {
    for (const element of player.querySelectorAll(selector)) {
      if (isSkipControl(element)) {
        return (
          element.closest(SKIP_BUTTON_CLASSES.map((className) => `.${className}`).join(", ")) ||
          element
        );
      }
    }
  }

  return null;
}

export function requestTrustedClick(button) {
  if (!isSkipControl(button)) {
    return false;
  }

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
