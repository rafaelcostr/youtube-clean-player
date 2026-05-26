(() => {
  // src/shared/constants.js
  var MESSAGE_SOURCE = "youtube-clean-player";
  var STORAGE_KEYS = {
    enabled: "enabled",
    status: "cleanPlayerStatus"
  };
  var DATASET_KEYS = {
    enabled: "cleanPlayerEnabled",
    skipLoaded: "cleanPlayerSkipLoaded"
  };
  var MESSAGE_TYPES = {
    skip: "skip",
    trustedClick: "trusted-click"
  };
  var SKIP_METHODS = {
    click: "click",
    seek: "seek"
  };
  var RUNTIME_ACTIONS = {
    trustedClick: "trustedClick"
  };

  // src/content/stats.js
  var defaultStatus = {
    pageActions: 0,
    skippedVideoAds: 0,
    hiddenPromotions: 0,
    lastAction: "Extensao iniciada",
    updatedAt: Date.now()
  };
  var state = { ...defaultStatus };
  var saveTimer;
  function record(action, field) {
    state.pageActions += 1;
    state[field] += 1;
    state.lastAction = action;
    saveStatus();
  }
  function saveStatus() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      state.updatedAt = Date.now();
      chrome.storage.local.set({ [STORAGE_KEYS.status]: state });
    }, 100);
  }
  async function loadEnabledState() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.enabled);
    return stored[STORAGE_KEYS.enabled] !== false;
  }
  function bootstrapStats() {
    saveStatus();
  }

  // src/shared/selectors.js
  var AD_UI_SELECTORS = [
    ".ytp-ad-overlay-container",
    ".ytp-ad-message-container",
    ".ytp-ad-player-overlay",
    "#masthead-ad",
    "ytd-ad-slot-renderer",
    "ytd-banner-promo-renderer",
    "ytd-display-ad-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-promoted-video-renderer",
    "ytd-statement-banner-renderer"
  ];

  // src/content/cosmetic.js
  var observer;
  var intervalId;
  function hidePromotionalElements() {
    for (const selector of AD_UI_SELECTORS) {
      document.querySelectorAll(selector).forEach((element) => {
        if (element.dataset.cleanPlayerHandled === "true") {
          return;
        }
        element.dataset.cleanPlayerHandled = "true";
        element.style.setProperty("display", "none", "important");
        record("Promocao visual ocultada", "hiddenPromotions");
      });
    }
  }
  function inspectPage() {
    hidePromotionalElements();
  }
  function startCosmeticObserver() {
    if (observer) {
      return;
    }
    observer = new MutationObserver(inspectPage);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
    intervalId = window.setInterval(inspectPage, 500);
    inspectPage();
  }
  function stopCosmeticObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  // src/content/injector.js
  var PAGE_ENTRY = "dist/page.js";
  function injectPageScript() {
    if (document.documentElement.dataset[DATASET_KEYS.skipLoaded] === "true") {
      return;
    }
    document.documentElement.dataset[DATASET_KEYS.skipLoaded] = "true";
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(PAGE_ENTRY);
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  }

  // src/content/bridge.js
  function syncEnabledFlag(enabled) {
    document.documentElement.dataset[DATASET_KEYS.enabled] = enabled ? "true" : "false";
  }
  function initPageBridge(enabledRef2) {
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.data?.source !== MESSAGE_SOURCE) {
        return;
      }
      if (event.data.type === MESSAGE_TYPES.trustedClick) {
        if (!enabledRef2.current) {
          return;
        }
        chrome.runtime.sendMessage({
          action: RUNTIME_ACTIONS.trustedClick,
          rect: event.data.rect
        });
        return;
      }
      if (event.data.type !== MESSAGE_TYPES.skip) {
        return;
      }
      if (event.data.method === SKIP_METHODS.click) {
        record("Botao de pular anuncio acionado", "skippedVideoAds");
        return;
      }
      record("Reproducao de anuncio avancada", "skippedVideoAds");
    });
  }
  function watchEnabledChanges(onChange) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[STORAGE_KEYS.enabled]) {
        return;
      }
      onChange(changes[STORAGE_KEYS.enabled].newValue !== false);
    });
  }

  // src/content/index.js
  var enabledRef = { current: true };
  function applyEnabledState(enabled) {
    enabledRef.current = enabled;
    syncEnabledFlag(enabled);
    if (enabled) {
      startCosmeticObserver();
    } else {
      stopCosmeticObserver();
    }
  }
  async function start() {
    bootstrapStats();
    injectPageScript();
    initPageBridge(enabledRef);
    const enabled = await loadEnabledState();
    applyEnabledState(enabled);
    watchEnabledChanges(applyEnabledState);
  }
  if (document.documentElement) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();
