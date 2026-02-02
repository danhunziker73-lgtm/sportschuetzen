
if (window === window.top) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async (OneSignal) => {
    try {
await OneSignal.init({
  appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
  // Wir nutzen relative Pfade ohne den führenden Slash, 
  // falls die Files im gleichen Ordner wie die index.html liegen
  serviceWorkerPath: "OneSignalSDKWorker.js",
  serviceWorkerUpdaterWorkerPath: "OneSignalSDKWorker.js",
  serviceWorkerParam: { scope: "/sportschuetzen/" },
  allowLocalhostAsSecureOrigin: true // Hilft beim Debuggen
});;

      const permission = await OneSignal.Notifications.permission;
      const isSubscribed = await OneSignal.isPushNotificationsEnabled();

      console.log("✅ OneSignal Status:", { permission, isSubscribed });

      showSnackbar(
        isSubscribed ? "✅ Push aktiviert" :
        permission === "default" ? "ℹ️ Push nicht aktiviert – erlauben" :
        "❌ Push blockiert"
      );

    } catch (err) {
      console.error("❌ OneSignal Init Fehler:", err);
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


