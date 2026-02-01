OneSignalDeferred.push(async (OneSignal) => {
  try {
    console.log("=== OneSignal Push Test ===");
    console.log("OptedIn:", OneSignal.User.PushSubscription.optedIn);
    console.log("Permission:", await OneSignal.Notifications.permission);
    console.log("Token:", OneSignal.User.PushSubscription.token);

    if (!OneSignal.User.PushSubscription.optedIn) {
      console.warn("⚠️ Nutzer hat Push nicht erlaubt.");
      return;
    }

    // Kurzer Test: zeigt an, ob der Token erreichbar ist
    const token = OneSignal.User.PushSubscription.token;
    if (!token) {
      console.error("❌ Token ist noch nicht verfügbar – Push noch nicht registriert!");
      return;
    }

    console.log("✅ Token ist verfügbar, Push kann gesendet werden.");

    // Optional: Test-Nachricht senden (lokal simuliert)
    OneSignal.Notifications.showNotification({
      title: "Test Push",
      message: "Wenn du diese Nachricht siehst, funktioniert Push!",
      url: "/sportschuetzen/index.html"
    }).then(() => console.log("✅ Test Push angezeigt"))
      .catch(err => console.error("❌ Fehler beim Test Push:", err));

  } catch (err) {
    console.error("❌ Push Test Fehler:", err);
  }
});
