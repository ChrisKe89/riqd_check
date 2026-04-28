const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { copyCsvToOutput } = require("../src/csvStore");

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "riqd-csv-"));

test("copyCsvToOutput copies the CSV into an output directory", () => {
  const dir = tempDir();
  const source = path.join(dir, "riqd_serial.csv");
  const outputDir = path.join(dir, "out");
  fs.writeFileSync(source, "Serial_Number,RIQD_Connected\n640014,Y\n", "utf8");

  const copiedPath = copyCsvToOutput(source, outputDir);

  assert.equal(copiedPath, path.join(outputDir, "riqd_serial.csv"));
  assert.equal(fs.readFileSync(copiedPath, "utf8"), fs.readFileSync(source, "utf8"));
});

test("copyCsvToOutput returns empty string when no output path is configured", () => {
  assert.equal(copyCsvToOutput("source.csv", ""), "");
});
