import {
  DATASET_KEYS,
  MESSAGE_SOURCE,
  MESSAGE_TYPES,
  RUNTIME_ACTIONS,
  SKIP_METHODS,
  STORAGE_KEYS
} from "../shared/constants.js";
import { isValidClickRect } from "../shared/validation.js";
import { record } from "./stats.js";

let bridgeToken = "";

export function initBridgeToken() {
  bridgeToken =
    crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  document.documentElement.dataset[DATASET_KEYS.token] = bridgeToken;
}

export function syncEnabledFlag(enabled) {
  document.documentElement.dataset[DATASET_KEYS.enabled] = enabled ? "true" : "false";
}

function isAuthenticatedMessage(data) {
  return typeof data?.token === "string" && data.token.length > 0 && data.token === bridgeToken;
}

export function initPageBridge(enabledRef) {
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== MESSAGE_SOURCE) {
      return;
    }

    if (!isAuthenticatedMessage(event.data)) {
      return;
    }

    if (event.data.type === MESSAGE_TYPES.trustedClick) {
      if (!enabledRef.current) {
        return;
      }

      if (!isValidClickRect(event.data.rect, window)) {
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
      record("Botão Pular acionado", "skippedVideoAds");
      return;
    }

    record("Anúncio em vídeo pulado", "skippedVideoAds");
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
