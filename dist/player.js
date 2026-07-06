(function () {
  "use strict";

  var LS_ON = "_c0";
  var LS_SKIP = "_c1";
  var LS_CLICK = "_c2";
  var LS_SPEED = "_c3";
  var watched = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  var adObserver = null;
  var restoreTimer = null;
  var mutedByUs = false;
  var savedVolume = 1;
  var savedMuted = false;
  var savedRates = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  var skipPending = false;
  var lastSkipAt = 0;
  var skipDoneKey = "";
  var skipAttempts = 0;
  var messageSource = "youtube-clean-player";
  var lastEnforcementNoticeAt = 0;
  var countdown = /pular an[uú]ncio em|pular em|skip ad in|skip in|ignorar em|\bem \d|\d+\s*(s|seg)/i;
  var ctaPattern = /acessar|visit site|anunciante|saiba mais|learn more|shop now|comprar/i;

  function readFlag(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      if (value === null) {
        return fallback;
      }
      return value !== "0";
    } catch (e) {
      return fallback;
    }
  }

  function enabled() {
    return readFlag(LS_ON, true);
  }

  function autoSkipOn() {
    return readFlag(LS_SKIP, true);
  }

  function autoClickOn() {
    return readFlag(LS_CLICK, false);
  }

  function adSpeed() {
    try {
      var value = parseFloat(localStorage.getItem(LS_SPEED) || "2");
      if (!isFinite(value)) {
        return 2;
      }
      return Math.min(Math.max(value, 1.25), 4);
    } catch (e) {
      return 2;
    }
  }

  function moviePlayer() {
    return (
      document.getElementById("movie_player") ||
      document.querySelector(".html5-video-player") ||
      document.querySelector("ytd-player #container")
    );
  }

  function playerSurface() {
    var movie = moviePlayer();
    if (!movie) {
      return null;
    }

    if (movie.classList.contains("html5-video-player")) {
      return movie;
    }

    return movie.querySelector(".html5-video-player") || movie;
  }

  function enforcementVisible() {
    if (document.querySelector(
      "ytd-enforcement-message-view-model-renderer, .ytd-enforcement-message-view-model-renderer, ytd-enforcement-message-view-model"
    )) {
      return true;
    }

    var movie = moviePlayer();
    var text = movie ? movie.textContent || "" : "";
    return /bloqueadores de an[uú]ncios violam|parece que voc[eê] est[aá] usando um bloqueador|ad blockers violate|using an ad blocker/i.test(text);
  }

  function hasAdClass(node) {
    if (!node) {
      return false;
    }

    return node.classList.contains("ad-showing") || node.classList.contains("ad-interrupting");
  }

  function visible(node) {
    if (!node || !node.isConnected) {
      return false;
    }

    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function hasVisibleAdMarker(root) {
    if (!root) {
      return false;
    }

    var marker = root.querySelector(
      ".ytp-ad-player-overlay, .ytp-ad-image-overlay, .ytp-ad-overlay-image, .ytp-ad-text-overlay, .ytp-ad-preview-container, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button"
    );

    if (visible(marker)) {
      return true;
    }

    var label = root.querySelector(".ytp-ad-pod-index, .ytp-ad-text, .ytp-ad-preview-text");
    var text = label ? label.textContent || "" : "";
    return /an[uú]ncio|ad\b|patrocinado|sponsored/i.test(text);
  }

  function adActive() {
    if (enforcementVisible()) {
      return false;
    }

    var movie = moviePlayer();
    var surface = playerSurface();

    return (
      hasAdClass(movie) ||
      hasAdClass(surface) ||
      hasVisibleAdMarker(movie) ||
      hasVisibleAdMarker(surface) ||
      hasVisibleAdMarker(document)
    );
  }

  function videos() {
    var movie = moviePlayer();
    if (movie) {
      var list = movie.querySelectorAll("video");
      if (list.length) {
        return Array.prototype.slice.call(list);
      }
    }

    var fallback = document.querySelectorAll("video.html5-main-video, video");
    return fallback.length ? Array.prototype.slice.call(fallback) : [];
  }

  function getAdKey() {
    var movie = moviePlayer();
    var label =
      (movie && movie.querySelector(".ytp-ad-pod-index, .ytp-ad-text, .ytp-ad-preview-text")?.textContent) || "";
    var video = videos()[0];
    return label.trim() + "|" + (video && video.src ? video.src.slice(-36) : "");
  }

  function clearRestoreTimer() {
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
  }

  function scheduleRestoreCheck() {
    clearRestoreTimer();
    if (!mutedByUs) {
      return;
    }

    restoreTimer = setTimeout(function () {
      restoreTimer = null;
      if (!mutedByUs) {
        return;
      }
      if (!adActive()) {
        restoreAfterAd();
        return;
      }
      scheduleRestoreCheck();
    }, 400);
  }

  function muteForAd() {
    var list = videos();
    for (var i = 0; i < list.length; i++) {
      var video = list[i];
      if (!mutedByUs) {
        savedVolume = video.volume;
        savedMuted = video.muted;
        mutedByUs = true;
      }
      video.muted = true;
      if (autoSkipOn()) {
        if (savedRates && !savedRates.has(video)) {
          savedRates.set(video, video.playbackRate || 1);
        }
        var speed = adSpeed();
        if (video.playbackRate < speed) {
          video.playbackRate = speed;
        }
      }
    }

    scheduleRestoreCheck();
  }

  function stopAdObserver() {
    if (!adObserver) {
      return;
    }

    adObserver.disconnect();
    adObserver = null;
  }

  function restoreAfterAd() {
    clearRestoreTimer();
    stopAdObserver();
    skipPending = false;
    skipDoneKey = "";

    if (!mutedByUs) {
      return;
    }

    var list = videos();
    for (var i = 0; i < list.length; i++) {
      var video = list[i];
      video.volume = savedVolume;
      video.muted = savedMuted;
      if (savedRates && savedRates.has(video)) {
        video.playbackRate = savedRates.get(video);
        savedRates.delete(video);
      } else if (video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    }

    mutedByUs = false;
    savedVolume = 1;
    savedMuted = false;
  }

  function notifyEnforcement() {
    var now = Date.now();
    if (now - lastEnforcementNoticeAt < 5000) {
      return;
    }

    lastEnforcementNoticeAt = now;

    try {
      window.postMessage(
        {
          source: messageSource,
          type: "enforcement"
        },
        "*"
      );
    } catch (e) {
      // ignore
    }
  }

  function skipReady(btn) {
    var label = (btn.textContent || "") + " " + (btn.getAttribute("aria-label") || "");
    if (countdown.test(label) || ctaPattern.test(label)) {
      return false;
    }
    if (btn.closest(".ytp-ad-action-interstitial, .ytp-ad-visit-advertiser-button, .ytp-play-button")) {
      return false;
    }
    if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
      return false;
    }
    return btn.offsetWidth > 0 && btn.offsetHeight > 0;
  }

  function skipButton() {
    var movie = moviePlayer();
    if (!movie) {
      return null;
    }

    var nodes = movie.querySelectorAll(
      ".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button, button[aria-label^='Skip ad'], button[aria-label*='Pular'], button[aria-label*='Ignorar']"
    );

    for (var i = 0; i < nodes.length; i++) {
      if (skipReady(nodes[i])) {
        return nodes[i];
      }
    }

    return null;
  }

  function notifySkipAttempt() {
    try {
      window.postMessage(
        {
          source: messageSource,
          type: "skip"
        },
        "*"
      );
    } catch (e) {
      // ignore
    }
  }

  function publishStatus() {
    try {
      window.postMessage(
        {
          source: messageSource,
          type: "status",
          status: {
            ad: adActive(),
            autoClick: autoClickOn(),
            skipButton: !!skipButton(),
            skipAttempts: skipAttempts,
            speed: adSpeed(),
            videos: videos().length
          }
        },
        "*"
      );
    } catch (e) {
      // ignore
    }
  }

  function trySkip(key) {
    if (!autoClickOn() || skipPending || skipDoneKey === key || Date.now() - lastSkipAt < 2000) {
      return;
    }

    var btn = skipButton();
    if (!btn) {
      return;
    }

    skipPending = true;
    setTimeout(function () {
      skipPending = false;
      if (!adActive() || !autoClickOn()) {
        return;
      }

      var freshBtn = skipButton();
      if (!freshBtn) {
        return;
      }

      lastSkipAt = Date.now();
      skipDoneKey = key;
      try {
        skipAttempts += 1;
        freshBtn.click();
        notifySkipAttempt();
      } catch (e) {
        // ignore
      }
    }, 1200 + Math.floor(Math.random() * 1200));
  }

  function startAdObserver() {
    if (adObserver) {
      return;
    }

    var movie = moviePlayer();
    if (!movie) {
      return;
    }

    var target = movie.querySelector(".ytp-ad-module, .ytp-ad-player-overlay") || movie;
    adObserver = new MutationObserver(function () {
      if (!adActive()) {
        restoreAfterAd();
        return;
      }

      trySkip(getAdKey());
    });

    adObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"]
    });
  }

  function onAdChange() {
    try {
      if (!enabled()) {
        restoreAfterAd();
        return;
      }

      if (enforcementVisible()) {
        notifyEnforcement();
        restoreAfterAd();
        return;
      }

      if (!adActive()) {
        restoreAfterAd();
        return;
      }

      muteForAd();
      startAdObserver();
      trySkip(getAdKey());
    } catch (e) {
      // ignore
    }
  }

  function watchPlayer(movie) {
    if (!movie) {
      return;
    }

    if (watched && watched.has(movie)) {
      onAdChange();
      return;
    }

    if (watched) {
      watched.add(movie);
    }

    new MutationObserver(onAdChange).observe(movie, {
      attributes: true,
      attributeFilter: ["class"]
    });

    var surface = playerSurface();
    if (surface && surface !== movie) {
      new MutationObserver(onAdChange).observe(surface, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    onAdChange();
  }

  function attach() {
    watchPlayer(moviePlayer());
  }

  document.addEventListener("yt-navigate-finish", attach, true);
  setInterval(function () {
    onAdChange();
    publishStatus();
  }, 1000);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach, { once: true });
  }

  var bootAttempts = 0;
  function boot() {
    attach();
    if (moviePlayer() || bootAttempts > 40) {
      return;
    }

    bootAttempts += 1;
    setTimeout(boot, 250);
  }

  window.__YCP_STATUS__ = function () {
    return {
      running: true,
      enabled: enabled(),
      accelerate: autoSkipOn(),
      autoClick: autoClickOn(),
      speed: adSpeed(),
      ad: adActive(),
      player: !!moviePlayer(),
      videos: videos().length,
      skipButton: !!skipButton(),
      skipAttempts: skipAttempts,
      mutedByUs: mutedByUs
    };
  };

  boot();
})();
