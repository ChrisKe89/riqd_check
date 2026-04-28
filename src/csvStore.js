const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const readCsv = (filePath) => {
  const abs = path.resolve(filePath);
  const content = fs.readFileSync(abs, "utf8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: false
  });

  const headerLine = content.split(/\r?\n/).find((l) => l && l.trim().length > 0) || "";
  const headers = parse(headerLine, { columns: false, to_line: 1, bom: true, relax_quotes: true })[0] || [];

  return { absPath: abs, headers, records };
};

const writeCsv = (absPath, headers, records) => {
  const output = stringify(records, {
    header: true,
    columns: headers.length ? headers : undefined
  });
  fs.writeFileSync(absPath, output, "utf8");
};

const copyCsvToOutput = (sourcePath, outputDir) => {
  if (!outputDir) return "";

  const absSource = path.resolve(sourcePath);
  const destinationDir = path.resolve(outputDir);
  const destinationPath = path.join(destinationDir, path.basename(absSource));

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.copyFileSync(absSource, destinationPath);
  return destinationPath;
};

module.exports = { copyCsvToOutput, readCsv, writeCsv };
