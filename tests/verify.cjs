const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { launchBrowser, extensionDir, artifactPath } = require('./helpers.cjs');
const dir = extensionDir;
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');

async function workerTests() {
  let stored = {}, requests = 0, fail = false, malformed = false;
  let alarmState, alarmCreations = 0, alarmHandler, installedHandler, startupHandler;
  let badgeText, badgeTitle, settingsChanged;
  const context = vm.createContext({
    console, Intl, Date, AbortSignal, setTimeout,
    chrome: { storage: { local: {
      get: async () => structuredClone(stored), set: async values => Object.assign(stored, values)
    }, onChanged: { addListener: cb => { settingsChanged = cb; } } }, action: {
      setBadgeText: async ({text}) => { badgeText = text; }, setTitle: async ({title}) => { badgeTitle = title; },
      setBadgeBackgroundColor: async () => {}, setBadgeTextColor: async () => {}
    }, alarms: {
      get: async () => alarmState,
      create: async (name, info) => { alarmCreations++; alarmState = { name, ...info }; },
      onAlarm: { addListener: cb => { alarmHandler = cb; } }
    }, runtime: { id: 'test', onMessage: { addListener() {} },
      onInstalled: { addListener: cb => { installedHandler = cb; } },
      onStartup: { addListener: cb => { startupHandler = cb; } }
    } },
    fetch: async () => { requests++; if (fail) throw new Error('offline'); return { ok: true, text: async () => malformed ? '<html>challenge</html>' : '<Cube><Cube time="2026-10-01"><Cube currency="USD" rate="1.25"/><Cube currency="TRY" rate="50"/></Cube></Cube>' }; }
  });
  context.importScripts = (...files) => files.forEach(file => vm.runInContext(read(file), context));
  vm.runInContext(read('background.js'), context);
  await vm.runInContext('ensureRefreshAlarm()',context);
  assert.equal(alarmState.periodInMinutes,360);
  // Optional badge color is absent in older Chromium versions.
  const originalBadgeColor = context.chrome.action.setBadgeTextColor;
  delete context.chrome.action.setBadgeTextColor;
  badgeText = ''; badgeTitle = '';
  await vm.runInContext('updateBadge()', context);
  assert.equal(badgeText, '!');
  assert.match(badgeTitle, /Güncel kur alınamadı/);
  // A styling failure must not prevent the visible warning either.
  context.chrome.action.setBadgeTextColor = async () => { throw new Error('unsupported color'); };
  badgeText = ''; badgeTitle = '';
  await vm.runInContext('updateBadge()', context);
  assert.equal(badgeText, '!');
  assert.match(badgeTitle, /Güncel kur alınamadı/);
  context.chrome.action.setBadgeTextColor = originalBadgeColor;
  const initialCreations = alarmCreations;
  await vm.runInContext('ensureRefreshAlarm()',context);
  assert.equal(alarmCreations,initialCreations);
  context.fixtureXML = fs.readFileSync(path.join(__dirname, 'fixtures/ecb-daily.xml'),'utf8');
  const parsedFixture = vm.runInContext('parseECB(fixtureXML)',context);
  assert.ok(parsedFixture.rate > 0); assert.equal(parsedFixture.source,'ecb');
  assert.equal(parsedFixture.date,'2026-10-02'); assert.ok(Math.abs(parsedFixture.rate - 55.165 / 1.1225) < 1e-10);
  for (const bad of ['', '<Cube time="2026-10-02"><Cube currency="USD" rate="0"/><Cube currency="TRY" rate="50"/></Cube>', '<Cube time="2026-10-02"><Cube currency="USD" rate="1"/></Cube>']) {
    context.badXML = bad;
    assert.throws(() => vm.runInContext('parseECB(badXML)', context));
  }
  alarmState = {periodInMinutes:5};
  await vm.runInContext('ensureRefreshAlarm()',context);
  assert.equal(alarmState.periodInMinutes,360);
  let state = await vm.runInContext('getState()', context);
  assert.equal(state.rate, 40); assert.equal(requests, 1); assert.ok(state.fetchedAt > 0);
  assert.equal(badgeText,'');
  await vm.runInContext('getState()', context); assert.equal(requests, 1);
  stored.rateCache.fetchedAt = Date.now() - 5 * 60 * 60 * 1000;
  await vm.runInContext('getState()', context); assert.equal(requests, 1);
  stored.rateCache.fetchedAt = Date.now() - 7 * 60 * 60 * 1000;
  await vm.runInContext('getState()', context); assert.equal(requests, 2);
  stored.rateCache.fetchedAt = Date.now() - 86400000;
  fail = true;
  state = await vm.runInContext('getState(true)', context);
  assert.equal(state.rate, 40); assert.equal(state.stale, true); assert.equal(state.error, 'offline');
  assert.equal(badgeText,'!'); assert.match(badgeTitle,/Güncel kur alınamadı/);
  state = await vm.runInContext('getState()',context);
  assert.equal(state.error,'offline'); assert.equal(badgeText,'!');
  stored = {}; state = await vm.runInContext('getState(true)', context); assert.equal(state.rate, null);
  stored = {rateCache:{rate:49.135,source:'bloomberght',fetchedAt:Date.now()}};
  state = await vm.runInContext('getState(true)', context); assert.equal(state.rate,null);
  stored = { settings: { mode: 'manual', manualRate: 42 } };
  const before = requests;
  state = await vm.runInContext('getState(true)', context); assert.equal(state.rate, 42); assert.equal(requests, before);
  assert.equal(badgeText,'');
  stored = {}; fail = false; malformed = true;
  state = await vm.runInContext('getState(true)', context); assert.equal(state.rate, null); assert.ok(state.error);
  stored = { rateCache: { rate: 49.067, date: '2026-10-01', fetchedAt: Date.now() } };
  malformed = false;
  state = await vm.runInContext('getState(true)', context); assert.equal(state.rate,40); assert.equal(state.source,'ecb');
  assert.equal(badgeText,''); assert.equal(stored.rateStatus,null);
  const core = context.SteamTL;
  // With no popup, tabs or content scripts, an alarm alone must fetch a rate.
  const beforeAlarm = requests;
  await alarmHandler({ name: 'steam-tl-refresh-rate' });
  assert.equal(requests,beforeAlarm + 1);
  assert.equal(stored.rateCache.rate,40);
  const afterAlarm = requests;
  await alarmHandler({ name: 'unrelated' });
  assert.equal(requests,afterAlarm);
  stored.settings = { mode: 'manual', manualRate: 49.12 };
  await alarmHandler({ name: 'steam-tl-refresh-rate' });
  assert.equal(requests,afterAlarm);
  assert.equal(stored.settings.manualRate,49.12);
  alarmState = undefined;
  await startupHandler();
  assert.equal(alarmState.periodInMinutes,360);
  stored = {};
  await installedHandler();
  assert.equal(stored.rateCache.rate,40);
  fail = true;
  await alarmHandler({ name: 'steam-tl-refresh-rate' });
  assert.equal(stored.rateCache.rate,40);
  assert.equal(badgeText,'!');
  stored.settings = { enabled: false, language: 'en' };
  await settingsChanged({settings:{}},'local');
  assert.equal(badgeText,'');
  stored.settings.enabled = true;
  await settingsChanged({settings:{}},'local');
  assert.equal(badgeText,'!'); assert.match(badgeTitle,/Current rate unavailable/);
  fail = false;
  await vm.runInContext('getState(true)',context);
  assert.equal(badgeText,'');
  console.log('PASS: background alarms without Steam, schedule restoration, install refresh, manual mode, and offline cache preservation.');
  for (const mode of ['auto','manual']) {
    const profile = {enabled:false,mode,manualRate:50.25,display:'both',language:'en',theme:'light',decimals:false};
    stored = {settings:structuredClone(profile),rateCache:{rate:49.135,source:'bloomberght',fetchedAt:Date.now()}};
    await installedHandler({reason:'update',previousVersion:'1.7.15'});
    assert.deepEqual(stored.settings,profile);
    await startupHandler();
    assert.deepEqual(stored.settings,profile);
    fail = true;
    await installedHandler({reason:'update',previousVersion:'1.8.7'});
    assert.deepEqual(stored.settings,profile);
    fail = false;
  }
  stored = {settings:{language:'en',theme:'light',display:'both',mode:'manual',manualRate:50}};
  await installedHandler({reason:'update',previousVersion:'1.6.1'});
  state = await vm.runInContext('getState()',context);
  assert.equal(state.settings.language,'en'); assert.equal(state.settings.theme,'light');
  assert.equal(state.settings.display,'both'); assert.equal(state.settings.decimals,true);
  assert.equal(state.settings.manualRate,50);
  assert.equal(Object.hasOwn(stored.settings,'decimals'),false);
  console.log('PASS: existing preferences survive updates, source changes, browser startup and offline updates; missing new options receive defaults.');
  for (const [text, amount] of [['$19.99',19.99],['19,99 USD',19.99],['US$ 1,299.99',1299.99],['1.299,99 USD',1299.99],['$0.00',0],['$1,000',1000],['\u2066$16.79\u2069',16.79],['$\u202f16.79',16.79]]) assert.equal(core.parseUSD(text),amount,text);
  for (const text of ['CDN$19.99','A$19.99','19,99 TL','Free','-50%','Buy for $19.99','$1.2.3','HK$19.99']) assert.equal(core.parseUSD(text),null,text);
  assert.equal(core.formatTRY(19.99,40),'₺799,60');
  assert.equal(core.formatTRY(19.99,40,false),'₺800');
  assert.equal(core.formatUSD(14.39),'$14.39');
  console.log('PASS: parsing, rounding, cache, manual mode, offline fallback, malformed API.');
}

