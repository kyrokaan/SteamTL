globalThis.SteamTLI18n = (() => {
  const messages = {
    tr: {
      subtitle: "USD fiyatlarının TL karşılığı.", language: "Dil", turkish: "Türkçe", english: "İngilizce",
      lightTheme: "Açık temaya geç", darkTheme: "Koyu temaya geç", themeError: "Tema tercihi kaydedilemedi.",
      decimals: "Kuruşları Göster", reset: "Sıfırla", resetTitle: "Ayarları sıfırla", confirmReset: "Onayla", cancel: "İptal",
      resetDone: "Varsayılan ayarlara dönüldü.", resetError: "Ayarlar sıfırlanamadı.",
      badgeWarning: "Steam TL · Güncel kur alınamadı. Eklentiyi açıp kuru yenile.",
      enabled: "TL Gösterimini Etkinleştir", mode: "Kur Seçimi", auto: "Otomatik", manual: "Manuel",
      manualLabel: "1 USD kaç TL?", manualPlaceholder: "Örn. 40,25", display: "Fiyat Gösterimi",
      refresh: "Kuru Yenile", save: "Ayarları Kaydet", loading: "Kur yükleniyor…",
      footer: "Tarayıcı açıkken kur, 6 saatte bir otomatik kontrol edilir. TL fiyatı yaklaşık değerdir. Ödeme USD olarak kalır; banka kuru farklı olabilir.",
      noRate: "Kur henüz alınamadı", manualActive: "Manuel kur kullanılıyor.",
      rateDate: "Kurun yayın tarihi: {date}", checked: "Son kontrol: {time}", stale: " · kayıtlı eski kur", waiting: "Bağlantı bekleniyor.",
      checkedTitle: "Son başarılı kontrol: {time}",
      unknown: "bilinmiyor", loadError: "Ayarlar yüklenemedi. Eklentiyi yeniden aç.",
      rateErrorCached: "Bağlantı kurulamadı. Son kayıtlı kur kullanılıyor.", rateErrorNoCache: "Kur alınamadı. Manuel kur girebilirsin.",
      manualRefresh: "Otomatik kur için seçimini kaydet.", refreshed: "Kur kontrol edildi.",
      refreshError: "Kur yenilenemedi.", invalidRate: "Sıfırdan büyük bir kur gir. Örn. 40,25",
      saved: "Kaydedildi", saveError: "Ayarlar kaydedilemedi.",
      languageError: "Dil tercihi kaydedilemedi.", manualSource: "elle girilen kur",
      marketSource: "ECB günlük referans verilerinden hesaplanan USD/TRY; {date}",
      priceTitle: "{usd} • 1 USD = {rate} TL • {source}. Yaklaşık karşılıktır."
    },
    en: {
      subtitle: "USD prices in TL.", language: "Language", turkish: "Turkish", english: "English",
      lightTheme: "Switch to light theme", darkTheme: "Switch to dark theme", themeError: "Could not save your theme preference.",
      decimals: "Show Decimals", reset: "Reset", resetTitle: "Reset settings", confirmReset: "Confirm", cancel: "Cancel",
      resetDone: "Default settings restored.", resetError: "Could not reset settings.",
      badgeWarning: "Steam TL · Current rate unavailable. Open the extension to refresh it.",
      enabled: "Show Prices in TL", mode: "Rate Selection", auto: "Automatic", manual: "Manual",
      manualLabel: "How much is 1 USD in TL?", manualPlaceholder: "e.g. 40.25", display: "Price Display",
      refresh: "Refresh Rate", save: "Save Settings", loading: "Loading rate…",
      footer: "The rate is checked automatically every 6 hours while the browser is open. TL prices are estimates. Payment remains in USD; bank rates may differ.",
      noRate: "Rate unavailable", manualActive: "Using a manual rate.",
      rateDate: "Rate published: {date}", checked: "Last checked: {time}", stale: " · older saved rate", waiting: "Waiting for connection.",
      checkedTitle: "Last successful check: {time}",
      unknown: "unknown", loadError: "Could not load settings. Reopen the extension.",
      rateErrorCached: "Could not connect. Using the last saved rate.", rateErrorNoCache: "Could not fetch the rate. Enter a manual rate.",
      manualRefresh: "Save your selection to use automatic rates.", refreshed: "Rate checked.",
      refreshError: "Could not refresh the rate.", invalidRate: "Enter a rate greater than zero, e.g. 40.25.",
      saved: "Saved", saveError: "Could not save settings.",
      languageError: "Could not save your language preference.", manualSource: "manual rate",
      marketSource: "USD/TRY calculated from ECB daily reference data; {date}",
      priceTitle: "{usd} • 1 USD = {rate} TL • {source}. Estimated amount."
    }
  };
  function normalize(language) { return language === "en" ? "en" : "tr"; }
  function locale(language) { return normalize(language) === "en" ? "en-US" : "tr-TR"; }
  function t(language, key, params = {}) {
    return (messages[normalize(language)][key] || key).replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""));
  }
  return { normalize, locale, t };
})();
