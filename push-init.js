if (window === window.top) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
      serviceWorkerPath: "OneSignalSDKWorker.js",
      serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js"
    });

    console.log("✅ OneSignal bereit");
  });
}

