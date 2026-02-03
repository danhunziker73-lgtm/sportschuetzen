importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

self.addEventListener('push', event => {
    console.log("🛎 push event", event);
});

self.addEventListener('notificationclick', event => {
    console.log("🖱 notificationclick event", event);
    event.notification.close();
});

self.addEventListener('notificationclose', event => {
    console.log("❌ notificationclose event", event);
});
