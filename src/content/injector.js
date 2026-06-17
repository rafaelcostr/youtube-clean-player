import { DATASET_KEYS } from "../shared/constants.js";

const PAGE_ENTRY = "dist/page.js";

export function injectPageScript() {
  const version = chrome.runtime.getManifest().version;
  const loadedVersion = document.documentElement.dataset[DATASET_KEYS.version];

  if (loadedVersion === version && document.documentElement.dataset[DATASET_KEYS.skipLoaded] === "true") {
    return;
  }

  document.documentElement.dataset[DATASET_KEYS.version] = version;
  document.documentElement.dataset[DATASET_KEYS.skipLoaded] = "true";

  const script = document.createElement("script");
  script.src = `${chrome.runtime.getURL(PAGE_ENTRY)}?v=${encodeURIComponent(version)}`;
  script.onload = () => script.remove();
  script.onerror = () => {
    document.documentElement.dataset[DATASET_KEYS.skipLoaded] = "false";
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}
