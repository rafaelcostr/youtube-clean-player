import {
  COUNTDOWN_PATTERN,
  PAUSE_LABEL_PATTERN,
  SKIP_LABEL_PATTERN
} from "../shared/constants.js";
import {
  PLAYER_SELECTORS,
  SKIP_BUTTON_SELECTORS,
  STATIC_IMAGE_AD_MARKERS
} from "../shared/selectors.js";

export function getPlayer() {
  return document.querySelector(PLAYER_SELECTORS.active);
}

export function isAdPlaying() {
  return !!document.querySelector(PLAYER_SELECTORS.adPlaying);
}

export function isStaticImageAd(player = getPlayer()) {
  if (!player) {
    return false;
  }

  for (const selector of STATIC_IMAGE_AD_MARKERS) {
    const marker = player.querySelector(selector);
    if (marker && isVisible(marker)) {
      return true;
    }
  }

  return false;
}

/** Sinais claros de anúncio (não confundir com troca de vídeo no Mix). */
export function hasActiveAdSignal() {
  const player =
    document.querySelector(PLAYER_SELECTORS.adPlaying) ||
    document.querySelector(PLAYER_SELECTORS.root);

  if (!player) {
    return false;
  }

  const adLabel = document.querySelector(PLAYER_SELECTORS.adLabel);
  if (adLabel && isVisible(adLabel)) {
    return true;
  }

  if (isStaticImageAd(player)) {
    return true;
  }

  for (const selector of SKIP_BUTTON_SELECTORS) {
    const button = player.querySelector(selector);
    if (button && isVisible(button)) {
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
