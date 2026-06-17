import { NETWORK_RULES_COUNT, STORAGE_KEYS } from "../shared/constants.js";

const enabledInput = document.getElementById("enabled");
const statusText = document.getElementById("statusText");
const skipped = document.getElementById("skipped");
const hidden = document.getElementById("hidden");
const blocked = document.getElementById("blocked");
const lastAction = document.getElementById("lastAction");

function updateStatusUi(isEnabled) {
  statusText.textContent = isEnabled ? "Ativo no YouTube" : "Pausado";
  statusText.style.color = isEnabled ? "#49d17d" : "#f0a04b";
}

function updateStatsUi(status) {
  if (!status) {
    return;
  }

  skipped.textContent = status.skippedVideoAds || 0;
  hidden.textContent = status.hiddenPromotions || 0;
  lastAction.textContent = status.lastAction || lastAction.textContent;
}

blocked.textContent = `${NETWORK_RULES_COUNT} regras`;

chrome.storage.local.get([STORAGE_KEYS.enabled, STORAGE_KEYS.status], (stored) => {
  const enabled = stored[STORAGE_KEYS.enabled] !== false;
  enabledInput.checked = enabled;
  updateStatusUi(enabled);
  updateStatsUi(stored[STORAGE_KEYS.status]);
});

enabledInput.addEventListener("change", async () => {
  const isEnabled = enabledInput.checked;
  await chrome.storage.local.set({ [STORAGE_KEYS.enabled]: isEnabled });
  updateStatusUi(isEnabled);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }

  if (changes[STORAGE_KEYS.enabled]) {
    const isEnabled = changes[STORAGE_KEYS.enabled].newValue !== false;
    enabledInput.checked = isEnabled;
    updateStatusUi(isEnabled);
  }

  if (changes[STORAGE_KEYS.status]) {
    updateStatsUi(changes[STORAGE_KEYS.status].newValue);
  }
});
