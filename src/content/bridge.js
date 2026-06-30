import { MESSAGE_SOURCE, MESSAGE_TYPES, RUNTIME_ACTIONS, STORAGE_KEYS } from "../shared/constants.js";
import { record } from "./stats.js";

const enabledRef = { current: true };
let bridgeToken = "";

function syncLocalStorage(enabled, token) {
  try {
    localStorage.setItem("ycp_enabled", enabled ? "1" : "0");
    if (token) {
      localStorage.setItem("ycp_token", token);
    }
  } catch {
    // localStorage indisponível em contextos restritos.
  }
}

function applyEnabled(enabled) {
  enabledRef.current = enabled;
  syncLocalStorage(enabled, bridgeToken);
}

export function initBridge() {
  bridgeToken =
    crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  syncLocalStorage(true, bridgeToken);
}

export function initPageBridge() {
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== MESSAGE_SOURCE) {
      return;
    }

    if (event.data.token !== bridgeToken) {
      return;
    }

    if (event.data.type === MESSAGE_TYPES.trustedClick) {
      if (!enabledRef.current || !chrome.runtime?.id) {
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

    if (event.data.type === MESSAGE_TYPES.skip) {
      record("Anúncio pulado", "skippedVideoAds");
    }
  });
}

export function watchEnabled(onChange) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEYS.enabled]) {
      return;
    }

    const enabled = changes[STORAGE_KEYS.enabled].newValue !== false;
    onChange(enabled);
  });
}

export { applyEnabled };
