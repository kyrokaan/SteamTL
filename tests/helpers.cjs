const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const extensionDir = path.resolve(__dirname, '../extension');
function launchBrowser() {
  return chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_PATH ? { executablePath: process.env.TEST_BROWSER_PATH } : {}) });
}
function artifactPath(name) {
  const dir = path.resolve(__dirname, '../test-results');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
}
module.exports = { extensionDir, launchBrowser, artifactPath };
