import { applyEnabled, initBridge, initPageBridge, watchEnabled } from "./bridge.js";
import { bootstrapStats, loadEnabledState } from "./stats.js";

const PLAYER_FILE = "dist/player.js";

try {
  localStorage.setItem("ycp_enabled", localStorage.getItem("ycp_enabled") || "1");
} catch {
  // Ignora falha de storage.
}

function injectFallbackPlayer() {
  try {
    const alive = parseInt(localStorage.getItem("ycp_alive") || "0", 10);
    if (Date.now() - alive < 2500) {
      return;
    }
  } catch {
    // Continua para tentar injetar.
  }

  const script = document.createElement("script");
  script.src = `${chrome.runtime.getURL(PLAYER_FILE)}?t=${Date.now()}`;
  script.onload = () => script.remove();
  script.onerror = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

async function start() {
  await bootstrapStats();
  initBridge();
  initPageBridge();

  const enabled = await loadEnabledState();
  applyEnabled(enabled);

  watchEnabled((nextEnabled) => {
    applyEnabled(nextEnabled);
  });

  window.setTimeout(injectFallbackPlayer, 2000);
  window.setInterval(injectFallbackPlayer, 5000);
}

start();
