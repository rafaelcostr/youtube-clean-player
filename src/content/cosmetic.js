import {
  AD_UI_SELECTORS,
  IDLE_CONFIRM_SELECTORS,
  IDLE_PROMPT_PATTERNS,
  MODAL_BACKDROP_SELECTORS,
  PLAYER_SELECTORS
} from "../shared/selectors.js";
import { record } from "./stats.js";

let observer;
let intervalId;
let inspectScheduled = false;
let isInspecting = false;
let lastIdleConfirmAt = 0;

const IDLE_CONFIRM_COOLDOWN_MS = 2000;

function isElementVisible(element) {
  if (!element || !element.isConnected) {
    return false;
  }

  try {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0
    );
  } catch {
    return false;
  }
}

function hideElement(element) {
  if (element.dataset.cleanPlayerHandled === "true") {
    return false;
  }

  element.dataset.cleanPlayerHandled = "true";
  element.style.setProperty("display", "none", "important");
  return true;
}

function hidePromotionalElements() {
  for (const selector of AD_UI_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => {
      if (!isElementVisible(element)) {
        return;
      }

      if (hideElement(element)) {
        record("Promoção visual ocultada", "hiddenPromotions");
      }
    });
  }
}

function unlockPageScroll() {
  document.documentElement.removeAttribute("aria-hidden");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("overflow");
}

function findVisibleEnforcementRoot() {
  for (const dialog of document.querySelectorAll("tp-yt-paper-dialog")) {
    if (!dialog.querySelector(".ytd-enforcement-message-view-model")) {
      continue;
    }

    if (isElementVisible(dialog) || dialog.hasAttribute("opened")) {
      return dialog;
    }
  }

  const model = document.querySelector("ytd-enforcement-message-view-model");
  if (model && isElementVisible(model)) {
    return model;
  }

  return null;
}

function releaseEnforcementBackdrops() {
  for (const selector of MODAL_BACKDROP_SELECTORS) {
    document.querySelectorAll(`${selector}[opened]`).forEach((element) => {
      element.removeAttribute("opened");
      element.classList.remove("opened");
    });
  }
}

function resumeVideoAfterEnforcement() {
  const video = document.querySelector(PLAYER_SELECTORS.video);
  if (!video || !video.paused) {
    return;
  }

  const playAttempt = video.play();
  if (playAttempt?.catch) {
    playAttempt.catch(() => {});
  }
}

function isPaperDialog(element) {
  return element?.tagName?.toLowerCase() === "tp-yt-paper-dialog";
}

function isIdlePromptDialog(element) {
  const text = element?.textContent || "";
  return IDLE_PROMPT_PATTERNS.some((pattern) => pattern.test(text));
}

function findIdlePromptDialog() {
  const renderer = document.querySelector("yt-confirm-dialog-renderer");
  if (renderer && isElementVisible(renderer) && isIdlePromptDialog(renderer)) {
    return renderer;
  }

  for (const dialog of document.querySelectorAll("tp-yt-paper-dialog, ytd-popup-container")) {
    if (isElementVisible(dialog) && isIdlePromptDialog(dialog)) {
      return dialog;
    }
  }

  return null;
}

function findIdleConfirmButton(root) {
  for (const selector of IDLE_CONFIRM_SELECTORS) {
    const element = root.querySelector(selector);
    if (element && isElementVisible(element)) {
      return element;
    }
  }

  for (const element of root.querySelectorAll("button, paper-button, yt-button-renderer a")) {
    const label = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.trim();
    if (!/^(sim|yes|ok)$/i.test(label)) {
      continue;
    }

    if (isElementVisible(element)) {
      return element;
    }
  }

  return null;
}

function dismissIdlePrompt() {
  const dialog = findIdlePromptDialog();
  if (!dialog) {
    return;
  }

  const now = Date.now();
  if (now - lastIdleConfirmAt < IDLE_CONFIRM_COOLDOWN_MS) {
    return;
  }

  const confirmButton = findIdleConfirmButton(dialog);
  if (!confirmButton) {
    return;
  }

  lastIdleConfirmAt = now;
  confirmButton.click();
  unlockPageScroll();
  resumeVideoAfterEnforcement();
}

function dismissEnforcementModal() {
  const enforcementRoot = findVisibleEnforcementRoot();

  if (!enforcementRoot) {
    unlockPageScroll();
    return;
  }

  if (hideElement(enforcementRoot)) {
    releaseEnforcementBackdrops();
    unlockPageScroll();
    resumeVideoAfterEnforcement();
    return;
  }

  if (isPaperDialog(enforcementRoot)) {
    const model = enforcementRoot.querySelector(".ytd-enforcement-message-view-model");
    if (model && hideElement(model)) {
      hideElement(enforcementRoot);
      releaseEnforcementBackdrops();
      unlockPageScroll();
      resumeVideoAfterEnforcement();
    }
  }
}

function runInspectPage() {
  if (isInspecting) {
    return;
  }

  isInspecting = true;

  try {
    dismissEnforcementModal();
    dismissIdlePrompt();
    hidePromotionalElements();
  } catch {
    // Evita que falhas no DOM apareçam como erro da extensão no Chrome.
  } finally {
    isInspecting = false;
  }
}

function scheduleInspectPage() {
  if (inspectScheduled) {
    return;
  }

  inspectScheduled = true;
  requestAnimationFrame(() => {
    inspectScheduled = false;
    runInspectPage();
  });
}

export function startCosmeticObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver(scheduleInspectPage);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "opened", "aria-hidden"]
  });

  intervalId = window.setInterval(runInspectPage, 1000);
  runInspectPage();
}

export function stopCosmeticObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}
