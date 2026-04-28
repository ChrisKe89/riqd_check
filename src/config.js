const path = require("path");
require("dotenv").config();

const toBool = (v, d) => {
  if (v === undefined || v === null || v === "") return d;
  return String(v).toLowerCase() === "true";
};

const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

module.exports = {
  baseUrl: process.env.BASE_URL || "https://esps-fb-jp.fujifilm.com/iq/timeline",
  csvPath: process.env.CSV_PATH || "./data/riqd_serial.csv",
  headless: toBool(process.env.HEADLESS, true),
  slowMoMs: toInt(process.env.SLOW_MO_MS, 0),
  defaultTimeoutMs: toInt(process.env.DEFAULT_TIMEOUT_MS, 30000),
  csrfToken: process.env.CSRF_TOKEN || "",
  sessionInfoPath: path.resolve(process.env.SESSION_INFO_PATH || "./.riqd-session.json"),
  storageStatePath: path.resolve(process.env.STORAGE_STATE_PATH || "./storageState.json")
};
