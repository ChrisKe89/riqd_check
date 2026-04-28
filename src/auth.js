const fs = require("fs");
const { chromium } = require("playwright");
const config = require("./config");
const { gotoTimeline } = require("./riqdPage");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: config.slowMoMs });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(config.defaultTimeoutMs);

  await gotoTimeline(page, config.baseUrl);

  await page.waitForTimeout(2000);
  await page.waitForFunction(() => document.readyState === "complete").catch(() => {});
  await page.waitForTimeout(2000);

  await page.pause();

  const state = await context.storageState();
  fs.writeFileSync(config.storageStatePath, JSON.stringify(state, null, 2), "utf8");
  await browser.close();

  process.stdout.write(`Saved storage state to: ${config.storageStatePath}\n`);
})().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});
