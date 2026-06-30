// src/shared/constants.js
var STORAGE_KEYS = {
  enabled: "enabled",
  autoSkip: "autoSkip",
  status: "status"
};
var CLICK_COOLDOWN_MS = 1500;
var RUNTIME_ACTIONS = {
  trustedClick: "trustedClick"
};

// src/background/trusted-click.js
var attachedTabs = /* @__PURE__ */ new Set();
var lastClickAtByTab = /* @__PURE__ */ new Map();
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
function clearTabState(tabId) {
  attachedTabs.delete(tabId);
  lastClickAtByTab.delete(tabId);
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
    await debuggerCall(chrome.debugger.detach, target);
    attachedTabs.delete(tabId);
    return { ok: true };
  } catch (error) {
    clearTabState(tabId);
    try {
      await debuggerCall(chrome.debugger.detach, target);
    } catch {
    }
    return { ok: false, error: error.message };
  }
}
function initTrustedClick() {
  chrome.debugger.onDetach.addListener((source) => {
    if (source.tabId) {
      clearTabState(source.tabId);
    }
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    clearTabState(tabId);
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== RUNTIME_ACTIONS.trustedClick || !sender.tab?.id) {
      return false;
    }
    const url = sender.url || sender.tab.url || "";
    if (url && !/^https:\/\/(www\.|m\.)?youtube\.com\//.test(url)) {
      sendResponse({ ok: false, error: "Invalid tab" });
      return false;
    }
    chrome.storage.local.get(STORAGE_KEYS.enabled, async ({ [STORAGE_KEYS.enabled]: enabled = true }) => {
      if (enabled === false) {
        sendResponse({ ok: false, disabled: true });
        return;
      }
      const rect = message.rect;
      if (!rect || typeof rect !== "object") {
        sendResponse({ ok: false, error: "Invalid rect" });
        return;
      }
      const result = await trustedClick(sender.tab.id, rect);
      sendResponse(result);
    });
    return true;
  });
}

// src/background/index.js
initTrustedClick();
