const config = require("./config");
const { copyCsvToOutput, readCsv, writeCsv } = require("./csvStore");
const {
  cookieHeaderFromStorageState,
  createTimelineClient,
  csrfFromCookies,
  hasAnalyses,
  requireCsrfToken
} = require("./riqdApi");
const { LiveSerialProgress } = require("./progressReporter");
const { findSerialColumn, norm, shouldProcessRow, summarizeSerialRows } = require("./serialRows");
const { readSessionToken, resolveCsrfToken } = require("./sessionStore");

(async () => {
  const { absPath, headers, records } = readCsv(config.csvPath);

  if (!headers.includes("RIQD_Connected")) {
    throw new Error("CSV must include a header column named RIQD_Connected");
  }

  const serialColumn = findSerialColumn(headers);
  const summary = summarizeSerialRows(records, serialColumn);
  const progress = new LiveSerialProgress();

  progress.start(summary);

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
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    if (!shouldProcessRow(row)) continue;

    const serial = norm(row[serialColumn]);
    if (!serial) continue;

    processed++;
    progress.checking({
      current: processed,
      total: summary.pendingChecks,
      serial,
      rowNumber: i + 1
    });

    try {
      const response = await client.searchSerial(serial);
      const connected = hasAnalyses(response);

      if (connected) {
        row["RIQD_Connected"] = "Y";
        updated++;
        writeCsv(absPath, headers, records);
      }

      progress.result({ serial, connected, updated, errors });
    } catch (e) {
      errors++;
      progress.error({ serial, message: e?.message || e, updated, errors });
    }
  }

  const copiedPath = copyCsvToOutput(absPath, config.csvOutput);

  progress.finish({ updated, errors, csvPath: absPath, copiedPath });
})().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exitCode = 1;
});
