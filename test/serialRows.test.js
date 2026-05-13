const test = require("node:test");
const assert = require("node:assert/strict");

const { getRequiredCsvHeaderError, summarizeSerialRows, shouldProcessRow } = require("../src/serialRows");

test("getRequiredCsvHeaderError accepts the new CSV schema", () => {
  assert.equal(
    getRequiredCsvHeaderError(["Serial_Number", "Product_Code", "Product_Family", "RIQD_Connected"]),
    ""
  );
});

test("getRequiredCsvHeaderError rejects the old CSV schema", () => {
  assert.equal(
    getRequiredCsvHeaderError(["Serial", "Model", "RIQD_Connected"]),
    "CSV must include header columns named Serial_Number, Product_Code, Product_Family, RIQD_Connected"
  );
});

test("shouldProcessRow skips explicit Y values only", () => {
  assert.equal(shouldProcessRow({ RIQD_Connected: "Y" }), false);
  assert.equal(shouldProcessRow({ RIQD_Connected: " y " }), false);
  assert.equal(shouldProcessRow({ RIQD_Connected: "N" }), true);
  assert.equal(shouldProcessRow({ RIQD_Connected: "" }), true);
  assert.equal(shouldProcessRow({}), true);
});

test("summarizeSerialRows counts total, connected, and pending serials", () => {
  const rows = [
    { Serial_Number: "600150", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "Y" },
    { Serial_Number: "600267", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: " y " },
    { Serial_Number: "600486", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "" },
    { Serial_Number: "600509", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "N" },
    { Serial_Number: "", Product_Code: "KO", Product_Family: "OLINA", RIQD_Connected: "" }
  ];

  assert.deepEqual(summarizeSerialRows(rows, "Serial_Number"), {
    totalSerials: 4,
    connectedSerials: 2,
    pendingChecks: 2
  });
});
