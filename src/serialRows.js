const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());

const REQUIRED_CSV_HEADERS = ["Serial_Number", "Product_Code", "Product_Family", "RIQD_Connected"];

const isYes = (v) => norm(v).toUpperCase() === "Y";

const shouldProcessRow = (row) => !isYes(row?.RIQD_Connected);

const summarizeSerialRows = (records, serialColumn) =>
  records.reduce(
    (summary, row) => {
      if (!norm(row?.[serialColumn])) return summary;

      summary.totalSerials++;
      if (isYes(row?.RIQD_Connected)) {
        summary.connectedSerials++;
      } else {
        summary.pendingChecks++;
      }

      return summary;
    },
    { totalSerials: 0, connectedSerials: 0, pendingChecks: 0 }
  );

const findSerialColumn = (headers) =>
  headers.find((h) => norm(h).toLowerCase() === "serial_number") ||
  headers.find((h) => norm(h).toLowerCase() === "serial") ||
  headers[0];

const getRequiredCsvHeaderError = (headers) => {
  const headerSet = new Set(headers.map((h) => norm(h)));
  const missing = REQUIRED_CSV_HEADERS.filter((h) => !headerSet.has(h));

  if (!missing.length) return "";

  return `CSV must include header columns named ${REQUIRED_CSV_HEADERS.join(", ")}`;
};

module.exports = {
  REQUIRED_CSV_HEADERS,
  findSerialColumn,
  getRequiredCsvHeaderError,
  isYes,
  norm,
  shouldProcessRow,
  summarizeSerialRows
};
