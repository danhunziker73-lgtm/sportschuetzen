// WICHTIG: Dies MUSS die allererste Zeile sein!
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Erst danach darf dein eigener Code kommen
try {
    importScripts('/sportschuetzen/sw.js');
} catch (e) {
    console.error("Eigener SW konnte nicht geladen werden:", e);
}
