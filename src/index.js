const fs = require("fs");
const { chromium } = require("playwright");
const config = require("./config");
const { readCsv, writeCsv } = require("./csvStore");
const { gotoTimeline, searchSerial, isConnected } = require("./riqdPage");

const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());
const isNo = (v) => norm(v).toUpperCase() === "N";

(async () => {
  const { absPath, headers, records } = readCsv(config.csvPath);

  if (!headers.includes("RIQD_Connected")) {
    throw new Error("CSV must include a header column named RIQD_Connected");
  }

  const serialColumn =
    headers.find((h) => norm(h).toLowerCase() === "serial_number") ||
    headers.find((h) => norm(h).toLowerCase() === "serial") ||
    headers[0];

  const hasStorage = fs.existsSync(config.storageStatePath);
  const browser = await chromium.launch({ headless: config.headless, slowMo: config.slowMoMs });

  const context = await browser.newContext(
    hasStorage ? { storageState: config.storageStatePath } : {}
  );

  const page = await context.newPage();
  page.setDefaultTimeout(config.defaultTimeoutMs);

  await gotoTimeline(page, config.baseUrl);

  let updated = 0;
  let processed = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const connectedVal = row["RIQD_Connected"];

    if (!isNo(connectedVal)) continue;

    const serial = norm(row[serialColumn]);
    if (!serial) continue;

    processed++;

    try {
      await searchSerial(page, serial);
      const connected = await isConnected(page, config.resultWaitMs);

      if (connected) {
        row["RIQD_Connected"] = "Y";
        updated++;
        writeCsv(absPath, headers, records);
      }
    } catch (e) {
      process.stderr.write(`Row ${i + 1} serial ${serial} error: ${e?.message || e}\n`);
    }

    await page.waitForTimeout(250);
  }

  await context.close();
  await browser.close();

  process.stdout.write(`Processed: ${processed}\nUpdated to Y: ${updated}\nCSV: ${absPath}\n`);
})().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});
``