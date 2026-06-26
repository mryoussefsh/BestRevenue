/**
 * BestRevenue Website Tracker
 * Async, privacy-first visit tracker — no cookies, no localStorage, fully stateless.
 * Fires once on page load. Under 2KB minified.
 *
 * Usage:
 *   <script async src="https://YOUR_SERVER/publisher-tracker.js" data-website-id="YOUR_WEBSITE_ID"></script>
 *
 * NOTE: Always use the full absolute URL for the src attribute.
 * The script auto-detects the server origin from its own src URL so the
 * tracking beacon is always sent to the correct BestRevenue server,
 * regardless of which publisher domain the script is embedded on.
 */
(function () {
  var s = document.currentScript;
  var wid = s && s.getAttribute('data-website-id');
  if (!wid) return;

  // Derive the API base from the script's own absolute src URL.
  // This ensures the beacon is sent to the BestRevenue server even when
  // this script is embedded on a third-party publisher domain.
  var apiBase = '';
  try {
    if (s && s.src) {
      apiBase = new URL(s.src).origin;
    }
  } catch (e) {}

  var ref = document.referrer || '';
  var sw = screen.width || 0;
  try {
    fetch(apiBase + '/api/v1/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website_id: wid, referrer: ref, screen_width: sw }),
      keepalive: true
    });
  } catch (e) {}
})();
