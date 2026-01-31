window.OneSignalDeferred = window.OneSignalDeferred || [];

/**
 * Plattform-Check für iOS
 * Prüft, ob es ein iPhone/iPad ist und ob die App bereits 
 * auf dem Homescreen (Standalone) installiert wurde.
 */
function getIosStatus() {
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    return { isIos, isStandalone };
}

// 1. OneSignal Initialisierung
OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
        serviceWorkerPath: "OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: { scope: "/sportschuetzen/" }
    });

    console.log("OneSignal Init OK");

    // NAVIGATION-FIX: Wenn die App offen ist und ein Push geklickt wird
    OneSignal.Notifications.addEventListener("click", function(event) {
        if (event.notification.data && event.notification.data.url) {
            console.log("Navigiere zu:", event.notification.data.url);
            window.location.href = event.notification.data.url;
        }
    });

    const perm = OneSignal.Notifications.permission;
    const ios = getIosStatus();

    // 2. iOS Spezialbehandlung
    if (ios.isIos && !ios.isStandalone) {
        showPushInfo("📢 Um Resultate als Push zu erhalten: Tippe auf 'Teilen' (unten in Safari) und dann auf 'Zum Home-Bildschirm'.");
        return;
    }

    // 3. UI-Logik basierend auf Berechtigung
    if (perm === "denied") {
        showPushInfo("📢 Mitteilungen sind blockiert. Bitte in den Geräteeinstellungen für diese App aktivieren.");
    } else if (perm === "default") {
        createPushButton(OneSignal);
    }
});

/**
 * Löst die Erlaubnis-Abfrage aus
 */
async function askPush() {
    OneSignalDeferred.push(async function(OneSignal) {
        const permission = await OneSignal.Notifications.requestPermission();
        console.log("Permission Status:", permission);

        if (permission === "granted") {
            const banner = document.getElementById("push-info-banner");
            const btn = document.getElementById("push-activate-btn");
            if (banner) banner.remove();
            if (btn) btn.remove();
            alert("✅ Push-Mitteilungen sind jetzt aktiv!");
        }
    });
}

/**
 * Erzeugt ein Info-Banner (Gelb)
 */
function showPushInfo(text) {
    if (document.getElementById("push-info-banner")) return;

    const banner = document.createElement("div");
    banner.id = "push-info-banner";
    banner.style.cssText = `
        background: #fefcbf;
        color: #92400e;
        padding: 15px;
        margin: 15px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        text-align: center;
        border: 2px solid #f59e0b;
        line-height: 1.4;
    `;
    banner.innerHTML = text;

    // Füge es oben in der Home-Seite ein
    const homePage = document.getElementById("page-home");
    if (homePage) homePage.prepend(banner);
}

/**
 * Erzeugt den Aktivierungs-Button
 */
function createPushButton(OneSignal) {
    if (document.getElementById("push-activate-btn")) return;

    const btn = document.createElement("button");
    btn.id = "push-activate-btn";
    btn.textContent = "🔔 Push-Benachrichtigungen aktivieren";
    btn.style.cssText = `
        display: block;
        width: calc(100% - 30px);
        max-width: 400px;
        margin: 20px auto;
        padding: 15px;
        font-size: 1rem;
        font-weight: bold;
        background: #fbbf24;
        color: #92400e;
        border: none;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        cursor: pointer;
    `;
    btn.onclick = askPush;

    const homePage = document.getElementById("page-home");
    if (homePage) homePage.prepend(btn);
}
