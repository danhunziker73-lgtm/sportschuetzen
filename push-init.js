if (window === window.top) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async (OneSignal) => {
await OneSignal.init({
  appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
  serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
  serviceWorkerUpdaterWorkerPath: "push/onesignal/OneSignalSDKUpdaterWorker.js"
});
    console.log("✅ OneSignal bereit", {
      optedIn: OneSignal.User.PushSubscription.optedIn,
      permission: await OneSignal.Notifications.permission
    });
  });
}
