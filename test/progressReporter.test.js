const test = require("node:test");
const assert = require("node:assert/strict");

const { LiveSerialProgress } = require("../src/progressReporter");

test("LiveSerialProgress renders summary, current check, and latest outcome", () => {
  let output = "";
  const stream = {
    isTTY: false,
    write: (chunk) => {
      output += chunk;
    }
  };
  const progress = new LiveSerialProgress({ stream });

  progress.start({ totalSerials: 4, connectedSerials: 2, pendingChecks: 2 });
  progress.checking({ current: 1, total: 2, serial: "600486", rowNumber: 3 });
  progress.result({ serial: "600486", connected: true, updated: 1, errors: 0 });

  assert.match(output, /Total Serials:\s+4/);
  assert.match(output, /RIQD Connected:\s+2/);
  assert.match(output, /Pending RIQD Checks:\s+2/);
  assert.match(output, /Checking:\s+1 of 2/);
  assert.match(output, /Serial:\s+600486 \(row 3\)/);
  assert.match(output, /Latest:\s+600486 -> connected/);
  assert.match(output, /Updated This Run:\s+1/);
});