async function browserTests() {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(`<div class="game_purchase_price" title="Steam price">$19.99 USD</div><div class="discount_original_price"><s>$29.99</s></div><div class="discount_final_price">$9.99</div><h1>Game $19.99</h1><div class="search_price">CDN$ 9.99</div><div class="search_price">Free to Play</div>`);
    await page.evaluate(() => {
      window.testState = { settings: { enabled: true, display: 'replace' }, rate: 40, date: '2026-10-01', source: 'auto' };
      window.chrome = { runtime: { sendMessage: async () => structuredClone(window.testState) }, storage: { onChanged: { addListener: listener => window.changed = listener } } };
    });
    await page.addScriptTag({ content: read('core.js') });
    await page.addScriptTag({ content: read('i18n.js') });
    await page.addScriptTag({ content: read('content.js') });
    await page.evaluate(() => {
      const wallet = document.createElement('a');
      wallet.id = 'header_wallet_balance'; wallet.href = '/account/'; wallet.textContent = '$0.08 USD';
      document.body.prepend(wallet);
    });
    await page.waitForFunction(() => document.querySelector('#header_wallet_balance').textContent === '₺3,20');
    assert.equal(await page.locator('#header_wallet_balance').getAttribute('href'),'/account/');
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').textContent === '₺799,60');
    assert.equal(await page.locator('.discount_original_price').textContent(),'₺1.199,60');
    assert.equal(await page.locator('h1').textContent(),'Game $19.99');
    assert.equal(await page.locator('.search_price').first().textContent(),'CDN$ 9.99');
    assert.match(await page.locator('.game_purchase_price').getAttribute('title'),/\$19.99/);
    await page.evaluate(() => { window.testState.settings.language = 'en'; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').title.includes('Estimated amount.'));
    assert.equal(await page.locator('.game_purchase_price').textContent(),'₺799,60');
    await page.evaluate(() => { window.testState.settings.language = 'tr'; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').title.includes('Yaklaşık karşılıktır.'));
    await page.evaluate(() => { document.querySelector('.discount_final_price').textContent = '$4.99'; const e = document.createElement('div'); e.className = 'search_price'; e.textContent = '$5.00'; document.body.append(e); });
    await page.waitForFunction(() => document.querySelector('.discount_final_price').textContent === '₺199,60');
    assert.equal(await page.locator('.search_price').last().textContent(),'₺200,00');
    await page.evaluate(() => { window.testState.settings.display = 'both'; window.testState.rate = 50; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').textContent === '$19.99 (₺999,50)');
    assert.equal(await page.locator('#header_wallet_balance').textContent(),'$0.08 (₺4,00)');
    await page.evaluate(() => { window.testState.settings.decimals = false; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').textContent === '$19.99 (₺1.000)');
    await page.evaluate(() => { window.testState.settings.decimals = true; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').textContent === '$19.99 (₺999,50)');
    await page.evaluate(() => { window.testState.settings.enabled = false; window.changed({ settings: {} }, 'local'); });
    await page.waitForFunction(() => document.querySelector('.game_purchase_price').textContent === '$19.99 USD');
    assert.equal(await page.locator('.game_purchase_price').getAttribute('title'),'Steam price');
    assert.equal(await page.locator('.discount_final_price').textContent(),'$4.99');
    assert.equal(await page.locator('#header_wallet_balance').textContent(),'$0.08 USD');
    await page.evaluate(() => { window.testState.settings.enabled = true; window.testState.rate = null; window.changed({ settings: {} }, 'local'); });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.game_purchase_price').textContent(),'$19.99 USD');
    console.log('PASS: DOM conversion, discounts, dynamic insertion and price changes, rate changes, disable/restore, no rate.');

    await page.setContent(read('popup.html'));
    const font = fs.readFileSync(path.join(dir,'fonts/InterVariable.woff2'));
    await page.addStyleTag({ content: read('popup.css').replace('url("fonts/InterVariable.woff2")', `url("data:font/woff2;base64,${font.toString('base64')}")`) });
    const fontLoaded = await page.evaluate(async () => {
      const fonts = await document.fonts.load('400 13px Inter', 'Türkçe İngilizce ₺');
      return fonts.length === 1 && fonts[0].status === 'loaded';
    });
    assert.equal(fontLoaded,true);
    await page.evaluate(version => {
      window.saved = {};
      window.checkedAt = 1790928000000;
      window.chrome = { storage: { local: { get: async () => ({ settings: window.saved }), set: async value => { window.saved = value.settings; } } }, runtime: { getManifest: () => ({version}), sendMessage: async message => {
        if (message.force) window.checkedAt += 120000;
        return { settings: window.saved, rate: window.saved.mode === 'manual' ? window.saved.manualRate : 40, date: '2026-10-01', time: '11:30:48', fetchedAt: window.checkedAt, source: window.saved.mode === 'manual' ? 'manual' : 'ecb' };
      } } };
    }, JSON.parse(read('manifest.json')).version);
    await page.addScriptTag({ content: read('core.js') });
    await page.addScriptTag({ content: read('i18n.js') });
    await page.addScriptTag({ content: read('popup.js') });
    await page.setViewportSize({ width: 340, height: 600 });
    async function checkPopupFits(label) {
      const size = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth }));
      assert.ok(size.height <= 600, `${label}: popup height ${size.height} exceeds 600`);
      assert.ok(size.width <= 340, `${label}: popup width ${size.width} exceeds 340`);
      console.log(`PASS: ${label} fits (${size.width} × ${size.height}).`);
    }
    await checkPopupFits('Automatic mode');
    assert.equal(await page.locator('#version').textContent(),`v${JSON.parse(read('manifest.json')).version}`);
    const initialTime = await page.locator('#date').textContent();
    await page.locator('#refresh').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Kur kontrol edildi.');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '', {timeout:5000});
    assert.notEqual(await page.locator('#date').textContent(), initialTime);
    assert.match(await page.locator('#date').getAttribute('title'), /ECB.*2026-10-01/);
    console.log('PASS: refresh advances check time while source timestamp stays unchanged.');
    const headerRects = () => page.evaluate(() => ['header','.badge','h1','.header-controls'].map(selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
    }));
    const trHeaderRects = await headerRects();
    await page.locator('[data-language="en"]').click();
    assert.deepEqual(await headerRects(),trHeaderRects);
    await page.locator('[data-language="tr"]').click();
    assert.deepEqual(await headerRects(),trHeaderRects);
    console.log('PASS: TR/EN header, logo, title and controls keep identical positions and dimensions.');
    await page.locator('#mode label').filter({ hasText: 'Manuel' }).click();
    await checkPopupFits('Manual mode');
    await page.locator('#manual').fill('0');
    await page.locator('.primary').click();
    assert.match(await page.locator('#status').textContent(),/Sıfırdan büyük/);
    await checkPopupFits('Manual validation error');
    await page.locator('#manual').fill('42,50');
    await page.locator('.primary').click();
    await page.waitForFunction(() => window.saved.manualRate === 42.5);
    assert.match(await page.locator('#rate').textContent(),/42,5 TL/);
    await checkPopupFits('Manual saved state');
    await page.screenshot({ path: artifactPath('popup-tr.png'), fullPage: true });
    await page.locator('#manual').fill('51,12');
    await page.locator('[data-language="en"]').click();
    await page.waitForFunction(() => window.saved.language === 'en');
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('.primary').textContent(),'Save Settings');
    assert.equal(await page.locator('#mode legend').textContent(),'Rate Selection');
    assert.equal(await page.locator('#display legend').textContent(),'Price Display');
    assert.equal(await page.locator('[data-i18n="subtitle"]').textContent(),'USD prices in TL.');
    assert.equal(await page.locator('[data-i18n="decimals"]').textContent(),'Show Decimals');
    assert.equal(await page.locator('#manual').inputValue(),'51,12');
    assert.equal(await page.evaluate(() => window.saved.manualRate),42.5);
    assert.match(await page.locator('footer').textContent(),/payment remains in USD/i);
    assert.equal(await page.locator('[data-i18n="privacy"]').count(), 0);
    assert.equal(await page.locator('#github, #rate-source').count(), 0);
    assert.equal(await page.locator('.footer-links a').count(), 0);
    assert.equal(await page.locator('#status').textContent(),'Saved');
    assert.equal(await page.locator('#refresh').isVisible(),false);
    assert.equal(await page.locator('#rate-date').isVisible(),false);
    await checkPopupFits('English manual mode');
    await page.locator('#manual').fill('0');
    await page.locator('.primary').click();
    assert.match(await page.locator('#status').textContent(),/greater than zero/);
    await checkPopupFits('English validation error');
    await page.evaluate(() => load());
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('#manual').inputValue(),'42.5');
    await page.locator('#mode label').filter({ hasText: 'Automatic' }).click();
    await checkPopupFits('English automatic mode');
    await page.locator('#mode label').filter({ hasText: 'Manual' }).click();
    await page.screenshot({ path: artifactPath('popup-en.png'), fullPage: true });
    await page.locator('[data-language="tr"]').click();
    await page.waitForFunction(() => window.saved.language === 'tr');
    assert.equal(await page.locator('.primary').textContent(),'Ayarları Kaydet');
    assert.match(await page.locator('#status').textContent(),/Sıfırdan büyük/);
    console.log('PASS: TR/EN translation, persistence, unsaved form preservation, and localized price tooltips.');
    await page.locator('#manual').fill('51,12');
    await page.locator('#theme').click();
    await page.waitForFunction(() => window.saved.theme === 'light');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),'rgb(255, 255, 255)');
    assert.equal(await page.locator('img.badge').getAttribute('src'),'icons/icon128.png');
    assert.equal(await page.locator('#manual').inputValue(),'51,12');
    assert.equal(await page.evaluate(() => window.saved.manualRate),42.5);
    assert.equal(await page.evaluate(() => window.saved.language),'tr');
    await checkPopupFits('Turkish light manual mode');
    await page.evaluate(() => load());
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.locator('#mode label').filter({ hasText: 'Otomatik' }).click();
    await checkPopupFits('Turkish light automatic mode');
    await page.locator('[data-language="en"]').click();
    await page.waitForFunction(() => window.saved.language === 'en');
    assert.equal(await page.locator('#theme').getAttribute('aria-label'),'Switch to dark theme');
    assert.equal(await page.evaluate(() => window.saved.theme),'light');
    await checkPopupFits('English light automatic mode');
    await page.locator('#mode label').filter({ hasText: 'Manual' }).click();
    await checkPopupFits('English light manual mode');
    await page.locator('#theme').click();
    await page.waitForFunction(() => window.saved.theme === 'dark');
    assert.equal(await page.locator('img.badge').getAttribute('src'),'icons/icon128.png');
    assert.equal(await page.locator('#theme').getAttribute('aria-label'),'Switch to light theme');
    await checkPopupFits('English dark manual mode with theme control');
    console.log('PASS: theme persistence, neutral light/dark colors, translated theme labels, and preservation of language and form settings.');
    await page.emulateMedia({colorScheme:'light'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.emulateMedia({colorScheme:'dark'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.evaluate(() => { window.saved.theme = 'system'; });
    await page.evaluate(() => load());
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.equal(await page.locator('#theme .system').count(),0);
    await page.locator('#decimals').uncheck();
    await page.locator('.primary').click();
    await page.waitForFunction(() => window.saved.decimals === false);
    await page.evaluate(() => load());
    assert.equal(await page.locator('#decimals').isChecked(),false);
    await page.locator('#reset').click();
    await checkPopupFits('Manual mode with reset confirmation');
    await page.locator('#cancel-reset').click();
    assert.equal(await page.evaluate(() => window.saved.decimals),false);
    await page.locator('#reset').click();
    await page.locator('#reset').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Varsayılan ayarlara dönüldü.');
    assert.deepEqual(await page.evaluate(() => window.saved),{enabled:true,mode:'auto',manualRate:null,display:'replace',language:'tr',theme:'dark',decimals:true});
    assert.equal(await page.locator('#manual').inputValue(),'');
    assert.equal(await page.locator('#decimals').isChecked(),true);
    await checkPopupFits('Reset default settings');
    assert.equal(await page.locator('#rate-date').textContent(),'Kurun yayın tarihi: 1 Ekim');
    assert.equal(await page.locator('#refresh').isVisible(),true);
    await page.locator('.primary').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Kaydedildi');
    await page.waitForFunction(() => document.querySelector('#status').textContent === '', {timeout:5000});
    await page.evaluate(() => {
      status('saved');
      showRate({settings:window.saved,source:'ecb',rate:40,date:'2026-10-01',fetchedAt:window.checkedAt,error:'offline',stale:true});
    });
    assert.equal(await page.locator('#status').textContent(),'Kaydedildi');
    await checkPopupFits('Cached rate error');
    await page.waitForTimeout(3200);
    assert.equal(await page.locator('#status').textContent(),'Bağlantı kurulamadı. Son kayıtlı kur kullanılıyor.');
    await page.locator('[data-language="en"]').click();
    assert.equal(await page.locator('#rate-date').textContent(),'Rate published: October 1');
    assert.equal(await page.locator('#status').textContent(),'Could not connect. Using the last saved rate.');
    await checkPopupFits('English cached rate error');
    await page.evaluate(() => showRate({settings:window.saved,source:'ecb',rate:null,error:'offline'}));
    assert.equal(await page.locator('#rate-date').isVisible(),false);
    await page.locator('[data-language="tr"]').click();
    await page.evaluate(async () => {await load();status('');});
    console.log('PASS: visible localized publication date, hidden manual refresh, transient save notice and persistent localized errors.');
    await page.screenshot({path:artifactPath('popup-final.png'),fullPage:true});
    console.log('PASS: only light/dark themes remain, legacy system setting falls back to dark, OS changes do not alter theme, precision/version/reset still work.');
    console.log('PASS: popup validation and saving decimal-comma manual rate.');
  } finally { await browser.close(); }
}
(async () => { if (!process.argv.includes('--browser')) await workerTests(); if (!process.argv.includes('--unit')) await browserTests(); })().catch(error => { console.error(error); process.exitCode = 1; });
