const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { launchBrowser, extensionDir, artifactPath } = require('./helpers.cjs');
const read = name => fs.readFileSync(path.join(extensionDir, name), 'utf8');
(async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const fixture = `<h1>Your cart $74.98</h1><div class="_opaque"><h2>$19.99</h2><p>Game costs $44.99 today</p><div id="old">$59.99</div><div id="final">$44.99</div><div id="other">$29.99</div></div><aside><span>Estimated total</span><strong id="total">$74.98</strong></aside><div id="split"><span>$</span><span>12.99</span><span> USD</span></div><textarea>$9.99</textarea><div id="foreign">CDN$19.99</div>`;
    await page.route('https://store.steampowered.com/cart/', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto('https://store.steampowered.com/cart/');
    await page.evaluate(() => {
      window.state = { settings: { enabled: true, display: 'replace', language: 'tr' }, rate: 40, source: 'manual' };
      window.chrome = { runtime: { sendMessage: async () => structuredClone(window.state) }, storage: { onChanged: { addListener: cb => window.changed = cb } } };
    });
    for (const name of ['core.js','i18n.js','content.js']) await page.addScriptTag({ content: read(name) });
    await page.waitForFunction(() => document.querySelector('#total').textContent === '₺2.999,20');
    assert.equal(await page.locator('#old').textContent(),'₺2.399,60');
    assert.equal(await page.locator('#final').textContent(),'₺1.799,60');
    assert.equal(await page.locator('#other').textContent(),'₺1.199,60');
    assert.equal(await page.locator('#split').textContent(),'₺519,60');
    assert.equal(await page.locator('h2').textContent(),'$19.99');
    assert.equal(await page.locator('textarea').inputValue(),'$9.99');
    assert.equal(await page.locator('#foreign').textContent(),'CDN$19.99');
    assert.equal(await page.locator('p').textContent(),'Game costs $44.99 today');
    await page.evaluate(() => { window.state.settings.display = 'both'; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('#total').textContent === '$74.98 (₺2.999,20)');
    assert.equal(await page.locator('#split').textContent(),'$12.99 (₺519,60)');
    await page.evaluate(() => {
      const dialog = document.createElement('div'); dialog.setAttribute('role','dialog');
      dialog.innerHTML = '<h2>Added to your cart!</h2><div id="modal-old">$59.99</div><div id="modal-price"><span>$</span><span>44.99</span></div><button id="modal-button-price"><span>$</span>16.79</button><div contenteditable="false" id="modal-bidi-price">\u2066$16.79\u2069</div><div contenteditable="true" id="editable">$16.79</div>';
      document.body.append(dialog);
    });
    await page.waitForFunction(() => document.querySelector('#modal-price').textContent === '$44.99 (₺1.799,60)');
    assert.equal(await page.locator('#modal-button-price').textContent(),'$16.79 (₺671,60)');
    assert.equal(await page.locator('#modal-bidi-price').textContent(),'$16.79 (₺671,60)');
    assert.equal(await page.locator('#editable').textContent(),'$16.79');
    await page.evaluate(() => document.querySelector('#total').textContent = '$29.99');
    await page.waitForFunction(() => document.querySelector('#total').textContent === '$29.99 (₺1.199,60)');
    await page.evaluate(() => { window.state.settings.enabled = false; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('#total').textContent === '$29.99');
    assert.equal(await page.locator('#split').textContent(),'$12.99 USD');
    assert.equal(await page.locator('#split span').nth(0).textContent(),'$');
    assert.equal(await page.locator('#split span').nth(1).textContent(),'12.99');
    assert.equal(await page.locator('#modal-price').textContent(),'$44.99');
    // Test a dialog on an app page too, outside the cart route.
    await page.route('https://store.steampowered.com/app/1/', route => route.fulfill({ contentType:'text/html',body:'<div role="dialog"><div id="app-dialog">$44.99</div><div id="app-split"><span>$</span><b>59.99</b></div></div><p id="outside">$44.99</p>' }));
    await page.goto('https://store.steampowered.com/app/1/');
    await page.evaluate(() => {
      window.chrome = { runtime: { sendMessage: async () => ({ settings: { enabled:true,display:'replace' },rate:40,source:'manual' }) },storage:{onChanged:{addListener(){}}} };
    });
    for (const name of ['core.js','i18n.js','content.js']) await page.addScriptTag({ content:read(name) });
    await page.waitForFunction(() => document.querySelector('#app-dialog').textContent === '₺1.799,60');
    assert.equal(await page.locator('#app-split').textContent(),'₺2.399,60');
    assert.equal(await page.locator('#outside').textContent(),'$44.99');
    // Screenshot structure: opaque modal/row/final classes, named original price.
    await page.evaluate(() => {
      const dialog = document.createElement('div'); dialog.className = '_opaqueDialog_123';
      dialog.innerHTML = '<h2>Added to your cart!</h2><span class="_opaqueRow_456"><span>-75%</span><div class="_1_P7Dmzd6trtJ9KdCsm-Nk"><div id="hash-original" class="_2z2Ba4q2zi5jWk2QF17G2c StoreOriginalPrice">$69.99</div><div id="hash-final" class="_2Ddt9rJYO847UxQG9pUQiI">$17.49</div></div></span>';
      document.body.append(dialog);
    });
    await page.waitForFunction(() => document.querySelector('#hash-final').textContent === '₺699,60', null, { timeout: 1500 });
    assert.equal(await page.locator('#hash-original').textContent(),'₺2.799,60');
    console.log('PASS: cart items, discounts, opaque total, split currency markup, live modal, total updates, both display modes and original DOM restoration.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
