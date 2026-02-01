importScripts("https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js");

/**
 * Push-Klick Navigation
 * iOS / Android / Desktop
 */
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    "/sportschuetzen/index.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clientList => {

      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

