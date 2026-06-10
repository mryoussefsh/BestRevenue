(function() {
  if (window.__br_platform_settings) return;
  var scriptSrc = '';
  if (document.currentScript) {
    scriptSrc = document.currentScript.src;
  } else {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('br-label.js') !== -1) {
        scriptSrc = scripts[i].src;
        break;
      }
    }
  }
  if (scriptSrc) {
    try {
      var platformUrl = new URL(scriptSrc).origin;
      if (platformUrl) {
        fetch(platformUrl + '/api/v1/public/settings')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            window.__br_platform_settings = data;
            // Update any existing labels already injected with the fallback site name
            if (data && data.site_name) {
              var labels = document.querySelectorAll('[id^="br-label-"]');
              for (var i = 0; i < labels.length; i++) {
                var link = labels[i].querySelector('a');
                if (link) {
                  link.textContent = 'Ads by ' + data.site_name;
                }
              }
            }
          })
          .catch(function() {});
      }
    } catch(e) {}
  }
})();

window.__br_inject_label = window.__br_inject_label || function(containerId, arg2, arg3, arg4, arg5, arg6) {
  var siteName = '';
  var siteUrl = '';
  var styleType = '';
  var uniqueId = '';
  var slotToDestroy = null;

  // Support both old and new signatures for backward compatibility
  if (typeof arg2 === 'string' && (arg2 === 'before' || arg2 === 'after' || arg2 === 'float-footer' || arg2 === 'float-fullscreen-footer')) {
    styleType = arg2;
    uniqueId = arg3;
    slotToDestroy = arg4;
  } else {
    siteName = arg2;
    siteUrl = arg3;
    styleType = arg4;
    uniqueId = arg5;
    slotToDestroy = arg6;
  }

  var container = containerId ? document.getElementById(containerId) : null;
  var labelId = 'br-label-' + (containerId || uniqueId);
  if (document.getElementById(labelId)) return;

  var scriptSrc = '';
  if (document.currentScript) {
    scriptSrc = document.currentScript.src;
  } else {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && (scripts[i].src.indexOf('br-label.js') !== -1 || scripts[i].src.indexOf('br-float.js') !== -1)) {
        scriptSrc = scripts[i].src;
        break;
      }
    }
  }

  var platformUrl = '';
  if (scriptSrc) {
    try {
      platformUrl = new URL(scriptSrc).origin;
    } catch(e) {}
  }
  if (!platformUrl) {
    platformUrl = window.location.origin;
  }

  var resolvedSiteUrl = platformUrl;
  var resolvedSiteName = 'BestRevenue';
  if (platformUrl) {
    try {
      var hostname = new URL(platformUrl).hostname;
      var domainWord = hostname.replace('www.', '').split('.')[0];
      if (domainWord && domainWord !== 'localhost' && domainWord !== '127') {
        resolvedSiteName = domainWord.charAt(0).toUpperCase() + domainWord.slice(1);
      }
    } catch(e) {}
  }

  if (window.__br_platform_settings && window.__br_platform_settings.site_name) {
    resolvedSiteName = window.__br_platform_settings.site_name;
  }

  siteName = resolvedSiteName;
  siteUrl = resolvedSiteUrl;

  var label = document.createElement('div');
  label.id = labelId;
  
  var link = document.createElement('a');
  link.href = siteUrl;
  link.target = '_blank';
  link.textContent = 'Ads by ' + siteName;
  
  label.style.cssText = 'display: flex !important; justify-content: center !important; align-items: center !important; padding: 4px 6px !important; margin: 0 !important; background: #f1f5f9 !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 10px !important; line-height: 14px !important; text-align: center !important; clear: both !important; box-sizing: border-box !important; width: 100% !important; max-width: 100% !important;';
  link.style.cssText = 'color: #334155 !important; text-decoration: none !important; font-weight: 600 !important; transition: color 0.2s !important; display: inline-block !important;';
  
  link.onmouseover = function() { this.style.color = '#3b82f6'; };
  link.onmouseout = function() { this.style.color = '#334155'; };
  
  label.appendChild(link);

  if (styleType === 'before' && container) {
    label.style.setProperty('border', '1px solid #cbd5e1', 'important');
    label.style.setProperty('border-bottom', 'none', 'important');
    label.style.setProperty('border-top-left-radius', '6px', 'important');
    label.style.setProperty('border-top-right-radius', '6px', 'important');
    container.insertBefore(label, container.firstChild);
  } else if (styleType === 'after' && container) {
    label.style.setProperty('border-top', '1px solid #cbd5e1', 'important');
    container.appendChild(label);
  } else if (styleType === 'float-footer' && container) {
    label.style.setProperty('margin', '4px -10px -10px -10px', 'important');
    label.style.setProperty('width', 'calc(100% + 20px)', 'important');
    label.style.setProperty('border-top', '1px solid #cbd5e1', 'important');
    label.style.setProperty('border-bottom-left-radius', '12px', 'important');
    label.style.setProperty('border-bottom-right-radius', '12px', 'important');
    container.appendChild(label);
  } else if (styleType === 'float-fullscreen-footer' && container) {
    label.style.setProperty('margin', '6px -12px -12px -12px', 'important');
    label.style.setProperty('width', 'calc(100% + 24px)', 'important');
    label.style.setProperty('border-top', '1px solid #cbd5e1', 'important');
    label.style.setProperty('border-bottom-left-radius', '12px', 'important');
    label.style.setProperty('border-bottom-right-radius', '12px', 'important');
    container.appendChild(label);
  }

  var checkInterval = setInterval(function() {
    var lbl = document.getElementById(labelId);
    if (containerId) {
      var cont = document.getElementById(containerId);
      if (!lbl || !cont) {
        if (cont) {
          if (typeof cont.remove === 'function') cont.remove();
          else cont.style.display = 'none';
        }
        if (slotToDestroy) window.googletag.cmd.push(function() { window.googletag.destroySlots([slotToDestroy]); });
        clearInterval(checkInterval);
        return;
      }
      var style = window.getComputedStyle(lbl);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
        if (typeof cont.remove === 'function') cont.remove();
        else cont.style.display = 'none';
        if (slotToDestroy) window.googletag.cmd.push(function() { window.googletag.destroySlots([slotToDestroy]); });
        clearInterval(checkInterval);
      }
    }
  }, 1000);
};
