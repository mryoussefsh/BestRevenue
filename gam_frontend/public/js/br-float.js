window.__br_init_float = window.__br_init_float || function(config) {
  var id = config.id;
  var type = config.type;
  var delayMs = config.delayMs;
  var closeDelayMs = config.closeDelayMs;
  var siteName = config.siteName;
  var platformUrl = config.platformUrl;
  var slot = config.slot;

  var containerId = '';
  var closeBtnId = '';
  var labelStyleType = '';
  var dismissFunc = null;
  var cardId = '';

  var safeIdSuffix = id.replace(/-/g, '_');

  if (type === 'float_top') {
    containerId = 'float-top-container-' + id;
    closeBtnId = 'float-top-close-' + id;
    labelStyleType = 'float-footer';
    dismissFunc = function() {
      var container = document.getElementById(containerId);
      if (container) {
        container.style.opacity = '0';
        container.style.top = '-200px';
        setTimeout(function() {
          container.remove();
        }, 300);
      }
    };
    window['dismissFloatTop_' + safeIdSuffix] = dismissFunc;
  } else if (type === 'float_bottom') {
    containerId = 'float-bottom-container-' + id;
    closeBtnId = 'float-bottom-close-' + id;
    labelStyleType = 'float-footer';
    dismissFunc = function() {
      var container = document.getElementById(containerId);
      if (container) {
        container.style.opacity = '0';
        container.style.bottom = '-350px';
        setTimeout(function() {
          container.remove();
        }, 300);
      }
    };
    window['dismissFloatBottom_' + safeIdSuffix] = dismissFunc;
  } else if (type === 'float_fullscreen') {
    containerId = 'float-fullscreen-overlay-' + id;
    cardId = 'float-fullscreen-card-' + id;
    closeBtnId = 'float-fullscreen-close-' + id;
    labelStyleType = 'float-fullscreen-footer';
    dismissFunc = function() {
      var container = document.getElementById(containerId);
      var card = document.getElementById(cardId);
      if (container) {
        container.style.opacity = '0';
        if (card) card.style.transform = 'scale(0.9)';
        setTimeout(function() {
          container.remove();
        }, 300);
      }
    };
    window['dismissFloatFullscreen_' + safeIdSuffix] = dismissFunc;
  }

  var container = document.getElementById(containerId);
  if (!container) return;

  var closeBtn = document.getElementById(closeBtnId);
  if (closeBtn) {
    closeBtn.onclick = dismissFunc;
  }

  setTimeout(function() {
    if (container) {
      document.body.appendChild(container);
      container.style.display = 'flex';
      // Force a reflow
      container.offsetHeight;
      if (type === 'float_top') {
        container.style.top = '0px';
      } else if (type === 'float_bottom') {
        container.style.bottom = '0px';
      } else if (type === 'float_fullscreen') {
        container.style.opacity = '1';
        var card = document.getElementById(cardId);
        if (card) card.style.transform = 'scale(1)';
      }

      // Show close button after delay
      if (closeBtn) {
        setTimeout(function() {
          closeBtn.style.display = 'flex';
        }, closeDelayMs);
      }

      // Script removal safeguard & retry logic
      var retries = 10;
      var checkLabelLoaded = setInterval(function() {
        if (typeof __br_inject_label === 'function') {
          var labelContainerId = (type === 'float_fullscreen') ? cardId : containerId;
          __br_inject_label(labelContainerId, siteName, platformUrl, labelStyleType, id, slot);
          clearInterval(checkLabelLoaded);
        } else {
          retries--;
          if (retries <= 0) {
            clearInterval(checkLabelLoaded);
            if (container) container.remove();
            if (slot) {
              window.googletag.cmd.push(function() { window.googletag.destroySlots([slot]); });
            }
          }
        }
      }, 100);
    }
  }, delayMs);
};
