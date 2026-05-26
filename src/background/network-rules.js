import { RULESET_ID, STORAGE_KEYS } from "../shared/constants.js";

export async function applyNetworkBlocking(enabled) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabled ? [RULESET_ID] : [],
    disableRulesetIds: enabled ? [] : [RULESET_ID]
  });
}

export async function syncNetworkRulesFromStorage() {
  const { [STORAGE_KEYS.enabled]: enabled = true } = await chrome.storage.local.get(STORAGE_KEYS.enabled);
  await applyNetworkBlocking(enabled !== false);
}

export function initNetworkRules() {
  chrome.runtime.onInstalled.addListener(syncNetworkRulesFromStorage);
  chrome.runtime.onStartup.addListener(syncNetworkRulesFromStorage);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEYS.enabled]) {
      return;
    }

    applyNetworkBlocking(changes[STORAGE_KEYS.enabled].newValue !== false);
  });
}
