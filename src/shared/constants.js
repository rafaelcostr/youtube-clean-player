export const MESSAGE_SOURCE = "youtube-clean-player";

export const STORAGE_KEYS = {
  enabled: "enabled",
  status: "cleanPlayerStatus"
};

export const DATASET_KEYS = {
  enabled: "cleanPlayerEnabled",
  skipLoaded: "cleanPlayerSkipLoaded"
};

export const RULESET_ID = "ads";
export const NETWORK_RULES_COUNT = 16;

export const CLICK_COOLDOWN_MS = 350;
export const VIDEO_CHECK_MS = 500;
export const STATIC_CHECK_MS = 400;
export const NAVIGATION_GRACE_MS = 2500;
export const MAX_VIDEO_AD_DURATION = 120;

export const COUNTDOWN_PATTERN = /pular em|skip in|ignorar em|skip ad in/i;

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
