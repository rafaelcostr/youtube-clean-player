(() => {
  // src/content.js
  (function() {
    "use strict";
    var LS_ON = "_c0";
    var LS_SKIP = "_c1";
    var LS_CLICK = "_c2";
    var LS_SPEED = "_c3";
    var LEGACY_KEYS = ["ycp_enabled", "ycp_alive", "ycp_token"];
    var MESSAGE_SOURCE = "youtube-clean-player";
    var ENFORCEMENT = "enforcement";
    function clearLegacyKeys() {
      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        try {
          localStorage.removeItem(LEGACY_KEYS[i]);
        } catch (e) {
        }
      }
    }
    function syncFlags(enabled, autoSkip, autoClick, speed) {
      try {
        localStorage.setItem(LS_ON, enabled === false ? "0" : "1");
        localStorage.setItem(LS_SKIP, autoSkip === true ? "1" : "0");
        localStorage.setItem(LS_CLICK, autoClick === true ? "1" : "0");
        localStorage.setItem(LS_SPEED, String(speed || 2));
      } catch (e) {
      }
    }
    clearLegacyKeys();
    chrome.storage.local.get({ enabled: true, autoSkip: true, autoClick: false, speed: 2 }, function(stored) {
      syncFlags(stored.enabled, stored.autoSkip !== false, stored.autoClick === true, stored.speed);
    });
    chrome.storage.onChanged.addListener(function(changes, area) {
      if (area !== "local") {
        return;
      }
      if (!changes.enabled && !changes.autoSkip && !changes.autoClick && !changes.speed) {
        return;
      }
      chrome.storage.local.get({ enabled: true, autoSkip: true, autoClick: false, speed: 2 }, function(stored) {
        syncFlags(stored.enabled, stored.autoSkip, stored.autoClick, stored.speed);
      });
    });
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
    function handleEnforcement() {
      syncFlags(true, false, false, 2);
      chrome.storage.local.set({ autoSkip: false, autoClick: false });
      updateStatus(function(status) {
        return {
          skippedVideoAds: status.skippedVideoAds || 0,
          lastAction: "Bloqueio detectado: automatico pausado"
        };
      });
    }
    function recordSkip() {
      updateStatus(function(status) {
        return {
          skippedVideoAds: (status.skippedVideoAds || 0) + 1,
          lastAction: "Tentativa de pular anuncio"
        };
      });
    }
    function recordPlayerStatus(playerStatus) {
      updateStatus(function(status) {
        var parts = [
          playerStatus.ad ? "anuncio detectado" : "sem anuncio",
          playerStatus.autoClick ? "auto-pular ligado" : "auto-pular desligado",
          playerStatus.skipButton ? "botao Pular encontrado" : "botao Pular nao encontrado",
          "tentativas: " + (playerStatus.skipAttempts || 0),
          "videos: " + (playerStatus.videos || 0)
        ];
        return {
          skippedVideoAds: status.skippedVideoAds || 0,
          lastAction: parts.join(" | ")
        };
      });
    }
    window.addEventListener("message", function(event) {
      if (event.source !== window || !event.data || event.data.source !== MESSAGE_SOURCE) {
        return;
      }
      if (event.data.type === ENFORCEMENT) {
        handleEnforcement();
        return;
      }
      if (event.data.type === "skip") {
        recordSkip();
        return;
      }
      if (event.data.type === "status" && event.data.status) {
        recordPlayerStatus(event.data.status);
      }
    });
  })();
})();
