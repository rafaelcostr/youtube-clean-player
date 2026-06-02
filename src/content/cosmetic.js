import {
  AD_UI_SELECTORS,
  ENFORCEMENT_SELECTORS,
  MODAL_BACKDROP_SELECTORS,
  PLAYER_SELECTORS
} from "../shared/selectors.js";
import { record } from "./stats.js";

let observer;
let intervalId;

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
      if (hideElement(element)) {
        record("Promoção visual ocultada", "hiddenPromotions");
      }
    });
  }
}

function removeModalBackdrops() {
  for (const selector of MODAL_BACKDROP_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => {
      element.removeAttribute("opened");
      element.classList.remove("opened");
      element.style.setProperty("display", "none", "important");
      element.style.setProperty("opacity", "0", "important");
      element.style.setProperty("pointer-events", "none", "important");
    });
  }
}

function resumeVideoPlayback() {
  const video = document.querySelector(PLAYER_SELECTORS.video);
  if (!video || !video.paused) {
    return;
  }

  video.play().catch(() => {});
}

function dismissEnforcementModal() {
  let blockedDialog = false;

  for (const selector of ENFORCEMENT_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => {
      if (hideElement(element)) {
        blockedDialog = true;
      }
    });
  }

  document.querySelectorAll("tp-yt-paper-dialog").forEach((dialog) => {
    if (!dialog.querySelector(".ytd-enforcement-message-view-model")) {
      return;
    }

    if (hideElement(dialog)) {
      blockedDialog = true;
    }
  });

  if (!blockedDialog) {
    return;
  }

  removeModalBackdrops();
  document.documentElement.removeAttribute("aria-hidden");
  document.body.style.removeProperty("overflow");
  resumeVideoPlayback();
}

function inspectPage() {
  dismissEnforcementModal();
  hidePromotionalElements();
}

export function startCosmeticObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver(inspectPage);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "opened"]
  });

  intervalId = window.setInterval(inspectPage, 500);
  inspectPage();
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
