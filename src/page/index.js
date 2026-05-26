import { startAdController } from "./controller.js";

if (!window.__youtubeCleanPlayerSkip) {
  window.__youtubeCleanPlayerSkip = true;
  startAdController();
}
