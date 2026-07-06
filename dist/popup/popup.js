(() => {
  // src/shared/constants.js
  var STORAGE_KEYS = {
    enabled: "enabled",
    autoSkip: "autoSkip",
    autoClick: "autoClick",
    speed: "speed",
    status: "status"
  };

  // src/popup/popup.js
  var enabledInput = document.getElementById("enabled");
  var autoSkipInput = document.getElementById("autoSkip");
  var autoClickInput = document.getElementById("autoClick");
  var speedInput = document.getElementById("speed");
  var statusText = document.getElementById("statusText");
  var skipped = document.getElementById("skipped");
  var lastAction = document.getElementById("lastAction");
  function updateStatusUi(isEnabled) {
    statusText.textContent = isEnabled ? "Ativo no YouTube" : "Pausado";
    statusText.style.color = isEnabled ? "#49d17d" : "#f0a04b";
  }
  function updateStatsUi(status) {
    if (!status) {
      return;
    }
    skipped.textContent = status.skippedVideoAds || 0;
    lastAction.textContent = status.lastAction || lastAction.textContent;
  }
  chrome.storage.local.get(
    [STORAGE_KEYS.enabled, STORAGE_KEYS.autoSkip, STORAGE_KEYS.autoClick, STORAGE_KEYS.speed, STORAGE_KEYS.status],
    (stored) => {
      const isEnabled = stored[STORAGE_KEYS.enabled] !== false;
      enabledInput.checked = isEnabled;
      autoSkipInput.checked = stored[STORAGE_KEYS.autoSkip] !== false;
      autoClickInput.checked = stored[STORAGE_KEYS.autoClick] === true;
      speedInput.value = String(stored[STORAGE_KEYS.speed] || 2);
      updateStatusUi(isEnabled);
      updateStatsUi(stored[STORAGE_KEYS.status]);
    }
  );
  enabledInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.enabled]: enabledInput.checked });
    updateStatusUi(enabledInput.checked);
  });
  autoSkipInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.autoSkip]: autoSkipInput.checked });
  });
  autoClickInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.autoClick]: autoClickInput.checked });
  });
  speedInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.speed]: parseFloat(speedInput.value) });
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
    if (changes[STORAGE_KEYS.autoSkip]) {
      autoSkipInput.checked = changes[STORAGE_KEYS.autoSkip].newValue !== false;
    }
    if (changes[STORAGE_KEYS.autoClick]) {
      autoClickInput.checked = changes[STORAGE_KEYS.autoClick].newValue === true;
    }
    if (changes[STORAGE_KEYS.speed]) {
      speedInput.value = String(changes[STORAGE_KEYS.speed].newValue || 2);
    }
    if (changes[STORAGE_KEYS.status]) {
      updateStatsUi(changes[STORAGE_KEYS.status].newValue);
    }
  });
})();
