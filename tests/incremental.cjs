const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { launchBrowser, extensionDir } = require('./helpers.cjs');
(async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const fixture = '<p id="unrelated">Unrelated text</p><div class="CartRoot">' + Array.from({ length: 600 }, (_, i) => `<div><div><div class="discount_original_price">$19.99</div><div id="price-${i}">$9.99</div></div></div>`).join('') + '</div><div id="standalone" class="game_purchase_price">$3.00</div>';
    await page.route('https://store.steampowered.com/app/1/', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto('https://store.steampowered.com/app/1/');
    await page.evaluate(() => {
      window.state = { settings: { enabled: true, display: 'replace' }, rate: 40, source: 'manual' };
      window.chrome = { runtime: { sendMessage: async () => window.state }, storage: { onChanged: { addListener: fn => window.changed = fn } } };
      window.textVisits = 0;
      const original = Document.prototype.createTreeWalker;
      Document.prototype.createTreeWalker = function (...args) {
        const walker = original.apply(this, args), next = walker.nextNode.bind(walker);
        walker.nextNode = () => { window.textVisits++; return next(); };
        return walker;
      };
    });
    for (const file of ['core.js', 'i18n.js', 'content.js']) await page.addScriptTag({ content: fs.readFileSync(path.join(extensionDir, file), 'utf8') });
    await page.waitForFunction(() => document.querySelector('#price-599').textContent === '₺399,60');
    await page.evaluate(() => { window.textVisits = 0; document.querySelector('#unrelated').firstChild.nodeValue = 'Changed unrelated text'; });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.textVisits), 0, 'Unrelated mutations must not rescan prices');
    await page.evaluate(() => document.querySelector('#unrelated').remove());
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.textVisits), 0, 'Removing unrelated content must not rescan prices');
    await page.evaluate(() => document.querySelector('#price-1').firstChild.nodeValue = '$12.99');
    await page.waitForFunction(() => document.querySelector('#price-1').textContent === '₺519,60');
    assert.ok(await page.evaluate(() => window.textVisits) < 100, 'One changed row must not rescan the whole cart');
    assert.equal(await page.locator('#price-599').textContent(), '₺399,60');
    await page.evaluate(() => document.querySelector('#standalone').className = 'plain');
    await page.waitForFunction(() => document.querySelector('#standalone').textContent === '$3.00');
    assert.equal(await page.locator('#standalone').getAttribute('title'), null);
    await page.evaluate(() => document.querySelector('#standalone').className = 'game_purchase_price');
    await page.waitForFunction(() => document.querySelector('#standalone').textContent === '₺120,00');
    await page.evaluate(() => { document.querySelector('#price-2').parentElement.remove(); window.state.settings.enabled = false; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('#price-599').textContent === '$9.99');
    assert.equal(await page.locator('#price-1').textContent(), '$12.99');
    console.log('PASS: incremental scan, unrelated mutations, class removal/restoration, detached rows and global disable.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
