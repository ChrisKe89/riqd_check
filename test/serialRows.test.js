const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldProcessRow } = require("../src/serialRows");

test("shouldProcessRow skips explicit Y values only", () => {
  assert.equal(shouldProcessRow({ RIQD_Connected: "Y" }), false);
  assert.equal(shouldProcessRow({ RIQD_Connected: " y " }), false);
  assert.equal(shouldProcessRow({ RIQD_Connected: "N" }), true);
  assert.equal(shouldProcessRow({ RIQD_Connected: "" }), true);
  assert.equal(shouldProcessRow({}), true);
});
