const fs = require("fs");
const { chromium } = require("playwright");
const config = require("./config");
const { gotoTimeline } = require("./riqdPage");
const { writeSessionToken } = require("./sessionStore");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: config.slowMoMs });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(config.defaultTimeoutMs);

  let capturedCsrfToken = "";
  page.on("request", (request) => {
    if (request.method() !== "POST") return;

    const requestUrl = new URL(request.url());
    const timelineUrl = new URL(config.baseUrl);
    if (requestUrl.origin !== timelineUrl.origin || requestUrl.pathname !== timelineUrl.pathname) return;

    const token = request.headers()["x-csrftoken"];
    if (token) capturedCsrfToken = token;
  });

  await gotoTimeline(page, config.baseUrl);

  await page.waitForTimeout(2000);
  await page.waitForFunction(() => document.readyState === "complete").catch(() => {});
  await page.waitForTimeout(2000);

  process.stdout.write("Log in, perform one serial search, then click Resume in Playwright Inspector.\n");

  await page.pause();

  const state = await context.storageState();
  fs.writeFileSync(config.storageStatePath, JSON.stringify(state, null, 2), "utf8");
  if (capturedCsrfToken) {
    writeSessionToken(config.sessionInfoPath, {
      csrfToken: capturedCsrfToken,
      source: "iq/timeline request"
    });
  }
  await browser.close();

  process.stdout.write(`Saved storage state to: ${config.storageStatePath}\n`);
  if (capturedCsrfToken) {
    process.stdout.write(`Saved RIQD session token to: ${config.sessionInfoPath}\n`);
  } else {
    process.stderr.write(
      "No x-csrftoken was captured. Run auth again and perform one serial search before clicking Resume.\n"
    );
  }
})().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});
