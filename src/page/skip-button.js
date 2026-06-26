import {
  CLICK_COOLDOWN_MS,
  COUNTDOWN_PATTERN,
  MESSAGE_SOURCE,
  MESSAGE_TYPES
} from "../shared/constants.js";
import { getBridgeToken } from "./bridge-token.js";
import { getPlayer, isVisible } from "./dom.js";

let lastTrustedClickAt = 0;

const SKIP_BUTTON_CLASSES = [
  "ytp-skip-ad-button",
  "ytp-ad-skip-button-modern",
  "ytp-ad-skip-button"
];

const SKIP_BUTTON_SELECTOR = SKIP_BUTTON_CLASSES.map((className) => `.${className}`).join(", ");

const AD_SKIP_SEARCH_ROOTS = [
  ".ytp-ad-module",
  ".ytp-ad-player-overlay",
  ".ytp-ad-overlay-container",
  ".html5-video-player"
];

function getElementLabel(element) {
  return `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.trim();
}

function isPlayPauseControl(element) {
  if (!element) {
    return true;
  }

  return element.classList.contains("ytp-play-button") || !!element.closest(".ytp-play-button");
}

function isSkipCountdown(element) {
  return COUNTDOWN_PATTERN.test(getElementLabel(element));
}

function isSkipReadyLabel(label) {
  const normalized = label.toLowerCase().trim();
  if (!normalized || COUNTDOWN_PATTERN.test(normalized)) {
    return false;
  }

  return (
    /^pular(\s|$)/i.test(normalized) ||
    /^skip(\s|$)/i.test(normalized) ||
    /^ignorar(\s|$)/i.test(normalized) ||
    /skip ad/i.test(normalized) ||
    /pular an/i.test(normalized)
  );
}

function resolveSkipButton(element) {
  if (!element || !isVisible(element) || isPlayPauseControl(element)) {
    return null;
  }

  const skipRoot = element.matches(SKIP_BUTTON_SELECTOR)
    ? element
    : element.closest(SKIP_BUTTON_SELECTOR);

  if (!skipRoot || !isVisible(skipRoot) || isPlayPauseControl(skipRoot) || isSkipCountdown(skipRoot)) {
    return null;
  }

  const label = getElementLabel(skipRoot);
  if (label && !isSkipReadyLabel(label)) {
    return null;
  }

  return skipRoot;
}

function getAdSkipSearchRoots(player) {
  const roots = [];

  for (const selector of AD_SKIP_SEARCH_ROOTS) {
    const root = player.querySelector(selector);
    if (root && !roots.includes(root)) {
      roots.push(root);
    }
  }

  return roots.length > 0 ? roots : [player];
}

export function findSkipButton() {
  const player = getPlayer() || document;

  for (const root of getAdSkipSearchRoots(player)) {
    for (const className of SKIP_BUTTON_CLASSES) {
      for (const element of root.querySelectorAll(`.${className}`)) {
        const skipButton = resolveSkipButton(element);
        if (skipButton) {
          return skipButton;
        }
      }
    }
  }

  return null;
}

export function requestTrustedClick(button) {
  const skipButton = resolveSkipButton(button);
  if (!skipButton) {
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

  const rect = skipButton.getBoundingClientRect();
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
