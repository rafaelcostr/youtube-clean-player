import { STATUS_FIELDS, STORAGE_KEYS } from "../shared/constants.js";

const defaultStatus = {
  skippedVideoAds: 0,
  hiddenPromotions: 0,
  lastAction: "Extensão iniciada",
  updatedAt: Date.now()
};

let state = { ...defaultStatus };
let saveTimer;

export function record(action, field) {
  if (!STATUS_FIELDS.includes(field)) {
    return;
  }

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

export async function bootstrapStats() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.status);
  const saved = stored[STORAGE_KEYS.status];

  if (!saved || typeof saved !== "object") {
    return;
  }

  state = {
    ...defaultStatus,
    skippedVideoAds: saved.skippedVideoAds ?? defaultStatus.skippedVideoAds,
    hiddenPromotions: saved.hiddenPromotions ?? defaultStatus.hiddenPromotions,
    lastAction: saved.lastAction ?? defaultStatus.lastAction,
    updatedAt: saved.updatedAt ?? defaultStatus.updatedAt
  };
}
