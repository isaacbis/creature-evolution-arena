const CACHE_NAME = "creature-evolution-arena-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./firebase.js",
  "./manifest.json",
  "./app-icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  /*
    Non tocchiamo Firebase, Google APIs o CDN esterne.
    Il multiplayer deve restare sempre online.
  */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
    Navigazione: prova rete, se offline apri index.html dalla cache.
  */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  /*
    File statici: prima cache, poi rete.
  */
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy);
        });

        return response;
      });
    })
  );
});