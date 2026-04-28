const fs = require("fs");
const path = require("path");

const norm = (v) => (v === undefined || v === null ? "" : String(v).trim());

const readSessionToken = (sessionPath) => {
  if (!fs.existsSync(sessionPath)) return "";

  const content = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  return norm(content.csrfToken);
};

const resolveCsrfToken = ({ envToken, sessionToken, cookieToken }) =>
  norm(envToken) || norm(sessionToken) || norm(cookieToken);

const writeSessionToken = (sessionPath, { csrfToken, source, capturedAt = new Date().toISOString() }) => {
  const token = norm(csrfToken);
  if (!token) {
    throw new Error("Cannot save an empty CSRF token");
  }

  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
  fs.writeFileSync(
    sessionPath,
    JSON.stringify(
      {
        csrfToken: token,
        source,
        capturedAt
      },
      null,
      2
    ),
    "utf8"
  );
};

module.exports = { readSessionToken, resolveCsrfToken, writeSessionToken };
