import {
  AD_CTA_LABEL_PATTERN,
  CLICK_COOLDOWN_MS,
  COUNTDOWN_PATTERN,
  MESSAGE_SOURCE,
  MESSAGE_TYPES,
  PLAYER_TICK_MS
} from "../shared/constants.js";

const SKIP_SELECTORS = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-ad-skip-button"
];

let lastClickAt = 0;
let lastNotifyAt = 0;
let running = false;

function isEnabled() {
  try {
    return localStorage.getItem("ycp_enabled") !== "0";
  } catch {
    return true;
  }
}

function getToken() {
  try {
    return localStorage.getItem("ycp_token") || "";
  } catch {
    return "";
  }
}

function getPlayer() {
  return (
    document.querySelector("#movie_player") ||
    document.querySelector("ytd-player #container") ||
    document.querySelector(".html5-video-player")
  );
}

function isAdPlaying() {
  const player = getPlayer();
  if (!player) {
    return false;
  }

  if (player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting")) {
    return true;
  }

  if (document.querySelector(".html5-video-player.ad-showing, .html5-video-player.ad-interrupting")) {
    return true;
  }

  if (player.querySelector(".ytp-ad-module, .ytp-ad-player-overlay, .ytp-ad-text, .ytp-ad-preview-text")) {
    return true;
  }

  const adLabel = player.querySelector(".ytp-ad-text, .ytp-ad-preview-text");
  if (adLabel?.textContent?.match(/an[uú]ncio|\bad\b/i)) {
    return true;
  }

  return false;
}

function getVideos() {
  const player = getPlayer();
  if (player) {
    const list = [...player.querySelectorAll("video")];
    if (list.length > 0) {
      return list;
    }
  }

  const video = document.querySelector("video.html5-main-video, video");
  return video ? [video] : [];
}

function isVisible(element) {
  if (!element?.isConnected) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function labelOf(element) {
  return `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.trim();
}

function isSkipCountdown(element) {
  return COUNTDOWN_PATTERN.test(labelOf(element));
}

function isCta(element) {
  return (
    !!element?.closest(".ytp-ad-action-interstitial, .ytp-ad-visit-advertiser-button, .ytp-play-button") ||
    AD_CTA_LABEL_PATTERN.test(labelOf(element))
  );
}

function findSkipButton() {
  const player = getPlayer();
  if (!player) {
    return null;
  }

  for (const selector of SKIP_SELECTORS) {
    for (const element of player.querySelectorAll(selector)) {
      if (!isVisible(element) || isCta(element) || isSkipCountdown(element)) {
        continue;
      }

      return element;
    }
  }

  return null;
}

function accelerateVideos() {
  let changed = false;

  for (const video of getVideos()) {
    video.muted = true;

    if (Number.isFinite(video.duration) && video.duration > 0) {
      const target = Math.max(video.duration - 0.05, 0);

      if (video.currentTime < target - 0.15) {
        try {
          video.currentTime = target;
          changed = true;
        } catch {
          video.playbackRate = 16;
          changed = true;
        }
      }

      continue;
    }

    if (video.playbackRate < 16) {
      video.playbackRate = 16;
      changed = true;
    }
  }

  return changed;
}

function resetVideos() {
  for (const video of getVideos()) {
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
    }
  }
}

function pressSkip(button) {
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 };

  for (const type of ["pointerdown", "mousedown", "mouseup", "pointerup", "click"]) {
    button.dispatchEvent(new MouseEvent(type, opts));
  }

  button.click();

  const token = getToken();
  if (token) {
    window.postMessage(
      {
        source: MESSAGE_SOURCE,
        type: MESSAGE_TYPES.trustedClick,
        token,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      },
      "*"
    );
  }
}

function clickSkip() {
  const button = findSkipButton();
  if (!button) {
    return false;
  }

  const now = Date.now();
  if (now - lastClickAt < CLICK_COOLDOWN_MS) {
    return false;
  }

  lastClickAt = now;
  pressSkip(button);
  return true;
}

function notifySkip() {
  const token = getToken();
  if (!token) {
    return;
  }

  const now = Date.now();
  if (now - lastNotifyAt < 500) {
    return;
  }

  lastNotifyAt = now;

  window.postMessage(
    {
      source: MESSAGE_SOURCE,
      type: MESSAGE_TYPES.skip,
      token
    },
    "*"
  );
}

function tick() {
  try {
    localStorage.setItem("ycp_alive", String(Date.now()));
  } catch {
    // Ignora falha de storage.
  }

  if (!isEnabled()) {
    return;
  }

  if (!isAdPlaying()) {
    resetVideos();
    return;
  }

  let acted = false;

  if (accelerateVideos()) {
    acted = true;
  }

  if (clickSkip()) {
    acted = true;
  }

  if (acted) {
    notifySkip();
  }
}

function start() {
  if (running || window.__YCP_RUNNING__) {
    return;
  }

  window.__YCP_RUNNING__ = true;
  running = true;
  setInterval(tick, PLAYER_TICK_MS);

  const observer = new MutationObserver(tick);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });

  document.addEventListener("yt-navigate-finish", tick, true);
  tick();

  console.info("[Clean Player] ativo — teste no Console: __YCP_STATUS__()");

  window.__YCP_STATUS__ = () => ({
    running: true,
    enabled: isEnabled(),
    alive: localStorage.getItem("ycp_alive"),
    ad: isAdPlaying(),
    player: !!getPlayer(),
    videos: getVideos().length
  });
}

start();
