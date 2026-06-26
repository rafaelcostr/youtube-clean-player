import { PLAYER_TICK_MS } from "../shared/constants.js";
import { getPlayer, isAdPlaying, isVideoAdStream } from "./dom.js";
import { handleStaticAd, handleVideoAd, resetAdHandlers } from "./ad-handlers.js";
import { markNavigation } from "./navigation-grace.js";
import { isEnabled, muteDuringAd, restoreVolume } from "./mute.js";
import { resetTrustedClickCooldown } from "./skip-button.js";

let tickIntervalId = null;

function resetWhenAdEnds() {
  if (isAdPlaying()) {
    return;
  }

  restoreVolume();
  resetAdHandlers();
  resetTrustedClickCooldown();
}

function tick() {
  muteDuringAd();
  resetWhenAdEnds();

  if (!isEnabled() || !isAdPlaying()) {
    return;
  }

  const player = getPlayer();
  if (player && isVideoAdStream(player)) {
    handleVideoAd();
    return;
  }

  handleStaticAd();
}

function onNavigateFinish() {
  markNavigation();
  resetWhenAdEnds();
}

export function stopAdController() {
  if (tickIntervalId !== null) {
    window.clearInterval(tickIntervalId);
    tickIntervalId = null;
  }

  document.removeEventListener("yt-navigate-finish", onNavigateFinish);
}

export function startAdController() {
  stopAdController();

  tickIntervalId = window.setInterval(tick, PLAYER_TICK_MS);
  document.addEventListener("yt-navigate-finish", onNavigateFinish);
  tick();
}
