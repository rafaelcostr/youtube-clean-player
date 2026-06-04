import { STORAGE_KEYS } from "../shared/constants.js";

const defaultStatus = {
  pageActions: 0,
  skippedVideoAds: 0,
  hiddenPromotions: 0,
  lastAction: "Extensão iniciada",
  updatedAt: Date.now()
};

let state = { ...defaultStatus };
let saveTimer;

export function getEnabledDefault() {
  return true;
}

export function record(action, field) {
  state.pageActions += 1;
  state[field] += 1;
  state.lastAction = action;
  saveStatus();
}

function saveStatus() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    state.updatedAt = Date.now();
    chrome.storage.local.set({ [STORAGE_KEYS.status]: state }, () => {
      void chrome.runtime.lastError;
    });
  }, 100);
}

export async function loadEnabledState() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.enabled);
  return stored[STORAGE_KEYS.enabled] !== false;
}

export function bootstrapStats() {
  saveStatus();
}
