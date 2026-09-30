// The "N visitors" footnote. Reads this page's all-time count back from GoatCounter; the beacon tag
// at the end of index.html records the visit. Decorative, so it stays hidden on every failure:
// adblocker, offline, a brand-new path with no data yet, or the "visitor counts" setting off.

// A fixed date before Palate's first pageview. All-time is the default, so this doesn't change the count;
// it gives the response its own cache key, so a 404 cached before the first visit doesn't hide it for hours.
const START = '2026-01-01';

export function showVisitorCount() {
  const box = document.querySelector('.visitor-counter');
  const out = document.getElementById('visitor-count');
  if (!box || !out) return;

  // Read the endpoint off the beacon tag so the site URL lives in one place.
  // This module runs after the page is parsed, so the tag is already there.
  const tag = document.querySelector('script[data-goatcounter]');
  const endpoint = tag?.dataset.goatcounter;
  if (!endpoint) return;

  // This page's path only (never /counter/TOTAL.json, which sums every project on the shared site),
  // and pathname without ?url=… so shared links still see the main count. Routing is in the hash, so
  // the path stays /palate/.
  const path = location.pathname;

  fetch(`${endpoint.replace(/\/count$/, '')}/counter/${encodeURIComponent(path)}.json?start=${START}`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
    .then((data) => {
      // `count` is already a formatted string. GoatCounter caches it for about 4 hours.
      if (data && data.count != null) {
        out.textContent = String(data.count);
        box.hidden = false;
      }
    })
    .catch(() => { /* decorative: stay hidden */ });
}
