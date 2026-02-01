window.OneSignalDeferred = window.OneSignalDeferred || [];

/**
 * Plattform-Check für iOS
 */
function getIosStatus() {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  return { isIos, isStandalone };
}

// OneSignal Initialisierung
OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({
    appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
    serviceWorkerPath: "OneSignalSDKWorker.js",
    serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js",
    serviceWorkerParam: { scope: "/sportschuetzen/" }
  });

  console.log("OneSignal Init OK");

  const ios = getIosStatus();
  const perm = await OneSignal.Notifications.getPermission();

  // iOS: Nur Home-Screen Apps dürfen Push
  if (ios.isIos && !ios.isStandalone) {
    showPushInfo(
      "📢 Um Resultate als Push zu erhalten: Tippe auf „Teilen“ (unten in Safari) und dann auf „Zum Home-Bildschirm“."
    );
    return;
  }

  // UI-Logik
  if (perm === "denied") {
    showPushInfo(
      "📢 Mitteilungen sind blockiert. Bitte in den Geräteeinstellungen für diese App aktivieren."
    );
  } else if (perm === "default") {
    createPushButton();
  }
});

/**
 * Permission-Dialog auslösen (User Interaction)
 */
function askPush() {
  OneSignalDeferred.push(async function (OneSignal) {
    const permission = await OneSignal.Notifications.requestPermission();
    console.log("Permission Status:", permission);

    if (permission === "granted") {
      document.getElementById("push-info-banner")?.remove();
      document.getElementById("push-activate-btn")?.remove();
      alert("✅ Push-Mitteilungen sind jetzt aktiv!");
    }
  });
}

/**
 * Info-Banner
 */
function showPushInfo(text) {
  if (document.getElementById("push-info-banner")) return;

  const banner = document.createElement("div");
  banner.id = "push-info-banner";
  banner.style.cssText = `
    background:#fefcbf;
    color:#92400e;
    padding:15px;
    margin:15px;
    border-radius:12px;
    font-size:0.9rem;
    font-weight:600;
    text-align:center;
    border:2px solid #f59e0b;
    line-height:1.4;
  `;
  banner.innerHTML = text;

  document.getElementById("page-home")?.prepend(banner);
}

/**
 * Push-Aktivierungsbutton
 */
function createPushButton() {
  if (document.getElementById("push-activate-btn")) return;

  const btn = document.createElement("button");
  btn.id = "push-activate-btn";
  btn.textContent = "🔔 Push-Benachrichtigungen aktivieren";
  btn.style.cssText = `
    display:block;
    width:calc(100% - 30px);
    max-width:400px;
    margin:20px auto;
    padding:15px;
    font-size:1rem;
    font-weight:bold;
    background:#fbbf24;
    color:#92400e;
    border:none;
    border-radius:12px;
    cursor:pointer;
  `;
  btn.onclick = askPush;

  document.getElementById("page-home")?.prepend(btn);
}
