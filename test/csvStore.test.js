const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { copyCsvToOutput, readCsv, writeCsv } = require("../src/csvStore");

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "riqd-csv-"));

test("copyCsvToOutput copies the CSV into an output directory", () => {
  const dir = tempDir();
  const source = path.join(dir, "riqd_serial.csv");
  const outputDir = path.join(dir, "out");
  fs.writeFileSync(source, "Serial_Number,Product_Code,Product_Family,RIQD_Connected\n640014,KO,OLINA,Y\n", "utf8");

  const copiedPath = copyCsvToOutput(source, outputDir);

  assert.equal(copiedPath, path.join(outputDir, "riqd_serial.csv"));
  assert.equal(fs.readFileSync(copiedPath, "utf8"), fs.readFileSync(source, "utf8"));
});

test("copyCsvToOutput returns empty string when no output path is configured", () => {
  assert.equal(copyCsvToOutput("source.csv", ""), "");
});

test("readCsv reads the new CSV schema headers and records", () => {
  const dir = tempDir();
  const source = path.join(dir, "riqd_serial.csv");
  fs.writeFileSync(
    source,
    "Serial_Number,Product_Code,Product_Family,RIQD_Connected\n640014,KO,OLINA,Y\n640029,KO,OLINA,\n",
    "utf8"
  );

  const csv = readCsv(source);

  assert.deepEqual(csv.headers, ["Serial_Number", "Product_Code", "Product_Family", "RIQD_Connected"]);
  assert.deepEqual(csv.records, [
    { Serial_Number: "640014", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "Y" },
    { Serial_Number: "640029", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "" }
  ]);
});

test("writeCsv preserves the new CSV schema columns", () => {
  const dir = tempDir();
  const source = path.join(dir, "riqd_serial.csv");
  const headers = ["Serial_Number", "Product_Code", "Product_Family", "RIQD_Connected"];
  const records = [{ Serial_Number: "640029", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "Y" }];

  writeCsv(source, headers, records);

  assert.equal(fs.readFileSync(source, "utf8"), "Serial_Number,Product_Code,Product_Family,RIQD_Connected\n640029,KO,OLINA,Y\n");
});
