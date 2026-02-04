window.OneSignal = window.OneSignal || [];
OneSignal.push(function() {
  OneSignal.init({
    appId: "DEINE_ONESIGNAL_APP_ID", // hier deine OneSignal App ID einfügen
    safari_web_id: "web.onesignal.auto.YOUR_SAFARI_WEB_ID", // nur für Safari/iOS nötig
    notifyButton: {
      enable: false // wir machen eigenes Button
    }
  });

  const statusEl = document.getElementById("status");
  const btn = document.getElementById("subscribe");

  btn.addEventListener("click", async () => {
    const isPushEnabled = await OneSignal.isPushNotificationsEnabled();
    if (!isPushEnabled) {
      OneSignal.registerForPushNotifications().then(() => {
        statusEl.textContent = "Push aktiviert ✅";
      });
    } else {
      statusEl.textContent = "Push ist bereits aktiviert ✅";
    }
  });

  OneSignal.on('subscriptionChange', function(isSubscribed) {
    console.log("Subscription changed:", isSubscribed);
    statusEl.textContent = isSubscribed ? "Abonniert ✅" : "Nicht abonniert ❌";
  });
});
