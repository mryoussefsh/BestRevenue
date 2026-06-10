import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { useSettings } from '../../contexts/SettingsContext'

function groupAdUnits(units) {
  const grouped = [];
  const rewardGroups = {};

  units.forEach(unit => {
    if (unit.ad_type === 'reward') {
      const name = unit.gam_ad_unit_name;
      let baseName = name;
      
      const roundMatch = name.match(/^(.*?_r\d+)_/);
      if (roundMatch) {
        baseName = roundMatch[1];
      } else {
        const prefixMatch = name.match(/^(.*?)\d+$/);
        if (prefixMatch) {
          baseName = prefixMatch[1];
        }
      }

      const key = `${unit.ad_subtype || 'normal'}_${baseName}`;
      if (!rewardGroups[key]) {
        rewardGroups[key] = {
          id: unit.id,
          display_name: baseName,
          gam_ad_unit_name: baseName,
          is_active: unit.is_active,
          ad_type: unit.ad_type,
          ad_subtype: unit.ad_subtype,
          repeat_count: unit.repeat_count,
          delay_between_ads: unit.delay_between_ads,
          children: []
        };
      }
      rewardGroups[key].children.push(unit);
      if (unit.is_active) {
        rewardGroups[key].is_active = true;
      }
    } else {
      grouped.push({
        ...unit,
        children: [unit]
      });
    }
  });

  Object.values(rewardGroups).forEach(group => {
    const count = group.children.length;
    group.display_name = `${group.display_name} (${count} Ad${count > 1 ? 's' : ''})`;
    group.children.sort((a, b) => a.gam_ad_unit_name.localeCompare(b.gam_ad_unit_name, undefined, { numeric: true }));
    grouped.push(group);
  });

  grouped.sort((a, b) => a.display_name.localeCompare(b.display_name));
  return grouped;
}

