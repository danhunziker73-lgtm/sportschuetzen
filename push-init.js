window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
    // 1. Initialisierung
    await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
        serviceWorkerPath: "/push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/push/onesignal/OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: {
            scope: "/sportschuetzen/push/onesignal/"
        }
    });
    console.log("OneSignal Init OK");

    // 2. Prüfung der Berechtigung & Hinweis-Banner
    if (OneSignal.Notifications.permissionNative === "denied") {
        console.warn("Push ist blockiert.");
        showPushWarning();
    }

    // 3. Direkt nach Init die Berechtigungsabfrage starten
    const permission = await OneSignal.Notifications.requestPermission();
    console.log("Permission Status:", permission);

    // Falls nach der Abfrage erlaubt wurde, Banner entfernen
    if (permission === "granted") {
        const banner = document.getElementById("push-denied-banner");
        if (banner) banner.remove();
    }
});

// Funktion zum manuellen Abfragen (für Button im Upload oder Home)
async function askPush() {
    console.log("Starte Abfrage...");
    OneSignalDeferred.push(async function(OneSignal) {
        const permission = await OneSignal.Notifications.requestPermission();
        console.log("Permission Status:", permission);

        // Falls erlaubt, Banner entfernen
        if (permission === "granted") {
            const banner = document.getElementById("push-denied-banner");
            if (banner) banner.remove();
        }
    });
}

function showPushWarning() {
    if (document.getElementById("push-denied-banner")) return;

    const banner = document.createElement("div");
    banner.id = "push-denied-banner";
    banner.style.cssText = `
        background: #feb2b2; 
        color: #9b2c2c; 
        padding: 12px; 
        margin: 10px; 
        border-radius: 12px; 
        font-size: 0.85rem; 
        font-weight: 600; 
        text-align: center;
        border: 1px solid #f56565;
    `;
    banner.innerHTML = `
        📢 Mitteilungen sind blockiert.<br>
        <span style="font-size: 0.75rem; font-weight: 400;">
            Bitte in den Geräte-Einstellungen für diese App aktivieren.
        </span>
    `;
    
    // Banner oben auf der Startseite einfügen
    const homePage = document.getElementById("page-home");
    if (homePage) {
        homePage.prepend(banner);
    }
}
