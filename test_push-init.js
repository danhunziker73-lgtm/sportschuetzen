// Maximale Transparenz in der Konsole und im Log-Element
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

    // 1. Debug-Level VOR der Initialisierung setzen
    window.OneSignalDeferred.push(() => {
        log("🚀 Schritt 1: Setze Debug-Level auf Trace");
        window.OneSignal.Debug.setLogLevel('trace'); 
    });

    // 2. Die eigentliche asynchrone Initialisierung
    window.OneSignalDeferred.push(async (OneSignal) => {
        try {
            log("🔹 Schritt 2: Starte Initialisierung mit Pfad-Test...");

            await OneSignal.init({
                appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
                // Pfade für GitHub Pages Unterordner
                serviceWorkerPath: "OneSignalSDKWorker.js",
                serviceWorkerParam: { scope: "/sportschuetzen/" },
                autoRegister: true,
                safari_web_id: "web.onesignal.auto.ios.test",
                allowLocalhostAsSecureOrigin: true
            });

            log("✅ Schritt 3: OneSignal.init() abgeschlossen");

            // 3. Service Worker Registrierung manuell prüfen
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                log("🔍 Schritt 4: Gefundene Service Worker Scopes:", regs.map(r => r.scope));
            } else {
                log("⚠️ Warnung: Browser unterstützt keine Service Worker");
            }

            // 4. Abo-Status abfragen
            log("📊 Schritt 5: Frage User-Status ab...");
            const id = OneSignal.User.PushSubscription.id;
            const token = OneSignal.User.PushSubscription.token;
            const optedIn = OneSignal.User.PushSubscription.optedIn;
            const permission = OneSignal.Notifications.permission;

            log("📊 Ergebnis Status-Abfrage:", {
                hasSubscriptionId: !!id,
                subscriptionId: id || "null",
                hasToken: !!token,
                optedIn: optedIn,
                notificationPermission: permission ? "granted" : "denied/default"
            });

            // 5. Prompt triggern, falls nötig
            if (!id) {
                log("ℹ️ Schritt 6: Keine Subscription ID. Versuche Slidedown/Prompt...");
                await OneSignal.Slidedown.promptPush();
            }

            // 6. Event-Listener für Echtzeit-Feedback am Mac
            log("🎧 Schritt 7: Aktiviere Event-Listener");

            OneSignal.Notifications.addEventListener("permissionChange", (perm) => {
                log("🔔 EVENT: Permission geändert", perm);
            });

            OneSignal.User.PushSubscription.addEventListener("change", (event) => {
                log("🔔 EVENT: Subscription geändert", event);
            });

        } catch (err) {
            log("❌ KRITISCHER FEHLER", {
                message: err.message,
                stack: err.stack
            });
            console.error("Full Error Object:", err);
        }
    });
}
