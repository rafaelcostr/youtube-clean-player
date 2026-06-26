import {
  AD_CTA_LABEL_PATTERN,
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

const AD_CTA_SELECTORS = [
  ".ytp-ad-action-interstitial",
  ".ytp-ad-text-overlay",
  ".ytp-ad-visit-advertiser-button",
  ".ytp-ad-button"
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

function isAdCtaElement(element) {
  if (!element) {
    return true;
  }

  for (const selector of AD_CTA_SELECTORS) {
    if (element.closest(selector)) {
      return true;
    }
  }

  return AD_CTA_LABEL_PATTERN.test(getElementLabel(element));
}

function isSkipCountdown(element) {
  const label = getElementLabel(element);
  if (!label) {
    return false;
  }

  if (COUNTDOWN_PATTERN.test(label)) {
    return true;
  }

  return /\d/.test(label) && /pular|skip|ignorar/i.test(label);
}

function isSkipReadyLabel(label) {
  const normalized = label.toLowerCase().trim();
  if (!normalized) {
    return false;
  }

  if (COUNTDOWN_PATTERN.test(normalized)) {
    return false;
  }

  if (/\d/.test(normalized) && /pular|skip|ignorar/i.test(normalized)) {
    return false;
  }

  return (
    normalized === "pular" ||
    normalized === "skip" ||
    normalized === "ignorar" ||
    normalized === "pular anúncio" ||
    normalized === "pular anuncio" ||
    normalized === "skip ad" ||
    normalized === "ignorar anúncio" ||
    normalized === "ignorar anuncio"
  );
}

function resolveSkipButton(element) {
  if (!element || !isVisible(element) || isPlayPauseControl(element) || isAdCtaElement(element)) {
    return null;
  }

  const skipRoot = element.matches(SKIP_BUTTON_SELECTOR)
    ? element
    : element.closest(SKIP_BUTTON_SELECTOR);

  if (
    !skipRoot ||
    !isVisible(skipRoot) ||
    isPlayPauseControl(skipRoot) ||
    isAdCtaElement(skipRoot) ||
    isSkipCountdown(skipRoot)
  ) {
    return null;
  }

  const label = getElementLabel(skipRoot);
  if (!isSkipReadyLabel(label)) {
    return null;
  }

  return skipRoot;
}

export function findSkipButton() {
  const player = getPlayer();
  if (!player) {
    return null;
  }

  const adModule = player.querySelector(".ytp-ad-module");
  const searchRoot = adModule || player;

  for (const className of SKIP_BUTTON_CLASSES) {
    for (const element of searchRoot.querySelectorAll(`.${className}`)) {
      const skipButton = resolveSkipButton(element);
      if (skipButton) {
        return skipButton;
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
