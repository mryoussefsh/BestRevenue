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

    var container = document.getElementById(containerId);
    if (container) {
      container.style.cssText = 'position: fixed; top: -150px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.15); padding: 10px; display: none; flex-direction: column; align-items: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; transition: all 0.3s ease-in-out; border: 1px solid rgba(226, 232, 240, 0.8);';
    }

    var closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; background: rgba(15, 23, 42, 0.6); color: #ffffff; border: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 10px; display: none; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s;';
      closeBtn.onmouseover = function() { this.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; };
      closeBtn.onmouseout = function() { this.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'; };
    }

    var adDiv = document.getElementById('div-gpt-ad-' + id);
    if (adDiv) {
      adDiv.style.cssText = 'min-width: 300px; min-height: 50px;';
    }

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

    var container = document.getElementById(containerId);
    if (container) {
      container.style.cssText = 'position: fixed; bottom: -300px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #ffffff; box-shadow: 0 -10px 25px -5px rgba(0,0,0,0.15), 0 -8px 10px -6px rgba(0,0,0,0.15); padding: 10px; display: none; flex-direction: column; align-items: center; border-top-left-radius: 12px; border-top-right-radius: 12px; transition: all 0.3s ease-in-out; border: 1px solid rgba(226, 232, 240, 0.8);';
    }

    var closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; background: rgba(15, 23, 42, 0.6); color: #ffffff; border: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 10px; display: none; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s;';
      closeBtn.onmouseover = function() { this.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; };
      closeBtn.onmouseout = function() { this.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'; };
    }

    var adDiv = document.getElementById('div-gpt-ad-' + id);
    if (adDiv) {
      adDiv.style.cssText = 'min-width: 300px; min-height: 50px;';
    }

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

    var container = document.getElementById(containerId);
    if (container) {
      container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background: rgba(15, 23, 42, 0.85); display: none; justify-content: center; align-items: center; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.3s ease-in-out;';
    }

    var card = document.getElementById(cardId);
    if (card) {
      card.style.cssText = 'position: relative; background: #ffffff; padding: 12px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transform: scale(0.9); transition: transform 0.3s ease-in-out;';
    }

    var closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.style.cssText = 'position: absolute; top: -10px; right: -10px; background: rgba(15, 23, 42, 0.6); color: #ffffff; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 11px; display: none; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s;';
      closeBtn.onmouseover = function() { this.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; };
      closeBtn.onmouseout = function() { this.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'; };
    }

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
