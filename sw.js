const CACHE = "muhen-app-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-512.png",
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

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
// Dieser Teil steuert, was beim Klick auf die Nachricht passiert
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Nachricht schließen
    
    // Die URL aus den OneSignal-Daten auslesen
    const targetUrl = event.notification.data ? event.notification.data.url : '/sportschuetzen/index.html';

    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clientList) {
            // 1. Schauen, ob die App schon irgendwo offen ist
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                // Wenn ja, dann wechsle dort die Seite und hol sie in den Vordergrund
                if ('navigate' in client && 'focus' in client) {
                    client.focus();
                    return client.navigate(targetUrl);
                }
            }
            // 2. Wenn die App komplett zu war, öffne sie neu mit der Ziel-URL
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
}); 
