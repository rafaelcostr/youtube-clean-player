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
    lastAction: "Extens\xE3o iniciada",
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
  var MODAL_BACKDROP_SELECTORS = ["tp-yt-iron-overlay-backdrop"];
  var PLAYER_SELECTORS = {
    active: "#movie_player.html5-video-player, .html5-video-player.ad-showing, .html5-video-player.ad-interrupting",
    adPlaying: ".html5-video-player.ad-showing, .html5-video-player.ad-interrupting",
    root: "#movie_player, .html5-video-player",
    video: "video.html5-main-video, video",
    adLabel: ".ytp-ad-pod-index, .ytp-ad-text, .ytp-ad-preview-text"
  };

  // src/content/cosmetic.js
  var observer;
  var intervalId;
  var inspectScheduled = false;
  var isInspecting = false;
  function isElementVisible(element) {
    if (!element || !element.isConnected) {
      return false;
    }
    try {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    } catch {
      return false;
    }
  }
  function hideElement(element) {
    if (element.dataset.cleanPlayerHandled === "true") {
      return false;
    }
    element.dataset.cleanPlayerHandled = "true";
    element.style.setProperty("display", "none", "important");
    return true;
  }
  function hidePromotionalElements() {
    for (const selector of AD_UI_SELECTORS) {
      document.querySelectorAll(selector).forEach((element) => {
        if (!isElementVisible(element)) {
          return;
        }
        if (hideElement(element)) {
          record("Promo\xE7\xE3o visual ocultada", "hiddenPromotions");
        }
      });
    }
  }
  function unlockPageScroll() {
    document.documentElement.removeAttribute("aria-hidden");
    document.body.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow");
  }
  function findVisibleEnforcementRoot() {
    for (const dialog of document.querySelectorAll("tp-yt-paper-dialog")) {
      if (!dialog.querySelector(".ytd-enforcement-message-view-model")) {
        continue;
      }
      if (isElementVisible(dialog) || dialog.hasAttribute("opened")) {
        return dialog;
      }
    }
    const model = document.querySelector("ytd-enforcement-message-view-model");
    if (model && isElementVisible(model)) {
      return model;
    }
    return null;
  }
  function releaseEnforcementBackdrops() {
    for (const selector of MODAL_BACKDROP_SELECTORS) {
      document.querySelectorAll(`${selector}[opened]`).forEach((element) => {
        element.removeAttribute("opened");
        element.classList.remove("opened");
      });
    }
  }
  function resumeVideoAfterEnforcement() {
    const video = document.querySelector(PLAYER_SELECTORS.video);
    if (!video || !video.paused) {
      return;
    }
    const playAttempt = video.play();
    if (playAttempt?.catch) {
      playAttempt.catch(() => {
      });
    }
  }
  function isPaperDialog(element) {
    return element?.tagName?.toLowerCase() === "tp-yt-paper-dialog";
  }
  function dismissEnforcementModal() {
    const enforcementRoot = findVisibleEnforcementRoot();
    if (!enforcementRoot) {
      unlockPageScroll();
      return;
    }
    if (hideElement(enforcementRoot)) {
      releaseEnforcementBackdrops();
      unlockPageScroll();
      resumeVideoAfterEnforcement();
      return;
    }
    if (isPaperDialog(enforcementRoot)) {
      const model = enforcementRoot.querySelector(".ytd-enforcement-message-view-model");
      if (model && hideElement(model)) {
        hideElement(enforcementRoot);
        releaseEnforcementBackdrops();
        unlockPageScroll();
        resumeVideoAfterEnforcement();
      }
    }
  }
  function runInspectPage() {
    if (isInspecting) {
      return;
    }
    isInspecting = true;
    try {
      dismissEnforcementModal();
      hidePromotionalElements();
    } catch {
    } finally {
      isInspecting = false;
    }
  }
  function scheduleInspectPage() {
    if (inspectScheduled) {
      return;
    }
    inspectScheduled = true;
    requestAnimationFrame(() => {
      inspectScheduled = false;
      runInspectPage();
    });
  }
  function startCosmeticObserver() {
    if (observer) {
      return;
    }
    observer = new MutationObserver(scheduleInspectPage);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "opened", "aria-hidden"]
    });
    intervalId = window.setInterval(runInspectPage, 1e3);
    runInspectPage();
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
        record("Bot\xE3o de pular an\xFAncio acionado", "skippedVideoAds");
        return;
      }
      record("Reprodu\xE7\xE3o de an\xFAncio avan\xE7ada", "skippedVideoAds");
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
