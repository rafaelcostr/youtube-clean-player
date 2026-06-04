import {
  DATASET_KEYS,
  MESSAGE_SOURCE,
  MESSAGE_TYPES,
  RUNTIME_ACTIONS,
  SKIP_METHODS,
  STORAGE_KEYS
} from "../shared/constants.js";
import { record } from "./stats.js";

export function syncEnabledFlag(enabled) {
  document.documentElement.dataset[DATASET_KEYS.enabled] = enabled ? "true" : "false";
}

export function initPageBridge(enabledRef) {
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== MESSAGE_SOURCE) {
      return;
    }

    if (event.data.type === MESSAGE_TYPES.trustedClick) {
      if (!enabledRef.current) {
        return;
      }

      if (!chrome.runtime?.id) {
        return;
      }

      chrome.runtime.sendMessage(
        {
          action: RUNTIME_ACTIONS.trustedClick,
          rect: event.data.rect
        },
        () => {
          void chrome.runtime.lastError;
        }
      );
      return;
    }

    if (event.data.type !== MESSAGE_TYPES.skip) {
      return;
    }

    if (event.data.method === SKIP_METHODS.click) {
      record("Botão de pular anúncio acionado", "skippedVideoAds");
      return;
    }

    record("Reprodução de anúncio avançada", "skippedVideoAds");
  });
}

export function watchEnabledChanges(onChange) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEYS.enabled]) {
      return;
    }

    onChange(changes[STORAGE_KEYS.enabled].newValue !== false);
  });
}
