const config = require("./config");
const { readCsv, writeCsv } = require("./csvStore");
const {
  cookieHeaderFromStorageState,
  createTimelineClient,
  csrfFromCookies,
  hasAnalyses,
  requireCsrfToken
} = require("./riqdApi");
const { findSerialColumn, norm, shouldProcessRow } = require("./serialRows");
const { readSessionToken, resolveCsrfToken } = require("./sessionStore");

(async () => {
  const { absPath, headers, records } = readCsv(config.csvPath);

  if (!headers.includes("RIQD_Connected")) {
    throw new Error("CSV must include a header column named RIQD_Connected");
  }

  const serialColumn = findSerialColumn(headers);
  const cookies = cookieHeaderFromStorageState(config.storageStatePath, config.baseUrl);
  const csrfToken = requireCsrfToken(
    resolveCsrfToken({
      envToken: config.csrfToken,
      sessionToken: readSessionToken(config.sessionInfoPath),
      cookieToken: csrfFromCookies(cookies)
    })
  );
  const client = createTimelineClient({
    baseUrl: config.baseUrl,
    cookies,
    csrfToken
  });

  let updated = 0;
  let processed = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    if (!shouldProcessRow(row)) continue;

    const serial = norm(row[serialColumn]);
    if (!serial) continue;

    processed++;

    try {
      const response = await client.searchSerial(serial);
      const connected = hasAnalyses(response);

      if (connected) {
        row["RIQD_Connected"] = "Y";
        updated++;
        writeCsv(absPath, headers, records);
      }
    } catch (e) {
      process.stderr.write(`Row ${i + 1} serial ${serial} error: ${e?.message || e}\n`);
    }
  }

  process.stdout.write(`Processed: ${processed}\nUpdated to Y: ${updated}\nCSV: ${absPath}\n`);
})().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});
