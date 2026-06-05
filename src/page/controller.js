import { AD_MUTE_CHECK_MS, STATIC_CHECK_MS, VIDEO_CHECK_MS } from "../shared/constants.js";
import { isAdPlaying } from "./dom.js";
import { handleStaticAd, handleVideoAd, resetAdHandlers } from "./ad-handlers.js";
import { markNavigation } from "./navigation-grace.js";
import { muteDuringAd, restoreVolume } from "./mute.js";
import { resetTrustedClickCooldown } from "./skip-button.js";

function resetWhenAdEnds() {
  if (isAdPlaying()) {
    return;
  }

  restoreVolume();
  resetAdHandlers();
  resetTrustedClickCooldown();
}

export function startAdController() {
  window.setInterval(() => {
    muteDuringAd();
  }, AD_MUTE_CHECK_MS);

  window.setInterval(() => {
    muteDuringAd();
    resetWhenAdEnds();
    handleVideoAd();
  }, VIDEO_CHECK_MS);

  window.setInterval(() => {
    muteDuringAd();
    resetWhenAdEnds();
    handleStaticAd();
  }, STATIC_CHECK_MS);

  document.addEventListener("yt-navigate-finish", () => {
    markNavigation();
    resetWhenAdEnds();
  });
}
