import { DATASET_KEYS } from "../shared/constants.js";

export function getBridgeToken() {
  return document.documentElement.dataset[DATASET_KEYS.token] || "";
}
