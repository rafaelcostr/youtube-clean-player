(() => {
  // src/content.js
  (function() {
    "use strict";
    var LS_ON = "_c0";
    var LS_SKIP = "_c1";
    var LEGACY_KEYS = ["ycp_enabled", "ycp_alive", "ycp_token"];
    var MESSAGE_SOURCE = "youtube-clean-player";
    var TRUSTED_CLICK = "trusted-click";
    function clearLegacyKeys() {
      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        try {
          localStorage.removeItem(LEGACY_KEYS[i]);
        } catch (e) {
        }
      }
    }
    function syncFlags(enabled, autoSkip) {
      try {
        localStorage.setItem(LS_ON, enabled === false ? "0" : "1");
        localStorage.setItem(LS_SKIP, autoSkip === true ? "1" : "0");
      } catch (e) {
      }
    }
    clearLegacyKeys();
    chrome.storage.local.get({ enabled: true, autoSkip: true }, function(stored) {
      syncFlags(stored.enabled, stored.autoSkip);
    });
    chrome.storage.onChanged.addListener(function(changes, area) {
      if (area !== "local") {
        return;
      }
      if (!changes.enabled && !changes.autoSkip) {
        return;
      }
      chrome.storage.local.get({ enabled: true, autoSkip: true }, function(stored) {
        syncFlags(stored.enabled, stored.autoSkip);
      });
    });
    function recordSkip() {
      updateStatus(function(status) {
        return {
          skippedVideoAds: (status.skippedVideoAds || 0) + 1,
          lastAction: "Anuncio pulado"
        };
      });
    }
    function recordClickError(error) {
      updateStatus(function(status) {
        return {
          skippedVideoAds: status.skippedVideoAds || 0,
          lastAction: "Clique falhou: " + (error || "sem resposta")
        };
      });
    }
    function updateStatus(makeStatus) {
      chrome.storage.local.get(
        {
          status: {
            skippedVideoAds: 0,
            lastAction: "Abra um v\xEDdeo do YouTube para testar."
          }
        },
        function(stored) {
          var status = stored.status || {};
          chrome.storage.local.set({ status: makeStatus(status) });
        }
      );
    }
    function validRect(rect) {
      return rect && typeof rect.x === "number" && typeof rect.y === "number" && typeof rect.width === "number" && typeof rect.height === "number" && rect.width > 0 && rect.height > 0;
    }
    function requestTrustedClick(rect) {
      chrome.runtime.sendMessage(
        {
          action: "trustedClick",
          rect
        },
        function(response) {
          if (chrome.runtime.lastError) {
            recordClickError(chrome.runtime.lastError.message);
            return;
          }
          if (!response || response.ok !== true) {
            recordClickError(response && response.error);
            return;
          }
          recordSkip();
        }
      );
    }
    window.addEventListener("message", function(event) {
      if (event.source !== window || !event.data || event.data.source !== MESSAGE_SOURCE) {
        return;
      }
      if (event.data.type !== TRUSTED_CLICK || !validRect(event.data.rect)) {
        return;
      }
      requestTrustedClick(event.data.rect);
    });
  })();
})();
