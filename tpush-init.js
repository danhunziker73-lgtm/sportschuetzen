// push-init.js
if (window === window.top) {

  // Service Worker manuell registrieren
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sportschuetzen/push/onesignal/OneSignalSDKWorker.js', {
      scope: '/sportschuetzen/'  // Scope auf App-Root setzen
    }).then(() => {
      console.log("✅ Service Worker registriert");
      initOneSignal();
    }).catch((err) => {
      console.error("❌ Service Worker Registrierung fehlgeschlagen:", err);
    });
  } else {
    console.warn("⚠️ Service Worker nicht unterstützt");
  }

  async function initOneSignal() {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
          serviceWorkerUpdaterWorkerPath: "push/onesignal/OneSignalSDKUpdaterWorker.js"
        });

        const permission = await OneSignal.Notifications.permission; // "default" | "granted" | "denied"
        const isSubscribed = await OneSignal.isPushNotificationsEnabled(); // true/false

        if (isSubscribed) showSnackbar("✅ Push aktiviert");
        else if (permission === "default") showSnackbar("ℹ️ Push nicht erlaubt – einmal aktivieren");
        else if (permission === "denied") showSnackbar("❌ Push blockiert");

        console.log("OneSignal Status:", { permission, isSubscribed });

      } catch (e) {
        console.error("❌ OneSignal Init Fehler:", e);
      }
    });
  }

  function showSnackbar(message) {
    const snackbar = document.createElement("div");
    snackbar.textContent = message;
    Object.assign(snackbar.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: "8px",
      zIndex: 9999,
      fontFamily: "sans-serif",
      fontSize: "14px"
    });
    document.body.appendChild(snackbar);
    setTimeout(() => snackbar.remove(), 5000);
  }
}
