import { initNetworkRules, syncNetworkRulesFromStorage } from "./network-rules.js";
import { initTrustedClick } from "./trusted-click.js";

initNetworkRules();
initTrustedClick();
syncNetworkRulesFromStorage();
