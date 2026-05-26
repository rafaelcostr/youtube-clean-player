import { CLICK_COOLDOWN_MS, RUNTIME_ACTIONS, STORAGE_KEYS } from "../shared/constants.js";

const attachedTabs = new Set();
const lastClickAtByTab = new Map();

function debuggerCall(method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result);
    });
  });
}

async function trustedClick(tabId, rect) {
  const now = Date.now();
  const lastClickAt = lastClickAtByTab.get(tabId) || 0;

  if (now - lastClickAt < CLICK_COOLDOWN_MS) {
    return { ok: true, skipped: true };
  }

  lastClickAtByTab.set(tabId, now);

  const x = Math.round(rect.x + rect.width / 2);
  const y = Math.round(rect.y + rect.height / 2);
  const target = { tabId };

  try {
    if (!attachedTabs.has(tabId)) {
      await debuggerCall(chrome.debugger.attach, target, "1.3");
      attachedTabs.add(tabId);
    }

    await debuggerCall(chrome.debugger.sendCommand, target, "Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y
    });

    await debuggerCall(chrome.debugger.sendCommand, target, "Input.dispatchMouseEvent", {
      type: "mousePressed",
      button: "left",
      x,
      y,
      clickCount: 1
    });

    await debuggerCall(chrome.debugger.sendCommand, target, "Input.dispatchMouseEvent", {
      type: "mouseReleased",
      button: "left",
      x,
      y,
      clickCount: 1
    });

    return { ok: true };
  } catch (error) {
    attachedTabs.delete(tabId);

    try {
      await debuggerCall(chrome.debugger.detach, target);
    } catch {
      // Ignore detach errors after a failed click attempt.
    }

    return { ok: false, error: error.message };
  }
}

export function initTrustedClick() {
  chrome.debugger.onDetach.addListener((source) => {
    if (source.tabId) {
      attachedTabs.delete(source.tabId);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== RUNTIME_ACTIONS.trustedClick || !sender.tab?.id) {
      return false;
    }

    chrome.storage.local.get(STORAGE_KEYS.enabled, async ({ [STORAGE_KEYS.enabled]: enabled = true }) => {
      if (enabled === false) {
        sendResponse({ ok: false, disabled: true });
        return;
      }

      const result = await trustedClick(sender.tab.id, message.rect);
      sendResponse(result);
    });

    return true;
  });
}
