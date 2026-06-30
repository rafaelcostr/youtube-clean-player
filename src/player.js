(function () {
  "use strict";

  var LS_ON = "_c0";
  var LS_SKIP = "_c1";
  var watched = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  var adObserver = null;
  var restoreTimer = null;
  var skipDoneKey = "";
  var skipPending = false;
  var mutedByUs = false;
  var savedVolume = 1;
  var savedMuted = false;
  var lastSkipAt = 0;
  var savedRates = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  var messageSource = "youtube-clean-player";
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

  function moviePlayer() {
    return document.getElementById("movie_player");
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
    return !!document.querySelector(
      "ytd-enforcement-message-view-model-renderer, .ytd-enforcement-message-view-model-renderer, ytd-enforcement-message-view-model"
    );
  }

  function hasAdClass(node) {
    if (!node) {
      return false;
    }

    return node.classList.contains("ad-showing") || node.classList.contains("ad-interrupting");
  }

  function adActive() {
    if (enforcementVisible()) {
      return false;
    }

    var movie = moviePlayer();
    var surface = playerSurface();

    return hasAdClass(movie) || hasAdClass(surface);
  }

  function videos() {
    var movie = moviePlayer();
    if (!movie) {
      return [];
    }

    var list = movie.querySelectorAll("video");
    return list.length ? Array.prototype.slice.call(list) : [];
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

      if (savedRates && !savedRates.has(video)) {
        savedRates.set(video, video.playbackRate || 1);
      }
      if (video.playbackRate < 16) {
        video.playbackRate = 16;
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
    skipDoneKey = "";
    skipPending = false;

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

  function skipReady(btn) {
    var label = (btn.textContent || "") + " " + (btn.getAttribute("aria-label") || "");
    if (countdown.test(label)) {
      return false;
    }
    if (ctaPattern.test(label)) {
      return false;
    }
    if (btn.closest(".ytp-ad-action-interstitial, .ytp-ad-visit-advertiser-button, .ytp-play-button")) {
      return false;
    }
    if (btn.offsetWidth < 1 || btn.offsetHeight < 1) {
      return false;
    }
    if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
      return false;
    }
    return true;
  }

  function skipButton() {
    var movie = moviePlayer();
    if (!movie) {
      return null;
    }

    var nodes = movie.querySelectorAll(
      ".ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button"
    );

    for (var i = 0; i < nodes.length; i++) {
      if (skipReady(nodes[i])) {
        return nodes[i];
      }
    }

    return null;
  }

  function trySkip(key) {
    if (!autoSkipOn() || skipDoneKey === key || skipPending) {
      return;
    }

    if (Date.now() - lastSkipAt < 1500) {
      return;
    }

    if (!skipButton()) {
      return;
    }

    skipPending = true;
    var delay = 700 + Math.floor(Math.random() * 600);

    setTimeout(function () {
      skipPending = false;

      if (!adActive() || skipDoneKey === key || !autoSkipOn()) {
        return;
      }

      var btn = skipButton();
      if (!btn) {
        return;
      }

      lastSkipAt = Date.now();
      requestTrustedClick(btn);
    }, delay);
  }

  function requestTrustedClick(btn) {
    var rect = btn.getBoundingClientRect();

    try {
      window.postMessage(
        {
          source: messageSource,
          type: "trusted-click",
          at: lastSkipAt,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        },
        "*"
      );
    } catch (e) {
      // ignore
    }
  }

  function startAdObserver() {
    if (adObserver || !autoSkipOn()) {
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
      if (!enabled() || enforcementVisible()) {
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

  boot();
})();
