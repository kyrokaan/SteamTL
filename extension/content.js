(() => {
  // Price classes and cart/modal boundaries accommodate Steam's newer React UI.
  const selector = [
    "#header_wallet_balance", ".header_wallet_balance",
    ".game_purchase_price", ".discount_original_price", ".discount_final_price",
    ".search_price", ".search_price_discount_combined", ".match_price",
    ".game_area_dlc_price", ".cart_item_price", ".cart_estimated_total",
    ".wishlist_row .price", ".salepreviewwidgets_StoreSalePriceBox",
    '[class*="Price_StoreSalePriceBox"]', '[class*="Price_OriginalPrice"]',
    '[class*="Price_FinalPrice"]', '[class*="CartItemPrice"]',
    '[class*="PriceContainer"]', '[class*="priceContainer"]',
    '[class*="StoreSalePrice"]', '[class*="Wishlist"] [class*="Price"]',
    '[class*="price"]', '[class*="Price"]',
    '[class*="Cart"]', '[class*="cart"]',
    '[role="dialog"]', '.DialogBody', '.newmodal',
    '[class*="Modal"]', '[class*="modal"]'
  ].join(",");
  const boundarySelector = '[class*="Cart"], [class*="cart"], [role="dialog"], .DialogBody, .newmodal, [class*="Modal"], [class*="modal"]';
  const priceSelector = '[class*="price"], [class*="Price"], #header_wallet_balance, .header_wallet_balance';
  const records = new Map();
  const titles = new Map();
  let state = null;
  let timer;
  let requestId = 0;
  const dirtyRoots = new Set();
  const inCart = () => /^\/cart(?:\/|$)/.test(location.pathname);
  function mutationScope(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) return null;
    const context = element.closest(selector);
    if (context) {
      if (!context.matches(boundarySelector)) return context.parentElement || context;
      if (element === context) return context;
      return element.parentElement && element.parentElement !== context ? element.parentElement : element;
    }
    // Opaque discounted prices can share a row with a named original price.
    for (let row = element.parentElement, level = 0; row && row !== document.body && level < 2; row = row.parentElement, level++) {
      if (row.querySelector(priceSelector)) return row;
    }
    if (element.querySelector(selector)) return element;
    return inCart() ? element.parentElement || element : null;
  }
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          const scope = mutationScope(node);
          if (scope) dirtyRoots.add(scope);
        }
        if (mutation.removedNodes.length) {
          let removedPrice = [...mutation.removedNodes].some(node => node.nodeType === Node.ELEMENT_NODE && (node.matches(selector) || node.querySelector(selector)));
          for (const node of records.keys()) if (!node.isConnected) { records.delete(node); removedPrice = true; }
          for (const element of titles.keys()) if (!element.isConnected) titles.delete(element);
          if (removedPrice || mutation.target.closest?.(selector) || inCart()) {
            const scope = mutationScope(mutation.target);
            if (scope) dirtyRoots.add(scope);
          }
        }
      } else {
        const scope = mutationScope(mutation.target);
        if (scope) dirtyRoots.add(scope);
        // Restore a previously converted price when its identifying class disappears.
        else if (mutation.type === "attributes" && [...records.keys()].some(node => mutation.target.contains(node))) dirtyRoots.add(mutation.target);
      }
    }
    if (!dirtyRoots.size) return;
    clearTimeout(timer);
    timer = setTimeout(() => { const roots = [...dirtyRoots]; dirtyRoots.clear(); render(roots); }, 120);
  });
  function observe() { observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] }); }
  function eligible(node) {
    return node.parentElement && !node.parentElement.closest('script,style,textarea,input,select,option,h1,h2,h3,h4,h5,h6,[contenteditable]:not([contenteditable="false"])');
  }
  function convert(nodes, original, amount) {
    const tl = SteamTL.formatTRY(amount, state.rate, state.settings.decimals);
    const converted = state.settings.display === "both" ? `${SteamTL.formatUSD(amount)} (${tl})` : tl;
    nodes.forEach((node, index) => {
      const value = index === 0 ? converted : "";
      records.set(node, { original: node.nodeValue, converted: value });
      node.nodeValue = value;
    });
    const element = nodes[0].parentElement;
    if (!titles.has(element)) {
      const originalTitle = element.getAttribute("title");
      const t = (key, params) => SteamTLI18n.t(state.settings.language, key, params);
      const source = state.source === "manual" ? t("manualSource") : t("marketSource", { date: state.date || t("unknown"), time: state.time || "" }) + (state.stale ? t("stale") : "");
      const generated = (originalTitle ? originalTitle + "\n" : "") + t("priceTitle", { usd: original.trim(), rate: state.rate, source });
      titles.set(element, { original: originalTitle, generated });
      element.setAttribute("title", generated);
    }
  }
  function render(roots = null) {
    const full = roots === null;
    if (full) { clearTimeout(timer); dirtyRoots.clear(); }
    else {
      roots = roots.filter(root => root.isConnected);
      const rootSet = new Set(roots);
      roots = roots.filter(root => {
        for (let parent = root.parentElement; parent; parent = parent.parentElement) if (rootSet.has(parent)) return false;
        return true;
      });
      if (!roots.length) return;
    }
    const included = node => full || roots.some(root => root === node || root.contains(node));
    observer.disconnect();
    try {
      for (const [element, record] of titles) {
        if (!element.isConnected) { titles.delete(element); continue; }
        if (!included(element)) continue;
        if (element.getAttribute("title") === record.generated) {
          if (record.original === null) element.removeAttribute("title");
          else element.setAttribute("title", record.original);
        }
        titles.delete(element);
      }
      const active = state?.settings?.enabled && SteamTL.validRate(state.rate);
      for (const [node, record] of records) {
        if (!node.isConnected || node.nodeValue !== record.converted) { records.delete(node); continue; }
        if (!included(node)) continue;
        node.nodeValue = record.original;
      }
      if (!active) {
        for (const node of records.keys()) if (included(node)) records.delete(node);
        return;
      }
      const seen = new Set();
      const containers = new Set();
      const boundaries = new Set();
      for (const root of full ? [document.body] : roots) {
        if (root.matches(selector)) containers.add(root);
        for (const element of root.querySelectorAll(selector)) containers.add(element);
        if (root.closest(boundarySelector)) boundaries.add(root);
        for (const element of root.querySelectorAll(boundarySelector)) boundaries.add(element);
        if (inCart()) boundaries.add(root);
      }
      // The cart summary may use entirely opaque CSS class names.
      if (full && inCart()) containers.add(document.body);
      // The discounted price may have only a generated class name while its
      // sibling original price retains a semantic name (StoreOriginalPrice).
      // Scan the shared price row rather than depending on the generated name.
      for (const price of [...containers].filter(element => element.matches(priceSelector))) {
        const row = price.parentElement;
        if (row && row !== document.body && row !== document.documentElement) {
          containers.add(row);
          boundaries.add(row);
        }
      }
      const scanBoundaries = [...boundaries].filter(boundary => {
        for (let parent = boundary.parentElement; parent; parent = parent.parentElement) if (boundaries.has(parent)) return false;
        return true;
      });
      for (const boundary of scanBoundaries) {
        const walker = document.createTreeWalker(boundary, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!eligible(node)) continue;
          containers.add(node.parentElement);
          if (node.parentElement !== boundary && boundary.contains(node.parentElement.parentElement)) containers.add(node.parentElement.parentElement);
        }
      }
      // Process inner prices first, so broad cart/modal wrappers do not consume
      // the fragments of a split currency symbol and amount before they join.
      const ordered = [...containers].map(element => {
        let depth = 0;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) depth++;
        return { element, depth };
      }).sort((a, b) => b.depth - a.depth);
      for (const { element: container } of ordered) {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while ((node = walker.nextNode())) {
          if (!seen.has(node) && eligible(node)) nodes.push(node);
        }
        const original = nodes.length > 1 && nodes.length <= 8 ? nodes.map(n => n.nodeValue).join("") : "";
        const combinedAmount = original.length <= 80 ? SteamTL.parseUSD(original) : null;
        if (combinedAmount !== null) {
          nodes.forEach(n => seen.add(n));
          convert(nodes, original, combinedAmount);
          continue;
        }
        for (const priceNode of nodes) {
          const amount = SteamTL.parseUSD(priceNode.nodeValue);
          if (amount !== null) {
            seen.add(priceNode);
            convert([priceNode], priceNode.nodeValue, amount);
          }
        }
      }
      for (const node of records.keys()) if (included(node) && !seen.has(node)) records.delete(node);
    } finally { observe(); }
  }
  async function update() {
    const id = ++requestId;
    try {
      const next = await chrome.runtime.sendMessage({ type: "STEAM_TL_STATE" });
      if (id !== requestId) return;
      state = next;
      render();
    } catch { /* Extension may have been reloaded; refresh the page to reconnect. */ }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.settings || changes.rateCache)) update();
  });
  // Check the market quote on long-lived tabs too.
  setInterval(update, 6 * 60 * 60 * 1000);
  observe();
  update();
})();
