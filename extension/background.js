importScripts("core.js", "i18n.js");
const TTL = 6 * 60 * 60 * 1000;
let pending = null;
let lastFailure = 0;
const REFRESH_ALARM = "steam-tl-refresh-rate";
let badgeWork = Promise.resolve();
function updateBadge() {
  badgeWork = badgeWork.catch(() => {}).then(async () => {
    const stored = await chrome.storage.local.get(["settings", "rateCache", "rateStatus"]);
    const settings = { ...SteamTL.defaults, ...stored.settings };
    const cache = stored.rateCache;
    const warning = settings.enabled && settings.mode === "auto" &&
      (!!stored.rateStatus?.error || !SteamTL.validRate(cache?.rate) || cache?.source !== "ecb");
    if (warning) {
      await chrome.action.setBadgeBackgroundColor({ color: "#6c5842" });
      if (typeof chrome.action.setBadgeTextColor === "function") {
        try { await chrome.action.setBadgeTextColor({ color: "#ffffff" }); } catch { /* Optional styling must not prevent the warning. */ }
      }
    }
    await chrome.action.setBadgeText({ text: warning ? "!" : "" });
    await chrome.action.setTitle({ title: warning ? SteamTLI18n.t(settings.language, "badgeWarning") : "Steam TL" });
  });
  return badgeWork.catch(() => {});
}

async function ensureRefreshAlarm() {
  const alarm = await chrome.alarms.get(REFRESH_ALARM);
  if (!alarm || alarm.periodInMinutes !== 360) {
    await chrome.alarms.create(REFRESH_ALARM, { delayInMinutes: 360, periodInMinutes: 360 });
  }
}

async function initializeRefresh() {
  await ensureRefreshAlarm();
  await getState();
}

// Alarms wake the MV3 worker even without a Steam tab or open popup.
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === REFRESH_ALARM) return getState(true).catch(() => {});
});
chrome.runtime.onInstalled.addListener(() => initializeRefresh().catch(() => {}));
chrome.runtime.onStartup.addListener(() => initializeRefresh().catch(() => {}));
// Recreate a missing alarm whenever the worker starts, without resetting one
// that already exists. This also handles browser restarts and extension reloads.
ensureRefreshAlarm().catch(() => {});
updateBadge();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) return getState().catch(() => updateBadge());
});

function parseECB(xml) {
  // Both quotes are EUR-based observations from the same daily Cube.
  const block = xml.match(/<(?:\w+:)?Cube\b[^>]*\btime=["'](\d{4}-\d{2}-\d{2})["'][^>]*>([\s\S]*?)<\/(?:\w+:)?Cube>/i);
  const values = new Map();
  for (const tag of block?.[2].match(/<(?:\w+:)?Cube\b[^>]*\/>/gi) || []) {
    const currency = tag.match(/\bcurrency=["']([A-Z]{3})["']/)?.[1];
    const value = tag.match(/\brate=["'](\d+(?:\.\d+)?)["']/)?.[1];
    if (currency && value && !values.has(currency)) values.set(currency, Number(value));
  }
  const usd = values.get("USD"), eurTry = values.get("TRY");
  const rate = eurTry / usd;
  if (!block || !SteamTL.validRate(usd) || !SteamTL.validRate(eurTry) || !SteamTL.validRate(rate)) throw new Error("ECB kur verisi okunamadı.");
  return { rate, date: block[1], source: "ecb", eurUSD: usd, eurTRY: eurTry };
}

async function fetchRate() {
  const response = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", {
    credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Kur servisi yanıt vermedi (${response.status}).`);
  const data = parseECB(await response.text());
  const cache = { ...data, fetchedAt: Date.now() };
  await chrome.storage.local.set({ rateCache: cache, rateStatus: null });
  lastFailure = 0;
  return cache;
}

async function getState(force = false) {
  const stored = await chrome.storage.local.get(["settings", "rateCache", "rateStatus"]);
  const settings = { ...SteamTL.defaults, ...stored.settings };
  if (settings.mode === "manual") {
    await updateBadge();
    return { settings, rate: SteamTL.validRate(settings.manualRate) ? settings.manualRate : null, source: "manual" };
  }
  let cache = stored.rateCache;
  if (!SteamTL.validRate(cache?.rate) || cache.source !== "ecb") cache = null;
  let error = stored.rateStatus?.error || null;
  if (force || ((!cache || Date.now() - cache.fetchedAt > TTL) && Date.now() - lastFailure > 60000)) {
    try {
      if (!pending) pending = fetchRate().finally(() => { pending = null; });
      cache = await pending;
      error = null;
    } catch (failure) {
      lastFailure = Date.now();
      error = failure.message || "Kur alınamadı.";
      await chrome.storage.local.set({ rateStatus: { error, checkedAt: Date.now() } });
    }
  }
  await updateBadge();
  return { settings, rate: cache?.rate ?? null, date: cache?.date, fetchedAt: cache?.fetchedAt, source: "ecb", stale: !!cache && Date.now() - cache.fetchedAt > TTL, error };
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "STEAM_TL_STATE" || sender.id !== chrome.runtime.id) return;
  getState(message.force === true).then(respond).catch(() => respond({ rate: null, error: "Ayarlar okunamadı." }));
  return true;
});
