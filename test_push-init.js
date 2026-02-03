// Maximale Transparenz in der Konsole
function log(msg, obj) {
    const el = document.getElementById("log");
    const timestamp = new Date().toLocaleTimeString();
    const text = typeof obj !== "undefined" ? `${timestamp} - ${msg}: ${JSON.stringify(obj, null, 2)}` : `${timestamp} - ${msg}`;
    
    console.log(`[OneSignal-Debug] ${text}`, obj || "");
    if (el) {
        el.textContent += "\n" + text;
        el.scrollTop = el.scrollHeight;
    }
}

if (window === window.top) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // 1. Debug-Level VOR dem Init setzen
    OneSignalDeferred.push(() => {
        log("🚀 Setze Debug-Level auf Trace");
        window.OneSignal.Debug.setLogLevel('trace'); 
    });

    OneSignalDeferred.push(async (OneSignal) => {
        try {
            log("🔹 Starte Initialisierung...");

            await OneSignal.init({
                appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
                serviceWorkerPath: "sportschuetzen/OneSignalSDKWorker.js",
                serviceWorkerParam: { scope: "/sportschuetzen/" },
                autoRegister: false, // Wir triggern manuell für besseres Feedback
                safari_web_id: "web.onesignal.auto.ios.test",
                allowLocalhostAsSecureOrigin: true
            });

            // 2. Registrierungs-Status prüfen
            const id = await OneSignal.User.PushSubscription.id;
            const token = await OneSignal.User.PushSubscription.token;
            const optedIn = OneSignal.User.PushSubscription.optedIn;
            const permission = OneSignal.Notifications.permission;

            log("📊 Aktueller Status", {
                hasSubscriptionId: !!id,
                subscriptionId: id,
                hasToken: !!token,
                optedIn: optedIn,
                notificationPermission: permission
            });

            // 3. Wenn nicht abonniert, Button einblenden oder direkt fragen
            if (!id) {
                log("ℹ️ Keine Subscription gefunden. Triggere Slidedown...");
                await OneSignal.Slidedown.promptPush();
            }

            // 4. Events überwachen
            OneSignal.Notifications.addEventListener("permissionChange", (permission) => {
                log("🔔 Permission geändert", permission);
            });

            OneSignal.User.PushSubscription.addEventListener("change", (event) => {
                log("🔔 Subscription geändert", event);
            });

        } catch (err) {
            log("❌ Kritischer Fehler beim Init", err.stack || err);
        }
    });
}
