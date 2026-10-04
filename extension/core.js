/* Shared, dependency-free price parsing and formatting. */
globalThis.SteamTL = (() => {
  const defaults = { enabled: true, mode: "auto", manualRate: null, display: "replace", language: "tr", theme: "dark", decimals: true };
  function validRate(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
  }
  function parseUSD(text) {
    // Currency formatters may include invisible bidi/spacing markers.
    const value = text.replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "").trim().replace(/[\u00a0\u202f]/g, " ");
    const match = value.match(/^(?:(?:US\s*\$|\$)\s*([\d.,]+)(?:\s*USD)?|USD\s*([\d.,]+)|([\d.,]+)\s*(?:USD|US\s*\$|\$))$/i);
    if (!match) return null;
    const raw = match[1] || match[2] || match[3];
    let normalized;
    if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(raw)) normalized = raw.replace(/,/g, "");
    else if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(raw)) normalized = raw.replace(/\./g, "").replace(",", ".");
    else if (/^\d+(?:[.,]\d{1,2})?$/.test(raw)) normalized = raw.replace(",", ".");
    else return null;
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : null;
  }
  const formatter = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const wholeFormatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
  function formatTRY(amount, rate, decimals = true) {
    const value = Number((amount * rate).toFixed(8));
    return `₺${(decimals === false ? wholeFormatter : formatter).format(value)}`;
  }
  function formatUSD(amount) { return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
  return { defaults, validRate, parseUSD, formatTRY, formatUSD };
})();
