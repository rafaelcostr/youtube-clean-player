import { PLAYER_SELECTORS } from "../shared/selectors.js";

export function getPlayer() {
  return document.querySelector(PLAYER_SELECTORS.active);
}

export function isAdPlaying() {
  return !!document.querySelector(PLAYER_SELECTORS.adPlaying);
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
