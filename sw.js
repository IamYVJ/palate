// Service worker: lets Palate open and work offline once installed.
// Strategy: network first (so updates show up straight away), falling back to the cache
// when offline or when the network is slow. Your data lives in localStorage, not here.

const CACHE = 'palate-shell-v2';
const FONT_CACHE = 'palate-fonts-v1';
const NETWORK_TIMEOUT_MS = 3000;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
  'css/styles.css',
  'js/app.js',
  'js/store.js',
  'js/ui.js',
  'js/logic.js',
  'js/modals.js',
  'js/sample.js',
  'js/pwa.js',
  'js/diet.js',
  'js/catalog.js',
  'js/recipes.js',
  'js/shop-links.js',
  'js/creators.js',
  'js/views/ideas.js',
  'js/views/today.js',
  'js/views/cook.js',
  'js/views/dish.js',
  'js/views/kitchen.js',
  'js/views/out.js',
  'js/views/restaurant.js',
  'js/views/memory.js',
  'js/views/settings.js',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the browser's HTTP cache so a new version never installs old files.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts rarely change: cache first.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const isPage = request.mode === 'navigate';
  // no-cache: always check with the server (a cheap 304 when nothing changed), so updates show up on the next load.
  const network = fetch(request, { cache: 'no-cache' }).then((res) => {
    // Shared links arrive as ./?url=…; store the page once, not once per link.
    if (res.ok) cache.put(isPage ? './' : request, res.clone());
    return res;
  });
  network.catch(() => {}); // a late failure after the timeout is fine
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch {
    // offline: fall through to the cache
  }
  // Every page (./, ./?url=…, index.html) is the same app shell.
  const cached = await cache.match(isPage ? './' : request);
  return cached || network;
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}
