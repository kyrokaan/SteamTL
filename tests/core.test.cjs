const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const context = vm.createContext({ Intl });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension/core.js'), 'utf8'), context);
const { parseUSD, formatTRY, validRate } = context.SteamTL;

for (const [input, expected] of [
  ['$19.99', 19.99], ['US$19.99', 19.99], ['USD 19.99', 19.99], ['19.99 USD', 19.99],
  ['$1,299.99', 1299.99], ['$19,99', 19.99], ['1.299,99 USD', 1299.99],
  ['USD 12.50', 12.5], ['12.50 USD', 12.5], ['$0.08 USD', 0.08], ['$0.00', 0],
  ['\u2066$16.79\u2069', 16.79], ['$\u202f16.79', 16.79],
]) test(`USD parsing: ${JSON.stringify(input)}`, () => assert.equal(parseUSD(input), expected));

for (const input of ['€19.99', '£19.99', 'CDN$19.99', 'A$19.99', 'HK$19.99',
  '19.99', 'Free', 'Save $10', 'Buy for $19.99', '-50%', '19,99 TL', '$1.2.3', '$-1', '']) {
  test(`Reject non-USD price: ${JSON.stringify(input)}`, () => assert.equal(parseUSD(input), null));
}

test('TRY conversion and Turkish separators', () => assert.equal(formatTRY(19.99, 40), '₺799,60'));
test('Whole-lira rounding', () => assert.equal(formatTRY(19.99, 40, false), '₺800'));
test('Decimal rounding at the half-cent boundary', () => assert.equal(formatTRY(0.29, 50), '₺14,50'));
test('Zero price', () => assert.equal(formatTRY(0, 49.1448), '₺0,00'));
test('Rate validation', () => {
  assert.equal(validRate(49.12), true);
  for (const value of [0, -1, NaN, Infinity, null, '49.12']) assert.equal(validRate(value), false);
});
