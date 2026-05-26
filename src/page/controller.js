import { STATIC_CHECK_MS, VIDEO_CHECK_MS } from "../shared/constants.js";
import { isAdPlaying } from "./dom.js";
import { handleStaticAd, handleVideoAd, resetAdHandlers } from "./ad-handlers.js";
import { restoreVolume } from "./mute.js";
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
    resetWhenAdEnds();
    handleVideoAd();
  }, VIDEO_CHECK_MS);

  window.setInterval(() => {
    resetWhenAdEnds();
    handleStaticAd();
  }, STATIC_CHECK_MS);

  document.addEventListener("yt-navigate-finish", () => {
    resetWhenAdEnds();
    handleVideoAd();
    handleStaticAd();
  });
}
