// Hilfsfunktion für Logs (DOM + Console)
function log(msg, obj) {
    const el = document.getElementById("log");
    const text = typeof obj !== "undefined" ? `${msg}: ${JSON.stringify(obj,null,2)}` : msg;
    console.log(text);
    el.textContent += "\n" + text;
    el.scrollTop = el.scrollHeight;
}

// Alles in window.top scope
if (window === window.top) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    OneSignalDeferred.push(async (OneSignal) => {
        try {
            log("🔹 OneSignal init start");

            await OneSignal.init({
                appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
                serviceWorkerPath: "/sportschuetzen/OneSignalSDKWorker.js",
                serviceWorkerUpdaterWorkerPath: "/sportschuetzen/OneSignalSDKUpdaterWorker.js",
                serviceWorkerParam: { scope: "/sportschuetzen/" },
                autoRegister: true,
                notifyButton: { enable: false },
                allowLocalhostAsSecureOrigin: true,
                persistNotification: true,
                safari_web_id: "web.onesignal.auto.ios.test"
            });

            // Debug Level maximal
            OneSignal.SERVICE_WORKER_PARAM = OneSignal.SERVICE_WORKER_PARAM || {};
            OneSignal.setSubscription(true);
            OneSignal.log.setLevel('trace');

            const permission = await OneSignal.Notifications.permission;
            const isSubscribed = await OneSignal.isPushNotificationsEnabled();

            log("✅ OneSignal Status", { permission, isSubscribed });

            // Optional: Snackbar Feedback
            showSnackbar(
                isSubscribed ? "✅ Push aktiviert" :
                permission === "default" ? "ℹ️ Push nicht aktiviert – erlauben" :
                "❌ Push blockiert"
            );

            // Subscribtion Change Event
            OneSignal.on('subscriptionChange', (isSub) => log("🔔 subscriptionChange", isSub));

            // Notification Events
            OneSignal.on('notificationDisplay', (event) => log("🔔 notificationDisplay", event));
            OneSignal.on('notificationDismiss', (event) => log("🔔 notificationDismiss", event));
            OneSignal.on('notificationPermissionChange', (event) => log("🔔 notificationPermissionChange", event));

        } catch (err) {
            log("❌ OneSignal Init Fehler", err);
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
