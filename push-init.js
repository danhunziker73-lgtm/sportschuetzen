window.OneSignalDeferred = window.OneSignalDeferred || [];

// Plattform-Erkennung
function isIosWebApp() {
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const standalone = window.navigator.standalone === true;
    return isIos && standalone;
}

OneSignalDeferred.push(async function(OneSignal) {
    // 1. Initialisierung
    await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
        serviceWorkerPath: "/sportschuetzen/push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/sportschuetzen/push/onesignal/OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: { scope: "/sportschuetzen/push/onesignal/" }
    });

    console.log("OneSignal Init OK");

    // 2. Berechtigungsstatus prüfen
    const perm = OneSignal.Notifications.permission; // "granted", "default", "denied"
    console.log("OneSignal permission:", perm);

    // 3. Banner oder Button anzeigen, abhängig von Status
    if (isIosWebApp()) {
        // iOS Web-App kann nie Push
        showPushInfo("📢 Push-Mitteilungen funktionieren in iOS Web-Apps leider nicht. " +
                     "Bitte Safari auf macOS oder Android benutzen.");
        return;
    }

    if (perm === "denied") {
        // Nutzer hat blockiert
        showPushInfo("📢 Mitteilungen sind blockiert. Bitte in den Browser-/Geräteeinstellungen aktivieren.");
    } else if (perm === "default") {
        // Noch nicht gefragt → Button anzeigen
        createPushButton(OneSignal);
    }
});

// Funktion für manuellen Button
async function askPush() {
    OneSignalDeferred.push(async function(OneSignal) {
        const permission = await OneSignal.Notifications.requestPermission();
        console.log("Permission Status:", permission);

        if (permission === "granted") {
            const banner = document.getElementById("push-info-banner");
            if (banner) banner.remove();
            alert("✅ Push-Mitteilungen aktiviert!");
        } else if (permission === "denied") {
            showPushInfo("📢 Mitteilungen blockiert. Bitte in den Browser-/Geräteeinstellungen aktivieren.");
        }
    });
}

// Banner/Info anzeigen
function showPushInfo(text) {
    if (document.getElementById("push-info-banner")) return;

    const banner = document.createElement("div");
    banner.id = "push-info-banner";
    banner.style.cssText = `
        background: #fefcbf;
        color: #92400e;
        padding: 12px;
        margin: 10px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
        border: 1px solid #f59e0b;
    `;
    banner.innerHTML = text;

    const homePage = document.getElementById("page-home");
    if (homePage) homePage.prepend(banner);
}

// Button erzeugen, falls noch nicht gefragt
function createPushButton(OneSignal) {
    if (document.getElementById("push-activate-btn")) return;

    const btn = document.createElement("button");
    btn.id = "push-activate-btn";
    btn.textContent = "🔔 Push aktivieren";
    btn.style.cssText = `
        display:block;
        margin:10px auto;
        padding:10px 20px;
        font-size:1rem;
        font-weight:600;
        background:#fbbf24;
        color:#92400e;
        border:none;
        border-radius:12px;
        cursor:pointer;
    `;
    btn.onclick = askPush;

    const homePage = document.getElementById("page-home");
    if (homePage) homePage.prepend(btn);
}
