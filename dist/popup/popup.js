(() => {
  // src/shared/constants.js
  var STORAGE_KEYS = {
    enabled: "enabled",
    status: "cleanPlayerStatus"
  };
  var NETWORK_RULES_COUNT = 16;

  // src/popup/popup.js
  var enabledInput = document.getElementById("enabled");
  var statusText = document.getElementById("statusText");
  var skipped = document.getElementById("skipped");
  var hidden = document.getElementById("hidden");
  var blocked = document.getElementById("blocked");
  var lastAction = document.getElementById("lastAction");
  function updateStatusUi(isEnabled) {
    statusText.textContent = isEnabled ? "Ativo no YouTube" : "Pausado";
    statusText.style.color = isEnabled ? "#49d17d" : "#f0a04b";
  }
  blocked.textContent = `${NETWORK_RULES_COUNT} regras`;
  chrome.storage.local.get([STORAGE_KEYS.enabled, STORAGE_KEYS.status], (stored) => {
    const enabled = stored[STORAGE_KEYS.enabled] !== false;
    enabledInput.checked = enabled;
    updateStatusUi(enabled);
    const status = stored[STORAGE_KEYS.status];
    if (!status) {
      return;
    }
    skipped.textContent = status.skippedVideoAds || 0;
    hidden.textContent = status.hiddenPromotions || 0;
    lastAction.textContent = status.lastAction || lastAction.textContent;
  });
  enabledInput.addEventListener("change", async () => {
    const isEnabled = enabledInput.checked;
    await chrome.storage.local.set({ [STORAGE_KEYS.enabled]: isEnabled });
    updateStatusUi(isEnabled);
  });
})();
