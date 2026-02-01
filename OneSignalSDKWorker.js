// 1️⃣ OneSignal Core (MUSS zuerst geladen werden)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2️⃣ Eigene Events DIREKT danach (keine async / keine Bedingungen)
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const url =
    event.notification?.data?.url ||
    "/index.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
