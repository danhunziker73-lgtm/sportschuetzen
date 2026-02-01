// Minimal OneSignal Init – nur Top-Level, keine UI oder Hinweise
if (window === window.top) { // nur auf der Hauptseite ausführen
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
        serviceWorkerPath: "OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: { scope: "/sportschuetzen/" }
      });

      console.log("✅ OneSignal Init OK");
    } catch (err) {
      console.error("❌ OneSignal Init Fehler:", err);
    }
  });
}

