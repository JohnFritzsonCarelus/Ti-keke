const CACHE_NAME = "tikeke-v1";
const urlsToCache = ["/", "/index.html", "/static/js/main.chunk.js", "/static/css/main.chunk.css"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

self.addEventListener("push", event => {
  const data = event.data?.json() || { title: "Ti Kèkè 💕", body: "Ou gen yon nouvo notifikasyon!" };
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: "/favicon.ico", badge: "/favicon.ico",
    vibrate: [200, 100, 200], tag: "tikeke-notif"
  }));
});
