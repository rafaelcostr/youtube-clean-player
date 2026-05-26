(() => {
  // src/shared/constants.js
  var MESSAGE_SOURCE = "youtube-clean-player";
  var DATASET_KEYS = {
    enabled: "cleanPlayerEnabled",
    skipLoaded: "cleanPlayerSkipLoaded"
  };
  var CLICK_COOLDOWN_MS = 350;
  var VIDEO_CHECK_MS = 500;
  var STATIC_CHECK_MS = 400;
  var MAX_VIDEO_AD_DURATION = 120;
  var COUNTDOWN_PATTERN = /pular em|skip in|ignorar em|skip ad in/i;
  var MESSAGE_TYPES = {
    skip: "skip",
    trustedClick: "trusted-click"
  };
  var SKIP_METHODS = {
    click: "click",
    seek: "seek"
  };

  // src/shared/selectors.js
  var STATIC_AD_MARKERS = [
    ".ytp-ad-image-overlay",
    ".ytp-ad-overlay-image",
    ".ytp-ad-text-overlay",
    ".ytp-ad-preview-container"
  ];
  var SKIP_BUTTON_SELECTORS = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button",
    'button[aria-label^="Skip ad"]',
    'button[aria-label*="Pular"]',
    'button[aria-label*="Ignorar"]'
  ];
  var PLAYER_SELECTORS = {
    active: "#movie_player.html5-video-player, .html5-video-player.ad-showing, .html5-video-player.ad-interrupting",
    adPlaying: ".html5-video-player.ad-showing, .html5-video-player.ad-interrupting",
    root: "#movie_player, .html5-video-player",
    video: "video.html5-main-video, video",
    adLabel: ".ytp-ad-pod-index, .ytp-ad-text, .ytp-ad-preview-text"
  };

  // src/page/dom.js
  function getPlayer() {
    return document.querySelector(PLAYER_SELECTORS.active);
  }
  function isAdPlaying() {
    return !!document.querySelector(PLAYER_SELECTORS.adPlaying);
  }
  function getVideo() {
    return document.querySelector(PLAYER_SELECTORS.video);
  }
  function getAdKey() {
    const label = document.querySelector(PLAYER_SELECTORS.adLabel)?.textContent?.trim();
    const video = getVideo();
    return `${label || "ad"}|${video?.src?.slice(-40) || ""}`;
  }
  function isVisible(element) {
    if (!element) {
      return false;
    }
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  // src/page/mute.js
  var savedVolume = null;
  var mutedByUs = false;
  function isEnabled() {
    return document.documentElement.dataset[DATASET_KEYS.enabled] !== "false";
  }
  function muteOnce() {
    const video = getVideo();
    if (!video) {
      return;
    }
    if (!mutedByUs) {
      savedVolume = video.volume;
      mutedByUs = true;
    }
    video.muted = true;
  }
  function restoreVolume() {
    const video = getVideo();
    if (!video || !mutedByUs) {
      mutedByUs = false;
      savedVolume = null;
      return;
    }
    video.muted = false;
    video.volume = savedVolume ?? 1;
    mutedByUs = false;
    savedVolume = null;
  }

  // src/page/skip-button.js
  var lastTrustedClickAt = 0;
  function findSkipButton() {
    const player = getPlayer() || document;
    for (const selector of SKIP_BUTTON_SELECTORS) {
      for (const element of player.querySelectorAll(selector)) {
        if (!isVisible(element)) {
          continue;
        }
        if (selector === ".ytp-skip-ad-button") {
          return element;
        }
        const text = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`;
        if (COUNTDOWN_PATTERN.test(text)) {
          continue;
        }
        return element.closest(".ytp-skip-ad-button, .ytp-ad-skip-button-modern, button") || element;
      }
    }
    for (const element of player.querySelectorAll("button, .ytp-button, div[class*='skip']")) {
      const text = (element.textContent || element.getAttribute("aria-label") || "").trim();
      if (!text || COUNTDOWN_PATTERN.test(text)) {
        continue;
      }
      if (/^pular$/i.test(text) || /^skip$/i.test(text) || /^ignorar$/i.test(text)) {
        return element;
      }
    }
    return null;
  }
  function requestTrustedClick(button) {
    const now = Date.now();
    if (now - lastTrustedClickAt < CLICK_COOLDOWN_MS) {
      return;
    }
    lastTrustedClickAt = now;
    const rect = button.getBoundingClientRect();
    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type: MESSAGE_TYPES.trustedClick,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      },
      "*"
    );
  }
  function resetTrustedClickCooldown() {
    lastTrustedClickAt = 0;
  }

  // src/page/ad-handlers.js
  var lastNotifyClickKey = "";
  var lastNotifySeekKey = "";
  function notify(method, key) {
    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type: MESSAGE_TYPES.skip,
        method,
        key
      },
      "*"
    );
  }
  function isVideoAd(player) {
    if (!player) {
      return false;
    }
    if (player.querySelector(STATIC_AD_MARKERS.join(", "))) {
      return false;
    }
    const video = getVideo();
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return false;
    }
    return video.duration <= MAX_VIDEO_AD_DURATION;
  }
  function isStaticAd(player) {
    if (!player || !isAdPlaying()) {
      return false;
    }
    return !isVideoAd(player);
  }
  function seekVideoAd() {
    const video = getVideo();
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0 || video.duration > MAX_VIDEO_AD_DURATION) {
      return;
    }
    video.muted = true;
    video.currentTime = Math.max(video.duration - 0.1, 0);
  }
  function handleVideoAd() {
    if (!isEnabled() || !isAdPlaying()) {
      return;
    }
    const player = getPlayer();
    if (!player || !isVideoAd(player)) {
      return;
    }
    muteOnce();
    const adKey = getAdKey();
    seekVideoAd();
    if (lastNotifySeekKey !== adKey) {
      lastNotifySeekKey = adKey;
      notify(SKIP_METHODS.seek, adKey);
    }
  }
  function handleStaticAd() {
    if (!isEnabled() || !isAdPlaying()) {
      return;
    }
    const player = getPlayer();
    if (!player || !isStaticAd(player)) {
      return;
    }
    muteOnce();
    const skipButton = findSkipButton();
    if (!skipButton) {
      return;
    }
    requestTrustedClick(skipButton);
    const adKey = getAdKey();
    if (lastNotifyClickKey !== adKey) {
      lastNotifyClickKey = adKey;
      notify(SKIP_METHODS.click, adKey);
    }
  }
  function resetAdHandlers() {
    lastNotifyClickKey = "";
    lastNotifySeekKey = "";
  }

  // src/page/controller.js
  function resetWhenAdEnds() {
    if (isAdPlaying()) {
      return;
    }
    restoreVolume();
    resetAdHandlers();
    resetTrustedClickCooldown();
  }
  function startAdController() {
    window.setInterval(() => {
      resetWhenAdEnds();
      handleVideoAd();
    }, VIDEO_CHECK_MS);
    window.setInterval(() => {
      resetWhenAdEnds();
      handleStaticAd();
    }, STATIC_CHECK_MS);
    document.addEventListener("yt-navigate-finish", () => {
      resetWhenAdEnds();
      handleVideoAd();
      handleStaticAd();
    });
  }

  // src/page/index.js
  if (!window.__youtubeCleanPlayerSkip) {
    window.__youtubeCleanPlayerSkip = true;
    startAdController();
  }
})();
