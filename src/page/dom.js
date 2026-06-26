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

export function getVideo() {
  return document.querySelector(PLAYER_SELECTORS.video);
}

/** Anúncio com stream de vídeo real (mesmo que tenha overlay de imagem no DOM). */
export function isVideoAdStream(player = getPlayer()) {
  if (!player || !isAdPlaying()) {
    return false;
  }

  const video = getVideo();
  if (!video) {
    return false;
  }

  if (Number.isFinite(video.duration) && video.duration > 0) {
    return true;
  }

  return video.readyState >= 2 && (video.currentTime > 0 || !video.paused);
}

export function isStaticImageAd(player = getPlayer()) {
  if (!player || !isAdPlaying() || isVideoAdStream(player)) {
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

  if (isStaticImageAd(player) || isVideoAdStream(player)) {
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
