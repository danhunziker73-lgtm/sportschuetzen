importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Falls deine sw.js im Hauptordner liegt, brauchen wir ../..
try {
    importScripts('../../sw.js');
} catch (e) {
    console.error("Zusatz-SW nicht gefunden");
}
