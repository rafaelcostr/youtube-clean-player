export const AD_UI_SELECTORS = [
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

/** Modal "Bloqueadores de anúncios são proibidos no YouTube". */
export const ENFORCEMENT_SELECTORS = [
  "ytd-enforcement-message-view-model",
  "tp-yt-paper-dialog:has(.ytd-enforcement-message-view-model)",
  ".ytd-popup-container:has(.ytd-enforcement-message-view-model)"
];

export const MODAL_BACKDROP_SELECTORS = ["tp-yt-iron-overlay-backdrop"];

export const STATIC_AD_MARKERS = [
  ".ytp-ad-image-overlay",
  ".ytp-ad-overlay-image",
  ".ytp-ad-text-overlay",
  ".ytp-ad-preview-container"
];

export const SKIP_BUTTON_SELECTORS = [
  ".ytp-skip-ad-button",
  ".ytp-ad-skip-button-modern",
  ".ytp-ad-skip-button",
  'button[aria-label^="Skip ad"]',
  'button[aria-label*="Pular"]',
  'button[aria-label*="Ignorar"]'
];

export const PLAYER_SELECTORS = {
  active:
    "#movie_player.html5-video-player, .html5-video-player.ad-showing, .html5-video-player.ad-interrupting",
  adPlaying: ".html5-video-player.ad-showing, .html5-video-player.ad-interrupting",
  root: "#movie_player, .html5-video-player",
  video: "video.html5-main-video, video",
  adLabel: ".ytp-ad-pod-index, .ytp-ad-text, .ytp-ad-preview-text"
};
