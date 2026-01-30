// push-init.js
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
        appId: "4fd0fec9-a8dd-40d9-94e9-7ba330c07176",
        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "push/onesignal/OneSignalSDKUpdaterWorker.js",
        serviceWorkerParam: {
            scope: "/sportschuetzen/push/onesignal/"
        }
    });
    console.log("Init OK");
});

async function askPush() {
    console.log("Starte Abfrage...");
    OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.Notifications.requestPermission();
        console.log("Nach Abfrage - Permission:", OneSignal.Notifications.permission);
    });
}
