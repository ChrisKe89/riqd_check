const test = require("node:test");
const assert = require("node:assert/strict");

const { summarizeSerialRows, shouldProcessRow } = require("../src/serialRows");

test("shouldProcessRow skips explicit Y values only", () => {
  assert.equal(shouldProcessRow({ RIQD_Connected: "Y" }), false);
  assert.equal(shouldProcessRow({ RIQD_Connected: " y " }), false);
  assert.equal(shouldProcessRow({ RIQD_Connected: "N" }), true);
  assert.equal(shouldProcessRow({ RIQD_Connected: "" }), true);
  assert.equal(shouldProcessRow({}), true);
});

test("summarizeSerialRows counts total, connected, and pending serials", () => {
  const rows = [
    { Serial: "600150", RIQD_Connected: "Y" },
    { Serial: "600267", RIQD_Connected: " y " },
    { Serial: "600486", RIQD_Connected: "" },
    { Serial: "600509", RIQD_Connected: "N" },
    { Serial: "", RIQD_Connected: "" }
  ];

  assert.deepEqual(summarizeSerialRows(rows, "Serial"), {
    totalSerials: 4,
    connectedSerials: 2,
    pendingChecks: 2
  });
});
