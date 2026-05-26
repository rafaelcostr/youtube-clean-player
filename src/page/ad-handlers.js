import { MAX_VIDEO_AD_DURATION, MESSAGE_SOURCE, MESSAGE_TYPES, SKIP_METHODS } from "../shared/constants.js";
import { STATIC_AD_MARKERS } from "../shared/selectors.js";
import { getAdKey, getPlayer, getVideo, isAdPlaying } from "./dom.js";
import { isEnabled, muteOnce } from "./mute.js";
import { findSkipButton, requestTrustedClick } from "./skip-button.js";

let lastNotifyClickKey = "";
let lastNotifySeekKey = "";

function notify(method, key) {
  window.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: MESSAGE_TYPES.skip,
      method,
      key
    },
    "*"
  );
}

export function isVideoAd(player) {
  if (!player) {
    return false;
  }

  if (player.querySelector(STATIC_AD_MARKERS.join(", "))) {
    return false;
  }

  const video = getVideo();
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
    return false;
  }

  return video.duration <= MAX_VIDEO_AD_DURATION;
}

export function isStaticAd(player) {
  if (!player || !isAdPlaying()) {
    return false;
  }

  return !isVideoAd(player);
}

function seekVideoAd() {
  const video = getVideo();
  if (
    !video ||
    !Number.isFinite(video.duration) ||
    video.duration <= 0 ||
    video.duration > MAX_VIDEO_AD_DURATION
  ) {
    return;
  }

  video.muted = true;
  video.currentTime = Math.max(video.duration - 0.1, 0);
}

export function handleVideoAd() {
  if (!isEnabled() || !isAdPlaying()) {
    return;
  }

  const player = getPlayer();
  if (!player || !isVideoAd(player)) {
    return;
  }

  muteOnce();

  const adKey = getAdKey();
  seekVideoAd();

  if (lastNotifySeekKey !== adKey) {
    lastNotifySeekKey = adKey;
    notify(SKIP_METHODS.seek, adKey);
  }
}

export function handleStaticAd() {
  if (!isEnabled() || !isAdPlaying()) {
    return;
  }

  const player = getPlayer();
  if (!player || !isStaticAd(player)) {
    return;
  }

  muteOnce();

  const skipButton = findSkipButton();
  if (!skipButton) {
    return;
  }

  requestTrustedClick(skipButton);

  const adKey = getAdKey();
  if (lastNotifyClickKey !== adKey) {
    lastNotifyClickKey = adKey;
    notify(SKIP_METHODS.click, adKey);
  }
}

export function resetAdHandlers() {
  lastNotifyClickKey = "";
  lastNotifySeekKey = "";
}