export default function PublisherWebsites() {
  const { settings } = useSettings()
  const siteName = settings?.site_name || 'BestRevenue'
  const platformUrl = window.location.origin
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedAdsTxt, setSelectedAdsTxt] = useState(null)
  const [selectedAdUnitCode, setSelectedAdUnitCode] = useState(null)

  const getAdUnitScripts = (unit, allUnits = []) => {
    if (!unit) return { head: '', body: '' }
    const { networkCode, adUnitName, id, adType, adSubtype, children = [], repeat_count, delay_between_ads, domain } = unit

    const helperScript = `window.__br_inject_label = window.__br_inject_label || function(containerId, siteName, siteUrl, styleType, uniqueId, slotToDestroy) {
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
      var width = container.getBoundingClientRect().width || container.offsetWidth;
      if (width) {
        label.style.setProperty('width', width + 'px', 'important');
      }
      label.style.setProperty('max-width', '100%', 'important');
      label.style.setProperty('margin', '0 auto 4px auto', 'important');
      label.style.setProperty('border', '1px solid #cbd5e1', 'important');
      label.style.setProperty('border-bottom', 'none', 'important');
      label.style.setProperty('border-top-left-radius', '6px', 'important');
      label.style.setProperty('border-top-right-radius', '6px', 'important');
      container.parentNode.insertBefore(label, container);
    } else if (styleType === 'after' && container) {
      label.style.setProperty('border-top', '1px solid #cbd5e1', 'important');
      container.parentNode.insertBefore(label, container.nextSibling);
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
  };`;

    switch (adType) {
      case 'reward':
        const finalRewards = children.length > 0 ? children : [unit];
        const actualAdUnitName = finalRewards[0].gam_ad_unit_name;

        if (adSubtype === 'repeated') {
          const repeatCount = repeat_count !== null && repeat_count !== undefined ? repeat_count : finalRewards.length;
          const delayMs = delay_between_ads !== null && delay_between_ads !== undefined ? delay_between_ads * 1000 : 15000;

          return {
            head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || { cmd: [] };
  var rewardedSlots = [];

  function setupRewardedAd(adUnitPath, slotId) {
    googletag.cmd.push(function () {
      var slot = googletag.defineOutOfPageSlot(adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
      if (slot) {
        slot.addService(googletag.pubads());

        googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
          if (event.slot === slot) {
            setTimeout(function () {
              event.makeRewardedVisible();
              displayModal();
            }, 0);
          }
        });

        googletag.pubads().addEventListener('rewardedSlotGranted', function (event) {
          if (event.slot === slot) {
            displayModal('success', 'Reward granted! Click the button to close.');
          }
        });

        googletag.enableServices();
        googletag.display(slot);
        rewardedSlots.push({ id: slotId, slot: slot });
      }
    });
  }

  function dismissRewardedAd(slot) {
    displayModal();
    if (slot) {
      googletag.destroySlots([slot]);
    }
  }

  function displayModal(type, message) {
    var modal = document.getElementById('reward-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reward-modal';
      modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); z-index: 999999; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-family: sans-serif;';
      
      var box = document.createElement('div');
      box.style.cssText = 'background: #ffffff; padding: 24px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative;';
      
      var icon = document.createElement('div');
      icon.style.cssText = 'font-size: 40px; margin-bottom: 12px;';
      icon.textContent = '🏆';
      
      var msg = document.createElement('div');
      msg.id = 'reward-modal-message';
      msg.style.cssText = 'margin-bottom: 20px; font-size: 16px; font-weight: 500; color: #1e293b; line-height: 1.5;';
      
      var btn = document.createElement('button');
      btn.textContent = 'Dismiss';
      btn.style.cssText = 'background: #3b82f6; color: #ffffff; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;';
      btn.onclick = function() { modal.style.display = 'none'; };
      
      box.appendChild(icon);
      box.appendChild(msg);
      box.appendChild(btn);

      // Dynamically add platform ad label inside the modal box
      var label = document.createElement('div');
      label.id = 'br-label-reward';
      label.style.cssText = 'margin-top: 20px !important; text-align: center !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 9px !important; line-height: 12px !important; border-top: 1px solid #e2e8f0 !important; padding-top: 10px !important;';
      
      var link = document.createElement('a');
      link.href = '${platformUrl}';
      link.target = '_blank';
      link.textContent = 'Ads by ${siteName}';
      link.style.cssText = 'color: #94a3b8 !important; text-decoration: none !important; font-weight: 500 !important; transition: color 0.2s !important; display: inline-block !important;';
      link.onmouseover = function() { this.style.color = '#3b82f6'; };
      link.onmouseout = function() { this.style.color = '#94a3b8'; };
      
      label.appendChild(link);
      box.appendChild(label);

      modal.appendChild(box);
      document.body.appendChild(modal);

      // Start periodic checker to ensure label is not hidden
      var checkInterval = setInterval(function() {
        var lbl = document.getElementById('br-label-reward');
        if (modal.style.display === 'flex') {
          if (!lbl) {
            modal.style.display = 'none';
            if (window.rewardedSlots) {
              window.rewardedSlots.forEach(function(s) {
                if (s.slot) googletag.destroySlots([s.slot]);
              });
            }
            clearInterval(checkInterval);
            return;
          }
          var style = window.getComputedStyle(lbl);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
            modal.style.display = 'none';
            if (window.rewardedSlots) {
              window.rewardedSlots.forEach(function(s) {
                if (s.slot) googletag.destroySlots([s.slot]);
              });
            }
            clearInterval(checkInterval);
          }
        }
      }, 1000);
    }
    
    var modalMessage = document.getElementById('reward-modal-message');
    if (type) {
      modalMessage.textContent = message;
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  }

  // ====== Settings ======
  var adUnitPath = '/${networkCode}/${actualAdUnitName}'; // Path to the ad unit
  var repeatCount = ${repeatCount};              // Number of repetitions
  var delayBetweenAds = ${delayMs};      // Time between ads (ms)
  // =======================

  for (var i = 0; i < repeatCount; i++) {
    (function (index) {
      setTimeout(function () {
        setupRewardedAd(adUnitPath, 'reward_' + index);
      }, index * delayBetweenAds);
    })(i);
  }
</script>`,
            body: ''
          };
        } else {
          const queueItems = finalRewards.map((u, i) => {
            return `    { path: '/${networkCode}/${u.gam_ad_unit_name}', id: 'reward_${i + 1}' }`;
          }).join(',\n');

          const delayMs = delay_between_ads !== null && delay_between_ads !== undefined ? delay_between_ads * 1000 : 20000;

          return {
            head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || { cmd: [] };
  var rewardedSlots = [];

  function setupRewardedAd(adUnitPath, slotId) {
    googletag.cmd.push(function () {
      var slot = googletag.defineOutOfPageSlot(adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
      if (slot) {
        slot.addService(googletag.pubads());

        googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
          if (event.slot === slot) {
            setTimeout(function () {
              event.makeRewardedVisible();
              displayModal();
            }, 0);
          }
        });

        googletag.pubads().addEventListener('rewardedSlotGranted', function (event) {
          if (event.slot === slot) {
            displayModal('success', 'Reward granted! Click the button to close.');
          }
        });

        googletag.enableServices();
        googletag.display(slot);
        rewardedSlots.push({ id: slotId, slot: slot });
      }
    });
  }

  function dismissRewardedAd(slot) {
    displayModal();
    if (slot) {
      googletag.destroySlots([slot]);
    }
  }

  function displayModal(type, message) {
    var modal = document.getElementById('reward-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reward-modal';
      modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); z-index: 999999; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-family: sans-serif;';
      
      var box = document.createElement('div');
      box.style.cssText = 'background: #ffffff; padding: 24px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative;';
      
      var icon = document.createElement('div');
      icon.style.cssText = 'font-size: 40px; margin-bottom: 12px;';
      icon.textContent = '🏆';
      
      var msg = document.createElement('div');
      msg.id = 'reward-modal-message';
      msg.style.cssText = 'margin-bottom: 20px; font-size: 16px; font-weight: 500; color: #1e293b; line-height: 1.5;';
      
      var btn = document.createElement('button');
      btn.textContent = 'Dismiss';
      btn.style.cssText = 'background: #3b82f6; color: #ffffff; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;';
      btn.onclick = function() { modal.style.display = 'none'; };
      
      box.appendChild(icon);
      box.appendChild(msg);
      box.appendChild(btn);

      // Dynamically add platform ad label inside the modal box
      var label = document.createElement('div');
      label.id = 'br-label-reward';
      label.style.cssText = 'margin-top: 20px !important; text-align: center !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 9px !important; line-height: 12px !important; border-top: 1px solid #e2e8f0 !important; padding-top: 10px !important;';
      
      var link = document.createElement('a');
      link.href = '${platformUrl}';
      link.target = '_blank';
      link.textContent = 'Ads by ${siteName}';
      link.style.cssText = 'color: #94a3b8 !important; text-decoration: none !important; font-weight: 500 !important; transition: color 0.2s !important; display: inline-block !important;';
      link.onmouseover = function() { this.style.color = '#3b82f6'; };
      link.onmouseout = function() { this.style.color = '#94a3b8'; };
      
      label.appendChild(link);
      box.appendChild(label);

      modal.appendChild(box);
      document.body.appendChild(modal);

      // Start periodic checker to ensure label is not hidden
      var checkInterval = setInterval(function() {
        var lbl = document.getElementById('br-label-reward');
        if (modal.style.display === 'flex') {
          if (!lbl) {
            modal.style.display = 'none';
            if (window.rewardedSlots) {
              window.rewardedSlots.forEach(function(s) {
                if (s.slot) googletag.destroySlots([s.slot]);
              });
            }
            clearInterval(checkInterval);
            return;
          }
          var style = window.getComputedStyle(lbl);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
            modal.style.display = 'none';
            if (window.rewardedSlots) {
              window.rewardedSlots.forEach(function(s) {
                if (s.slot) googletag.destroySlots([s.slot]);
              });
            }
            clearInterval(checkInterval);
          }
        }
      }, 1000);
    }
    
    var modalMessage = document.getElementById('reward-modal-message');
    if (type) {
      modalMessage.textContent = message;
      modal.style.display = 'flex';
    } else {
      modal.style.display = 'none';
    }
  }

  // ====== Settings ======
  var adQueue = [
${queueItems}
  ];
  var delayBetweenAds = ${delayMs}; // Time between ads (ms)
  // =======================

  adQueue.forEach(function (ad, index) {
    setTimeout(function () {
      setupRewardedAd(ad.path, ad.id);
    }, index * delayBetweenAds);
  });
</script>`,
            body: ''
          };
        }

      case 'interstitial':
        const safeInterstitialId = id.replace(/-/g, '_');
        const siteUrl = domain ? `https://${domain}` : 'https://example.com';
        return {
          head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};

  ${helperScript}

  var interstitialSlot_${safeInterstitialId};
  googletag.cmd.push(function() {
    interstitialSlot_${safeInterstitialId} = googletag.defineOutOfPageSlot('/${networkCode}/${adUnitName}',
        googletag.enums.OutOfPageFormat.INTERSTITIAL);
    if (interstitialSlot_${safeInterstitialId}) {
      interstitialSlot_${safeInterstitialId}.addService(googletag.pubads());
    }
    googletag.pubads().enableSingleRequest();
    googletag.pubads().set('page_url', '${siteUrl}');
    googletag.enableServices();
    googletag.display(interstitialSlot_${safeInterstitialId});
  });

  googletag.cmd.push(function() {
    googletag.pubads().addEventListener('slotRenderEnded', function(event) {
      if (event.slot === interstitialSlot_${safeInterstitialId} && !event.isEmpty) {
        __br_inject_label(null, '${siteName}', '${platformUrl}', 'fixed-bottom', '${id}', interstitialSlot_${safeInterstitialId});
      }
    });
  });
