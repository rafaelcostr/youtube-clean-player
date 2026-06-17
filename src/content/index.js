import { bootstrapStats, loadEnabledState } from "./stats.js";
import { startCosmeticObserver, stopCosmeticObserver } from "./cosmetic.js";
import { injectPageScript } from "./injector.js";
import { initBridgeToken, initPageBridge, syncEnabledFlag, watchEnabledChanges } from "./bridge.js";

const enabledRef = { current: true };

function applyEnabledState(enabled) {
  enabledRef.current = enabled;
  syncEnabledFlag(enabled);

  if (enabled) {
    startCosmeticObserver();
  } else {
    stopCosmeticObserver();
  }
}

async function start() {
  await bootstrapStats();
  initBridgeToken();
  injectPageScript();
  initPageBridge(enabledRef);

  const enabled = await loadEnabledState();
  applyEnabledState(enabled);
  watchEnabledChanges(applyEnabledState);
}

if (document.documentElement) {
  start();
} else {
  document.addEventListener("DOMContentLoaded", start, { once: true });
}
