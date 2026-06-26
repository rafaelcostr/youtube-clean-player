import { MAX_VIDEO_AD_DURATION, MESSAGE_SOURCE, MESSAGE_TYPES, SKIP_METHODS } from "../shared/constants.js";
import { STATIC_IMAGE_AD_MARKERS } from "../shared/selectors.js";
import { getAdKey, getPlayer, getVideo, isAdPlaying, isStaticImageAd, isVisible } from "./dom.js";
import { shouldDeferAdHandling } from "./navigation-grace.js";
import { isEnabled, muteOnce } from "./mute.js";
import { getBridgeToken } from "./bridge-token.js";
import { findSkipButton, requestTrustedClick } from "./skip-button.js";

let lastNotifyClickKey = "";
let lastNotifySeekKey = "";

function notify(method, key) {
  const token = getBridgeToken();
  if (!token) {
    return;
  }

  window.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: MESSAGE_TYPES.skip,
      token,
      method,
      key
    },
    "*"
  );
}

function isVideoAd(player) {
  if (!player || !isAdPlaying() || isStaticImageAd(player)) {
    return false;
  }

  return !!getVideo();
}

function seekVideoAd() {
  const video = getVideo();
  if (
    !video ||
    !Number.isFinite(video.duration) ||
    video.duration <= 0 ||
    video.duration > MAX_VIDEO_AD_DURATION
  ) {
    return false;
  }

  video.muted = true;
  video.currentTime = Math.max(video.duration - 0.05, 0);
  return true;
}

function trySkipButtonClick() {
  const skipButton = findSkipButton();
  if (!skipButton || !requestTrustedClick(skipButton)) {
    return false;
  }

  const adKey = getAdKey();
  if (lastNotifyClickKey !== adKey) {
    lastNotifyClickKey = adKey;
    notify(SKIP_METHODS.click, adKey);
  }

  return true;
}

export function handleVideoAd() {
  if (!isEnabled() || shouldDeferAdHandling() || !isAdPlaying()) {
    return;
  }

  const player = getPlayer();
  if (!player || !isVideoAd(player)) {
    return;
  }

  muteOnce();

  const video = getVideo();
  const durationReady = video && Number.isFinite(video.duration) && video.duration > 0;

  if (durationReady && video.duration <= MAX_VIDEO_AD_DURATION) {
    if (!seekVideoAd()) {
      return;
    }

    const adKey = getAdKey();
    if (lastNotifySeekKey !== adKey) {
      lastNotifySeekKey = adKey;
      notify(SKIP_METHODS.seek, adKey);
    }
    return;
  }

  if (durationReady && video.duration > MAX_VIDEO_AD_DURATION) {
    trySkipButtonClick();
  }
}

export function handleStaticAd() {
  if (!isEnabled() || shouldDeferAdHandling() || !isAdPlaying()) {
    return;
  }

  const player = getPlayer();
  if (!player || !isStaticImageAd(player)) {
    return;
  }

  muteOnce();
  trySkipButtonClick();
}

export function resetAdHandlers() {
  lastNotifyClickKey = "";
  lastNotifySeekKey = "";
}
