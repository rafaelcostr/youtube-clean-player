export const MESSAGE_SOURCE = "youtube-clean-player";

export const STORAGE_KEYS = {
  enabled: "enabled",
  status: "cleanPlayerStatus"
};

export const DATASET_KEYS = {
  enabled: "cleanPlayerEnabled",
  skipLoaded: "cleanPlayerSkipLoaded",
  token: "cleanPlayerToken",
  version: "cleanPlayerVersion"
};

export const RULESET_ID = "ads";
export const NETWORK_RULES_COUNT = 15;

export const CLICK_COOLDOWN_MS = 280;
export const PLAYER_TICK_MS = 200;
export const NAVIGATION_GRACE_MS = 1200;
export const MAX_VIDEO_AD_DURATION = 120;

export const COUNTDOWN_PATTERN = /pular em|skip in|ignorar em|skip ad in/i;
export const SKIP_LABEL_PATTERN = /pular|skip|ignorar/i;
export const PAUSE_LABEL_PATTERN = /\b(pausar|pause)\b/i;

export const MESSAGE_TYPES = {
  skip: "skip",
  trustedClick: "trusted-click"
};

export const SKIP_METHODS = {
  click: "click",
  seek: "seek"
};

export const RUNTIME_ACTIONS = {
  trustedClick: "trustedClick"
};

export const STATUS_FIELDS = ["skippedVideoAds", "hiddenPromotions"];
