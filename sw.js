const CACHE = "muhen-app-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-513.png",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
];

// 1. Installation: Dateien in den Cache laden
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// 2. Aktivierung: Alte Caches löschen (Wichtig bei Updates!)
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      );
    })
  );
});

// 3. Abfrage: Erst Netzwerk probieren, sonst Cache
self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
