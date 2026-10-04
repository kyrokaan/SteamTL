const $ = id => document.getElementById(id);
let language = "tr";
let theme = "dark";
let resetting = false;
let lastState = null;
let statusKey = "";
let statusError = false;
let statusTimer;
let pendingSaveWarning = "";
const t = (key, params) => SteamTLI18n.t(language, key, params);
function status(key, error = false) {
  clearTimeout(statusTimer);
  pendingSaveWarning = "";
  statusKey = key;
  statusError = error;
  $("status").textContent = key ? t(key) : "";
  $("status").className = error ? "error" : "";
  if (key === "saved" && !error) statusTimer = setTimeout(() => status(pendingSaveWarning, !!pendingSaveWarning), 3000);
  else if (key === "refreshed" && !error) statusTimer = setTimeout(() => status(""), 3000);
}
function choice(name) { return document.querySelector(`input[name="${name}"]:checked`).value; }
function setChoice(name, value) {
  const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (input) input.checked = true;
}
function toggleMode() {
  $("manual-section").hidden = choice("mode") !== "manual";
  $("refresh").hidden = choice("mode") === "manual" || lastState?.source === "manual";
  $("rate-date").hidden = choice("mode") === "manual" || lastState?.source === "manual" || !$("rate-date").textContent;
}
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  const label = t(theme === "light" ? "darkTheme" : "lightTheme");
  $("theme").title = label;
  $("theme").setAttribute("aria-label", label);
}
function applyLanguage() {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll("[data-i18n]")) element.textContent = t(element.dataset.i18n);
  $("manual").placeholder = t("manualPlaceholder");
  $("language").setAttribute("aria-label", t("language"));
  $("reset").title = t("resetTitle");
  $("reset").textContent = t(resetting ? "confirmReset" : "reset");
  applyTheme();
  for (const button of document.querySelectorAll("[data-language]")) {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
    button.title = t(button.dataset.language === "tr" ? "turkish" : "english");
  }
  if (lastState) showRate(lastState);
  else $("rate").textContent = t("loading");
  $("status").textContent = statusKey ? t(statusKey) : "";
}
function showRate(state) {
  lastState = state;
  const locale = SteamTLI18n.locale(language);
  $("rate").textContent = SteamTL.validRate(state.rate) ? `1 USD = ${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(state.rate)} TL` : t("noRate");
  const checkedAt = Number.isFinite(state.fetchedAt) ? new Date(state.fetchedAt) : null;
  const time = checkedAt?.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const sourceDate = /^\d{4}-\d{2}-\d{2}$/.test(state.date || "") ? new Date(`${state.date}T12:00:00Z`) : null;
  $("rate-date").hidden = state.source === "manual" || !sourceDate || !Number.isFinite(sourceDate.getTime());
  $("rate-date").textContent = $("rate-date").hidden ? "" : t("rateDate", { date: sourceDate.toLocaleDateString(locale, { day: "numeric", month: "long", timeZone: "UTC" }) });
  $("rate-date").title = state.date || "";
  toggleMode();
  $("date").textContent = state.source === "manual" ? t("manualActive") : checkedAt ? t("checked", { time }) + (state.stale ? t("stale") : "") : t("waiting");
  $("date").title = state.source === "manual" ? "" : t("marketSource", { date: state.date || t("unknown") }) + (checkedAt ? `\n${t("checkedTitle", { time: checkedAt.toLocaleString(locale, { hour12: false }) })}` : "");
  const warning = state.error ? (state.rate ? "rateErrorCached" : "rateErrorNoCache") : "";
  if (statusKey === "saved") pendingSaveWarning = warning;
  else if (warning) status(warning, true);
}
async function load() {
  try {
    const { settings: saved } = await chrome.storage.local.get("settings");
    const settings = { ...SteamTL.defaults, ...saved };
    language = SteamTLI18n.normalize(settings.language);
    theme = settings.theme === "light" ? "light" : "dark";
    applyLanguage();
    $("enabled").checked = settings.enabled;
    $("decimals").checked = settings.decimals !== false;
    setChoice("mode", settings.mode);
    setChoice("display", settings.display);
    $("manual").value = settings.manualRate ? String(settings.manualRate).replace(".", language === "tr" ? "," : ".") : "";
    toggleMode();
    showRate(await chrome.runtime.sendMessage({ type: "STEAM_TL_STATE" }));
  } catch { status("loadError", true); }
}
async function persistPreference(key, value, errorKey) {
  const buttons = document.querySelectorAll("[data-language], #theme, .primary, #reset, #cancel-reset");
  for (const item of buttons) item.disabled = true;
  try {
    const { settings: saved } = await chrome.storage.local.get("settings");
    // Change only this preference, keeping other settings and form drafts intact.
    await chrome.storage.local.set({ settings: { ...SteamTL.defaults, ...saved, [key]: value } });
  } catch { status(errorKey, true); }
  finally { for (const item of buttons) item.disabled = false; }
}
$("language").addEventListener("click", async event => {
  const button = event.target.closest("[data-language]");
  if (!button || button.dataset.language === language) return;
  language = SteamTLI18n.normalize(button.dataset.language);
  applyLanguage();
  await persistPreference("language", language, "languageError");
});
$("theme").addEventListener("click", async () => {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme();
  await persistPreference("theme", theme, "themeError");
});
function cancelReset() {
  resetting = false;
  $("reset").textContent = t("reset");
  $("cancel-reset").hidden = true;
}
$("cancel-reset").addEventListener("click", cancelReset);
$("reset").addEventListener("click", async () => {
  if (!resetting) {
    resetting = true;
    $("reset").textContent = t("confirmReset");
    $("cancel-reset").hidden = false;
    return;
  }
  const controls = document.querySelectorAll("form button, form input, [data-language], #theme, #reset, #cancel-reset");
  for (const control of controls) control.disabled = true;
  try {
    await chrome.storage.local.set({ settings: { ...SteamTL.defaults } });
    cancelReset();
    await load();
    if (!lastState?.error) status("resetDone");
  } catch { status("resetError", true); }
  finally { for (const control of controls) control.disabled = false; }
});
$("version").textContent = `v${chrome.runtime.getManifest().version}`;
$("mode").addEventListener("change", toggleMode);
$("refresh").addEventListener("click", async () => {
  $("refresh").disabled = true;
  status("");
  try {
    const state = await chrome.runtime.sendMessage({ type: "STEAM_TL_STATE", force: true });
    showRate(state);
    if (!state.error) status(state.source === "manual" ? "manualRefresh" : "refreshed");
  } catch { status("refreshError", true); }
  finally { $("refresh").disabled = false; }
});
$("settings").addEventListener("submit", async event => {
  event.preventDefault();
  const raw = $("manual").value.trim();
  const manualRate = /^\d+(?:[.,]\d+)?$/.test(raw) ? Number(raw.replace(",", ".")) : null;
  if (choice("mode") === "manual" && !SteamTL.validRate(manualRate)) { status("invalidRate", true); return; }
  try {
    await chrome.storage.local.set({ settings: { enabled: $("enabled").checked, mode: choice("mode"), manualRate, display: choice("display"), language, theme, decimals: $("decimals").checked } });
  } catch { status("saveError", true); return; }
  status("saved");
  try {
    showRate(await chrome.runtime.sendMessage({ type: "STEAM_TL_STATE" }));
  } catch {
    if (statusKey === "saved") pendingSaveWarning = "loadError";
    else status("loadError", true);
  }
});
load();