</script>`,
          body: ''
        }

      case 'anchor':
        const safeAnchorId = id.replace(/-/g, '_');
        const formatString = adSubtype === 'bottom'
          ? 'googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR'
          : 'googletag.enums.OutOfPageFormat.TOP_ANCHOR';

        return {
          head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};

  ${helperScript}

  // GPT ad slots
  var anchorSlot_${safeAnchorId};

  googletag.cmd.push(function() {
    anchorSlot_${safeAnchorId} = googletag.defineOutOfPageSlot('/${networkCode}/${adUnitName}', ${formatString});
    if (anchorSlot_${safeAnchorId}) {
      anchorSlot_${safeAnchorId}.addService(googletag.pubads());
    }

    // Enable SRA and services.
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
    googletag.display(anchorSlot_${safeAnchorId});
  });

  googletag.cmd.push(function() {
    googletag.pubads().addEventListener('slotRenderEnded', function(event) {
      if (event.slot === anchorSlot_${safeAnchorId} && !event.isEmpty) {
        __br_inject_label(null, '${siteName}', '${platformUrl}', '${adSubtype === 'bottom' ? 'fixed-bottom' : 'fixed-top'}', '${id}', anchorSlot_${safeAnchorId});
      }
    });
  });
</script>`,
          body: ''
        }

      case 'float_top':
        const safeFloatTopId = id.replace(/-/g, '_');
        const delayMsTop = delay_between_ads !== null && delay_between_ads !== undefined ? delay_between_ads * 1000 : 0;
        return {
          head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot('/${networkCode}/${adUnitName}', [[320, 50], [300, 250]], 'div-gpt-ad-${id}').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
</script>`,
          body: `<!-- Sticky Floating Top Wrapper with Close Button -->
<div id="float-top-container-${id}" style="position: fixed; top: -150px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #ffffff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.15); padding: 10px; display: none; flex-direction: column; align-items: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; transition: all 0.3s ease-in-out; border: 1px solid rgba(226, 232, 240, 0.8);">
  <button id="float-top-close-${id}" onclick="dismissFloatTop_${safeFloatTopId}()" style="position: absolute; top: -8px; right: -8px; background: rgba(15, 23, 42, 0.6); color: #ffffff; border: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 10px; display: none; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(15, 23, 42, 0.8)'" onmouseout="this.style.backgroundColor='rgba(15, 23, 42, 0.6)'">✕</button>
  <div id="div-gpt-ad-${id}" style="min-width: 300px; min-height: 50px;">
    <script>
      googletag.cmd.push(function() { googletag.display('div-gpt-ad-${id}'); });
    </script>
  </div>
  <!-- Platform Ad Label -->
  <div id="br-label-${id}" style="width: 100% !important; text-align: right !important; margin-top: 4px !important; display: block !important; padding: 2px 4px !important; box-sizing: border-box !important; border-top: 1px solid rgba(226, 232, 240, 0.8) !important;">
    <a href="${platformUrl}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size: 9px !important; color: #94a3b8 !important; text-decoration: none !important; font-weight: 500 !important; display: inline-block !important;">Ads by ${siteName}</a>
  </div>
</div>

<script>
  (function() {
    var delayMs = ${delayMsTop};
    var closeDelayMs = ${repeat_count !== null && repeat_count !== undefined ? repeat_count * 1000 : 0};
    var container = document.getElementById('float-top-container-${id}');
    
    window.dismissFloatTop_${safeFloatTopId} = function() {
      if (container) {
        container.style.opacity = '0';
        container.style.top = '-200px';
        setTimeout(function() {
          container.remove();
        }, 300);
      }
    };

    setTimeout(function() {
      if (container) {
        document.body.appendChild(container);
        container.style.display = 'flex';
        // Force a reflow to trigger CSS transition
        container.offsetHeight;
        container.style.top = '0px';

        // Show close button after its own delay
        var closeBtn = document.getElementById('float-top-close-${id}');
        if (closeBtn) {
          setTimeout(function() {
            closeBtn.style.display = 'flex';
          }, closeDelayMs);
        }

        // Integrity checking loop for float label
        var checkInterval = setInterval(function() {
          var lbl = document.getElementById('br-label-${id}');
          if (!lbl || !container) {
            if (container) container.remove();
            clearInterval(checkInterval);
            return;
          }
          var style = window.getComputedStyle(lbl);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
            container.remove();
            clearInterval(checkInterval);
          }
        }, 1000);
      }
    }, delayMs);
  })();
