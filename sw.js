'use strict';

const CACHE_NAME    = 'roma2027-v1';
const FONT_CACHE    = 'roma2027-fonts-v1';

// App shell — everything needed to run offline
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './assets/css/app.css',
  './assets/js/app.js',
  './assets/js/db.js',
  './assets/js/data.js',
  './assets/js/timer.js',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

// Google Fonts to cache on first load
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Google Fonts: cache-first, long TTL
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheThenNetwork(event.request, FONT_CACHE));
    return;
  }

  // Navigation requests (HTML) — network-first so updates land quickly
  if (event.request.mode === 'navigate') {
    event.respondWith(networkThenCache(event.request, CACHE_NAME));
    return;
  }

  // App shell assets — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Everything else — network only (YouTube links, etc.)
  event.respondWith(fetch(event.request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — recurso não disponível', { status: 503 });
  }
}

async function cacheThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — fonte não disponível', { status: 503 });
  }
}

async function networkThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ─── Background sync (future: sync workout logs) ──────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then(cache => cache.addAll(urls));
  }
});
