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

export const MODAL_BACKDROP_SELECTORS = ["tp-yt-iron-overlay-backdrop"];

/** "Vídeo pausado. Quer continuar assistindo?" */
export const IDLE_PROMPT_PATTERNS = [
  /v[ií]deo pausado/i,
  /quer continuar assistindo/i,
  /continue watching/i,
  /still watching/i
];

export const IDLE_CONFIRM_SELECTORS = [
  "yt-confirm-dialog-renderer #confirm-button button",
  "yt-confirm-dialog-renderer #confirm-button #button",
  "yt-confirm-dialog-renderer #confirm-button"
];

export const STATIC_AD_MARKERS = [
  ".ytp-ad-image-overlay",
  ".ytp-ad-overlay-image",
  ".ytp-ad-text-overlay",
  ".ytp-ad-preview-container"
];

/** Overlays de imagem — anúncio estático (não confundir com anúncio em vídeo). */
export const STATIC_IMAGE_AD_MARKERS = [
  ".ytp-ad-image-overlay",
  ".ytp-ad-overlay-image"
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
