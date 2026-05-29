import { AD_UI_SELECTORS } from "../shared/selectors.js";
import { record } from "./stats.js";

let observer;
let intervalId;

function hidePromotionalElements() {
  for (const selector of AD_UI_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.dataset.cleanPlayerHandled === "true") {
        return;
      }

      element.dataset.cleanPlayerHandled = "true";
      element.style.setProperty("display", "none", "important");
      record("Promoção visual ocultada", "hiddenPromotions");
    });
  }
}

function inspectPage() {
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
    attributeFilter: ["class"]
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
