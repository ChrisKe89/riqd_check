const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  readSessionToken,
  resolveCsrfToken,
  writeSessionToken
} = require("../src/sessionStore");

const tempFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "riqd-session-")), "session.json");

test("writeSessionToken persists token metadata and readSessionToken reads it back", () => {
  const filePath = tempFile();

  writeSessionToken(filePath, {
    csrfToken: "captured-token",
    source: "request",
    capturedAt: "2026-04-28T00:00:00.000Z"
  });

  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(content.csrfToken, "captured-token");
  assert.equal(content.source, "request");
  assert.equal(content.capturedAt, "2026-04-28T00:00:00.000Z");
  assert.equal(readSessionToken(filePath), "captured-token");
});

test("readSessionToken returns empty string for missing or tokenless files", () => {
  const filePath = tempFile();
  assert.equal(readSessionToken(filePath), "");

  fs.writeFileSync(filePath, JSON.stringify({ capturedAt: "2026-04-28T00:00:00.000Z" }), "utf8");
  assert.equal(readSessionToken(filePath), "");
});

test("resolveCsrfToken prefers env token, then session token, then cookie token", () => {
  assert.equal(
    resolveCsrfToken({
      envToken: "env-token",
      sessionToken: "session-token",
      cookieToken: "cookie-token"
    }),
    "env-token"
  );
  assert.equal(
    resolveCsrfToken({
      envToken: "",
      sessionToken: "session-token",
      cookieToken: "cookie-token"
    }),
    "session-token"
  );
  assert.equal(
    resolveCsrfToken({
      envToken: "",
      sessionToken: "",
      cookieToken: "cookie-token"
    }),
    "cookie-token"
  );
});
