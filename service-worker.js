const CACHE_NAME = "creature-evolution-arena-v45";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./firebase.js",
  "./manifest.json",
  "./app-icon.svg",
  "./assets/cards/arciera-elfea.png",
  "./assets/cards/aurelia-angelo-solare.png",
  "./assets/cards/drakthar-il-drago-infernale.png",
  "./assets/cards/fenice-reale.png",
  "./assets/cards/golem-di-pietra.png",
  "./assets/cards/guardiano-della-foresta.png",
  "./assets/cards/leviatano-degli-abissi.png",
  "./assets/cards/mago-del-gelo.png",
  "./assets/cards/necromante-del-vuoto.png",
  "./assets/cards/stregone-del-chaos.png"
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
    Firebase/CDN esterni non vanno messi in cache.
    Così il multiplayer resta online e aggiornato.
  */
  if (url.origin !== self.location.origin) {
    return;
  }

  /*
    HTML: prima rete, poi cache.
    Così dopo un deploy vedi subito la versione nuova.
  */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put("./index.html", copy);
          });

          return response;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  /*
    CSS e JS: prima rete, poi cache.
    Evita bug fastidiosi dopo gli aggiornamenti.
  */
  if (
    request.url.includes("style.css") ||
    request.url.includes("script.js") ||
    request.url.includes("firebase.js")
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }

  /*
    Altri file statici: prima cache, poi rete.
  */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy);
        });

        return response;
      });
    })
  );
});