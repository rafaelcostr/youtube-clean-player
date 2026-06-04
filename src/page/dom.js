import { PLAYER_SELECTORS, STATIC_AD_MARKERS } from "../shared/selectors.js";

export function getPlayer() {
  return document.querySelector(PLAYER_SELECTORS.active);
}

export function isAdPlaying() {
  const player = document.querySelector(PLAYER_SELECTORS.adPlaying);
  if (!player) {
    return false;
  }

  const adLabel = document.querySelector(PLAYER_SELECTORS.adLabel);
  if (adLabel && isVisible(adLabel)) {
    return true;
  }

  for (const selector of STATIC_AD_MARKERS) {
    const marker = player.querySelector(selector);
    if (marker && isVisible(marker)) {
      return true;
    }
  }

  return false;
}

export function getVideo() {
  return document.querySelector(PLAYER_SELECTORS.video);
}

export function getAdKey() {
  const label = document.querySelector(PLAYER_SELECTORS.adLabel)?.textContent?.trim();
  const video = getVideo();
  return `${label || "ad"}|${video?.src?.slice(-40) || ""}`;
}

export function isVisible(element) {
  if (!element) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}
