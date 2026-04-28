const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());

const isYes = (v) => norm(v).toUpperCase() === "Y";

const shouldProcessRow = (row) => !isYes(row?.RIQD_Connected);

const findSerialColumn = (headers) =>
  headers.find((h) => norm(h).toLowerCase() === "serial_number") ||
  headers.find((h) => norm(h).toLowerCase() === "serial") ||
  headers[0];

module.exports = { findSerialColumn, isYes, norm, shouldProcessRow };
