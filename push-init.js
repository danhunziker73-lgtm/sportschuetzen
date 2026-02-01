// Minimal OneSignal Init – nur Top-Level, keine UI oder Hinweise
if (window === window.top) { // nur auf der Hauptseite ausführen
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
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

