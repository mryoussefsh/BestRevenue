window.__br_inject_label = window.__br_inject_label || function(containerId, siteName, siteUrl, styleType, uniqueId, slotToDestroy) {
  var container = containerId ? document.getElementById(containerId) : null;
  var labelId = 'br-label-' + (containerId || uniqueId);
  if (document.getElementById(labelId)) return;

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
  } else if (styleType === 'fixed-bottom' || styleType === 'fixed-top') {
    label.style.position = 'fixed';
    label.style.right = '10px';
    label.style.zIndex = '2147483647';
    label.style.background = 'rgba(255, 255, 255, 0.9)';
    label.style.padding = '3px 8px';
    label.style.borderRadius = '4px';
    label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    label.style.border = '1px solid #cbd5e1';
    label.style.width = 'auto';
    if (styleType === 'fixed-bottom') {
      label.style.bottom = '55px';
    } else {
      label.style.top = '55px';
    }
    document.body.appendChild(label);
  }

  var checkInterval = setInterval(function() {
    var lbl = document.getElementById(labelId);
    if (containerId) {
      var cont = document.getElementById(containerId);
      if (!lbl || !cont) {
        if (cont) cont.style.display = 'none';
        if (slotToDestroy) window.googletag.cmd.push(function() { window.googletag.destroySlots([slotToDestroy]); });
        clearInterval(checkInterval);
        return;
      }
      var style = window.getComputedStyle(lbl);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
        cont.style.display = 'none';
        if (slotToDestroy) window.googletag.cmd.push(function() { window.googletag.destroySlots([slotToDestroy]); });
        clearInterval(checkInterval);
      }
    } else {
      if (!lbl) {
        if (slotToDestroy) window.googletag.cmd.push(function() { window.googletag.destroySlots([slotToDestroy]); });
        clearInterval(checkInterval);
        return;
      }
      var style = window.getComputedStyle(lbl);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
        if (slotToDestroy) window.googletag.cmd.push(function() { window.googletag.destroySlots([slotToDestroy]); });
        lbl.remove();
        clearInterval(checkInterval);
      }
    }
  }, 1000);
};
