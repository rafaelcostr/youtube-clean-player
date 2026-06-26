import { MESSAGE_SOURCE, MESSAGE_TYPES, SKIP_METHODS } from "../shared/constants.js";
import {
  getAdKey,
  getPlayer,
  getVideo,
  isAdPlaying,
  isStaticImageAd,
  isVideoAdStream
} from "./dom.js";
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

function trySeekVideoAd() {
  const video = getVideo();
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
    return false;
  }

  const targetTime = Math.max(video.duration - 0.05, 0);

  if (video.currentTime >= targetTime - 0.25) {
    return true;
  }

  video.muted = true;
  const before = video.currentTime;

  try {
    video.currentTime = targetTime;
  } catch {
    return false;
  }

  // YouTube bloqueia seek em muitos anúncios longos — não tratar como sucesso.
  if (video.currentTime < before + 0.5 && video.currentTime < targetTime - 1) {
    return false;
  }

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
  if (!player || !isVideoAdStream(player)) {
    return;
  }

  muteOnce();

  if (findSkipButton() && trySkipButtonClick()) {
    return;
  }

  if (trySeekVideoAd()) {
    const adKey = getAdKey();
    if (lastNotifySeekKey !== adKey) {
      lastNotifySeekKey = adKey;
      notify(SKIP_METHODS.seek, adKey);
    }
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
