import { DATASET_KEYS } from "../shared/constants.js";

const PAGE_ENTRY = "src/page/index.js";

export function injectPageScript() {
  if (document.documentElement.dataset[DATASET_KEYS.skipLoaded] === "true") {
    return;
  }

  document.documentElement.dataset[DATASET_KEYS.skipLoaded] = "true";

  const script = document.createElement("script");
  script.type = "module";
  script.src = chrome.runtime.getURL(PAGE_ENTRY);
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}
