const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());

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

module.exports = { findSerialColumn, isYes, norm, shouldProcessRow, summarizeSerialRows };
