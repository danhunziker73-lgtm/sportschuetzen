window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
    // 1. Init
    await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
        serviceWorkerPath: "/sportschuetzen/push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/sportschuetzen/push/onesignal/OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: { scope: "/sportschuetzen/push/onesignal/" }
    });
    console.log("OneSignal Init OK");

    // 2. Prüfen, ob bereits blockiert
    if (OneSignal.Notifications.permissionNative === "denied") {
        console.warn("Push ist blockiert.");
        showPushWarning();
    }

    // 3. Button erstellen, um Prompt von User-Click aus zu starten
    const btn = document.createElement("button");
    btn.textContent = "Push aktivieren";
    btn.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        z-index: 9999;
        cursor: pointer;
    `;
    document.body.appendChild(btn);

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        console.log("Starte OneSignal native Prompt...");
        try {
            await OneSignal.showNativePrompt();
            console.log("Prompt sollte jetzt erschienen sein");
        } catch (err) {
            console.error("Fehler beim Anzeigen des Push-Prompts", err);
        } finally {
            btn.remove();
        }
    });
});

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
    
    const homePage = document.getElementById("page-home");
    if (homePage) homePage.prepend(banner);
}
