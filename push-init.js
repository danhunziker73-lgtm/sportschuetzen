window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
    // 1. Initialisierung
    await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
        serviceWorkerPath: "/sportschuetzen/push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/sportschuetzen/push/onesignal/OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: { scope: "/sportschuetzen/push/onesignal/" }
    });
    console.log("OneSignal Init OK");

    // 2. Prüfen, ob Push bereits erlaubt/abgelehnt wurde
    const perm = OneSignal.Notifications.permission;
    console.log("Aktuelle Permission:", perm);

    if (perm === "denied") {
        showPushWarning();
        localStorage.setItem("pushAsked", "true"); // merken, dass wir schon gefragt haben
        return;
    }

    // 3. Nur zeigen, wenn noch nicht gefragt wurde
    const alreadyAsked = localStorage.getItem("pushAsked");
    if (!alreadyAsked && perm !== "granted") {
        createPushButton(OneSignal);
    }
});

// Funktion, um den Button einmalig zu erzeugen
function createPushButton(OneSignal) {
    const container = document.getElementById("page-home") || document.body;
    const btn = document.createElement("button");
    btn.textContent = "🔔 Push aktivieren";
    btn.style.cssText = `
        width: 100%;
        padding: 12px;
        font-size: 1rem;
        font-weight: 600;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 12px;
        margin: 10px 0;
        cursor: pointer;
    `;
    btn.addEventListener("click", async () => {
        try {
            const result = await OneSignal.Notifications.requestPermission();
            console.log("Permission Status:", result);
            if (result === "granted") {
                alert("✔ Push aktiviert!");
                btn.remove();
            } else if (result === "denied") {
                showPushWarning();
                btn.remove();
            }
        } catch (err) {
            console.error(err);
        } finally {
            localStorage.setItem("pushAsked", "true"); // merken, dass wir schon gefragt haben
        }
    });
    container.prepend(btn);
}

// Banner, wenn Push blockiert ist
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
    
    const homePage = document.getElementById("page-home") || document.body;
    homePage.prepend(banner);
}

// Optional: Manuelles Abfragen über Button
async function askPush() {
    console.log("Starte Abfrage...");
    OneSignalDeferred.push(async function(OneSignal) {
        const permission = await OneSignal.Notifications.requestPermission();
        console.log("Permission Status:", permission);
        if (permission === "granted") {
            const banner = document.getElementById("push-denied-banner");
            if (banner) banner.remove();
        }
        localStorage.setItem("pushAsked", "true");
    });
}