</script>`
        }

      case 'float_bottom':
        const safeFloatBottomId = id.replace(/-/g, '_');
        const delayMsBottom = delay_between_ads !== null && delay_between_ads !== undefined ? delay_between_ads * 1000 : 0;
        return {
          head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot('/${networkCode}/${adUnitName}', [[320, 50], [300, 250]], 'div-gpt-ad-${id}').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
</script>`,
          body: `<!-- Sticky Floating Bottom Wrapper with Close Button -->
<div id="float-bottom-container-${id}" style="position: fixed; bottom: -300px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #ffffff; box-shadow: 0 -10px 25px -5px rgba(0,0,0,0.15), 0 -8px 10px -6px rgba(0,0,0,0.15); padding: 10px; display: none; flex-direction: column; align-items: center; border-top-left-radius: 12px; border-top-right-radius: 12px; transition: all 0.3s ease-in-out; border: 1px solid rgba(226, 232, 240, 0.8);">
  <button id="float-bottom-close-${id}" onclick="dismissFloatBottom_${safeFloatBottomId}()" style="position: absolute; top: -8px; right: -8px; background: rgba(15, 23, 42, 0.6); color: #ffffff; border: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 10px; display: none; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(15, 23, 42, 0.8)'" onmouseout="this.style.backgroundColor='rgba(15, 23, 42, 0.6)'">✕</button>
  <div id="div-gpt-ad-${id}" style="min-width: 300px; min-height: 50px;">
    <script>
      googletag.cmd.push(function() { googletag.display('div-gpt-ad-${id}'); });
    </script>
  </div>
  <!-- Platform Ad Label -->
  <div id="br-label-${id}" style="width: 100% !important; text-align: right !important; margin-top: 4px !important; display: block !important; padding: 2px 4px !important; box-sizing: border-box !important; border-top: 1px solid rgba(226, 232, 240, 0.8) !important;">
    <a href="${platformUrl}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size: 9px !important; color: #94a3b8 !important; text-decoration: none !important; font-weight: 500 !important; display: inline-block !important;">Ads by ${siteName}</a>
  </div>
</div>

<script>
  (function() {
    var delayMs = ${delayMsBottom};
    var closeDelayMs = ${repeat_count !== null && repeat_count !== undefined ? repeat_count * 1000 : 0};
    var container = document.getElementById('float-bottom-container-${id}');
    
    window.dismissFloatBottom_${safeFloatBottomId} = function() {
      if (container) {
        container.style.opacity = '0';
        container.style.bottom = '-350px';
        setTimeout(function() {
          container.remove();
        }, 300);
      }
    };

    setTimeout(function() {
      if (container) {
        document.body.appendChild(container);
        container.style.display = 'flex';
        // Force a reflow to trigger CSS transition
        container.offsetHeight;
        container.style.bottom = '0px';

        // Show close button after its own delay
        var closeBtn = document.getElementById('float-bottom-close-${id}');
        if (closeBtn) {
          setTimeout(function() {
            closeBtn.style.display = 'flex';
          }, closeDelayMs);
        }

        // Integrity checking loop for float label
        var checkInterval = setInterval(function() {
          var lbl = document.getElementById('br-label-${id}');
          if (!lbl || !container) {
            if (container) container.remove();
            clearInterval(checkInterval);
            return;
          }
          var style = window.getComputedStyle(lbl);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
            container.remove();
            clearInterval(checkInterval);
          }
        }, 1000);
      }
    }, delayMs);
  })();
</script>`
        }

      case 'float_fullscreen':
        const safeFloatFullscreenId = id.replace(/-/g, '_');
        const delayMsFullscreen = delay_between_ads !== null && delay_between_ads !== undefined ? delay_between_ads * 1000 : 0;
        const closeDelayMsFullscreen = repeat_count !== null && repeat_count !== undefined ? repeat_count * 1000 : 0;
        return {
          head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};
  googletag.cmd.push(function() {
    googletag.defineSlot('/${networkCode}/${adUnitName}', [[300, 250], [336, 280]], 'div-gpt-ad-${id}').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
</script>`,
          body: `<!-- Fullscreen Overlay Wrapper with Close Button -->
<div id="float-fullscreen-overlay-${id}" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background: rgba(15, 23, 42, 0.85); display: none; justify-content: center; align-items: center; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.3s ease-in-out;">
  <div id="float-fullscreen-card-${id}" style="position: relative; background: #ffffff; padding: 12px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transform: scale(0.9); transition: transform 0.3s ease-in-out;">
    <button id="float-fullscreen-close-${id}" onclick="dismissFloatFullscreen_${safeFloatFullscreenId}()" style="position: absolute; top: -10px; right: -10px; background: rgba(15, 23, 42, 0.6); color: #ffffff; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-weight: bold; font-size: 11px; display: none; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(15, 23, 42, 0.8)'" onmouseout="this.style.backgroundColor='rgba(15, 23, 42, 0.6)'">✕</button>
    <div id="div-gpt-ad-${id}">
      <script>
        googletag.cmd.push(function() { googletag.display('div-gpt-ad-${id}'); });
      </script>
    </div>
    <!-- Platform Ad Label -->
    <div id="br-label-${id}" style="width: 100% !important; text-align: right !important; margin-top: 6px !important; display: block !important; padding: 2px 4px !important; box-sizing: border-box !important; border-top: 1px solid rgba(226, 232, 240, 0.8) !important;">
      <a href="${platformUrl}" target="_blank" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size: 9px !important; color: #94a3b8 !important; text-decoration: none !important; font-weight: 500 !important; display: inline-block !important;">Ads by ${siteName}</a>
    </div>
  </div>
</div>

<script>
  (function() {
    var delayMs = ${delayMsFullscreen};
    var closeDelayMs = ${closeDelayMsFullscreen};
    var overlay = document.getElementById('float-fullscreen-overlay-${id}');
    var card = document.getElementById('float-fullscreen-card-${id}');
    
    window.dismissFloatFullscreen_${safeFloatFullscreenId} = function() {
      if (overlay) {
        overlay.style.opacity = '0';
        if (card) card.style.transform = 'scale(0.9)';
        setTimeout(function() {
          overlay.remove();
        }, 300);
      }
    };

    setTimeout(function() {
      if (overlay) {
        document.body.appendChild(overlay);
        overlay.style.display = 'flex';
        // Force a reflow
        overlay.offsetHeight;
        overlay.style.opacity = '1';
        if (card) card.style.transform = 'scale(1)';

        // Show close button after its own delay
        var closeBtn = document.getElementById('float-fullscreen-close-${id}');
        if (closeBtn) {
          setTimeout(function() {
            closeBtn.style.display = 'flex';
          }, closeDelayMs);
        }

        // Integrity checking loop for float label
        var checkInterval = setInterval(function() {
          var lbl = document.getElementById('br-label-${id}');
          if (!lbl || !overlay) {
            if (overlay) overlay.remove();
            clearInterval(checkInterval);
            return;
          }
          var style = window.getComputedStyle(lbl);
          if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0 || parseInt(style.height) === 0) {
            overlay.remove();
            clearInterval(checkInterval);
          }
        }, 1000);
      }
    }, delayMs);
  })();
</script>`
        }

      case 'banner':
      default:
        const safeBannerId = id.replace(/-/g, '_');
        return {
          head: `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || {cmd: []};

  ${helperScript}

  var slot_${safeBannerId};
  googletag.cmd.push(function() {
    slot_${safeBannerId} = googletag.defineSlot('/${networkCode}/${adUnitName}', [[300, 250], [728, 90], [320, 50]], 'div-gpt-ad-${id}').addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });

  googletag.cmd.push(function() {
    googletag.pubads().addEventListener('slotRenderEnded', function(event) {
      if (event.slot === slot_${safeBannerId} && !event.isEmpty) {
        __br_inject_label('div-gpt-ad-${id}', '${siteName}', '${platformUrl}', 'before', '${id}', slot_${safeBannerId});
      }
    });
  });
</script>`,
          body: `<!-- Place this div where you want the ad to display -->
<div id="div-gpt-ad-${id}">
  <script>
    googletag.cmd.push(function() { googletag.display('div-gpt-ad-${id}'); });
  </script>
</div>`
        }
    }
  }

  useEffect(() => {
    publisherApi.getWebsites()
      .then(r => setWebsites(r.data?.data || []))
      .catch(() => toast.error('Failed to load websites'))
      .finally(() => setLoading(false))
  }, [])

  const paginatedWebsites = websites.slice((page - 1) * 15, page * 15)

  async function toggleAdUnits(webId) {
    if (expanded === webId) { setExpanded(null); return }
    setExpanded(webId)
    if (!adUnits[webId]) {
      try {
        const res = await publisherApi.getAdUnits(webId)
        setAdUnits(a => ({ ...a, [webId]: res.data?.data || [] }))
      } catch { toast.error('Failed to load ad units') }
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌐 My Websites</h1>
          <p className="page-subtitle">{websites.length} websites assigned to you</p>
        </div>
      </div>

      {websites.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🌐</div>
            <div className="empty-state-text">No websites assigned yet</div>
            <div className="empty-state-sub">Contact your account manager to get started</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {paginatedWebsites.map(w => (
              <div key={w.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>🌐 {w.domain}</div>
                    <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                      GAM: <code>{w.gam_network_code}</code>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className={`badge ${w.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {w.is_active ? '🟢 Active' : '⚫ Inactive'}
                    </span>
                    {w.ads_txt && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedAdsTxt({ domain: w.domain, content: w.ads_txt })}
                      >
                        📋 Show ads.txt
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleAdUnits(w.id)}
                    >
                      {expanded === w.id ? '▲ Hide' : '▼ Ad Units'} ({w.ad_units_count ?? '?'})
                    </button>
                  </div>
                </div>

                {expanded === w.id && (
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                    {!adUnits[w.id] ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                        Loading ad units…
                      </div>
                    ) : adUnits[w.id].length === 0 ? (
                      <div className="text-muted text-sm">No ad units yet</div>
                    ) : (() => {
                      const groupedUnits = groupAdUnits(adUnits[w.id]);
                      return (
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Ad Unit Name</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedUnits.map(a => (
                              <tr key={a.id}>
                                <td style={{ fontWeight: 600 }}>{a.display_name}</td>
                                <td>
                                  <span className={`badge ${a.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                    {a.is_active ? '🟢 Active' : '⚫ Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-secondary btn-xs"
                                    onClick={() => setSelectedAdUnitCode({
                                      displayName: a.display_name,
                                      networkCode: w.gam_network_code,
                                      adUnitName: a.gam_ad_unit_name,
                                      id: a.id,
                                      adType: a.ad_type || 'banner',
                                      adSubtype: a.ad_subtype || '',
                                      websiteId: w.id,
                                      domain: w.domain,
                                      children: a.children,
                                      repeat_count: a.repeat_count,
                                      delay_between_ads: a.delay_between_ads
                                    })}
                                  >
                                    🏷️ Get Code
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalItems={websites.length}
            pageSize={15}
            onPageChange={setPage}
          />
        </>
      )}

      {selectedAdsTxt && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>📋 Ads.txt for {selectedAdsTxt.domain}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAdsTxt(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                Copy the entries below and append them to your site's root <code>ads.txt</code> file:
              </p>
              <textarea
                className="form-input"
                style={{
                  height: '200px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre',
                  background: '#161e2e',
                  color: '#e2e8f0',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  padding: '12px',
                  resize: 'vertical'
                }}
                readOnly
                value={selectedAdsTxt.content}
                onClick={e => e.target.select()}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAdsTxt.content)
                    toast.success('Ads.txt copied to clipboard!')
                  }}
                >
                  Copy Content
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedAdsTxt(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAdUnitCode && (() => {
        const websiteAdUnits = adUnits[selectedAdUnitCode.websiteId] || [];
        const scripts = getAdUnitScripts(selectedAdUnitCode, websiteAdUnits);
        return (
          <div className="modal-backdrop">
            <div className="modal" style={{ maxWidth: '650px' }}>
              <div className="modal-header">
                <h2>🏷️ Ad Unit Code: {selectedAdUnitCode.displayName}</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAdUnitCode(null)}>✕</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="text-sm text-muted" style={{ marginBottom: 4 }}>
                  Ad Type: <span style={{ fontWeight: 600, color: 'var(--color-primary-light)', textTransform: 'capitalize' }}>{selectedAdUnitCode.adType.replace('_', ' ')}</span>
                  {selectedAdUnitCode.adSubtype && <> ({selectedAdUnitCode.adSubtype})</>}
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    1. Header Code (Place inside the <code>&lt;head&gt;</code> section of your HTML page)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="form-input"
                      style={{
                        height: '140px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        whiteSpace: 'pre',
                        background: '#161e2e',
                        color: '#e2e8f0',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        padding: '10px',
                        width: '100%',
                        resize: 'none'
                      }}
                      readOnly
                      value={scripts.head}
                      onClick={e => e.target.select()}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.9 }}
                      onClick={() => {
                        navigator.clipboard.writeText(scripts.head);
                        toast.success('Header code copied!');
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                {scripts.body && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                      2. Body Code (Place where the ad should render)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        className="form-input"
                        style={{
                          height: '110px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          whiteSpace: 'pre',
                          background: '#161e2e',
                          color: '#e2e8f0',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          padding: '10px',
                          width: '100%',
                          resize: 'none'
                        }}
                        readOnly
                        value={scripts.body}
                        onClick={e => e.target.select()}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.9 }}
                        onClick={() => {
                          navigator.clipboard.writeText(scripts.body);
                          toast.success('Body code copied!');
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const fullCode = scripts.body
                        ? `<!-- Header Code -->\n${scripts.head}\n\n<!-- Body Code -->\n${scripts.body}`
                        : scripts.head;
                      navigator.clipboard.writeText(fullCode);
                      toast.success('Code block copied!');
                    }}
                  >
                    {scripts.body ? 'Copy Full Block' : 'Copy Code'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedAdUnitCode(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )
}
