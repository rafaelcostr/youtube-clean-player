import { DATASET_KEYS } from "../shared/constants.js";
import { getVideo, isAdPlaying } from "./dom.js";

let savedVolume = null;
let mutedByUs = false;

export function isEnabled() {
  return document.documentElement.dataset[DATASET_KEYS.enabled] !== "false";
}

export function muteOnce() {
  const video = getVideo();
  if (!video) {
    return;
  }

  if (!mutedByUs) {
    savedVolume = video.volume;
    mutedByUs = true;
  }

  video.muted = true;
  video.volume = 0;
}

export function muteDuringAd() {
  if (!isEnabled() || !isAdPlaying()) {
    return;
  }

  muteOnce();
}

export function restoreVolume() {
  const video = getVideo();
  if (!video || !mutedByUs) {
    mutedByUs = false;
    savedVolume = null;
    return;
  }

  video.volume = savedVolume ?? 1;
  video.muted = false;
  mutedByUs = false;
  savedVolume = null;
}
