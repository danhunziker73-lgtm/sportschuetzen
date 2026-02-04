
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "975091f5-948b-48d4-9e61-b7f4d43a1021",
      autoRegister: false,
      notifyButton: { enable: true }
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
      console.log("Bitte App zum Homescreen hinzufügen");
    }
  });

