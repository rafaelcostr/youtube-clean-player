import { DATASET_KEYS } from "../shared/constants.js";
import { startAdController, stopAdController } from "./controller.js";

const version = document.documentElement.dataset[DATASET_KEYS.version] || "";

if (window.__youtubeCleanPlayerVersion !== version) {
  if (window.__youtubeCleanPlayerVersion) {
    stopAdController();
  }

  window.__youtubeCleanPlayerVersion = version;
  startAdController();
}
