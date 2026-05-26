import { DATASET_KEYS } from "../shared/constants.js";
import { getVideo } from "./dom.js";

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
}

export function restoreVolume() {
  const video = getVideo();
  if (!video || !mutedByUs) {
    mutedByUs = false;
    savedVolume = null;
    return;
  }

  video.muted = false;
  video.volume = savedVolume ?? 1;
  mutedByUs = false;
  savedVolume = null;
}
