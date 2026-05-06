const color = (code, text, enabled) => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text);

class LiveSerialProgress {
  constructor({ stream = process.stdout } = {}) {
    this.stream = stream;
    this.isTTY = Boolean(stream.isTTY);
    this.renderedLines = 0;
    this.state = {
      summary: { totalSerials: 0, connectedSerials: 0, pendingChecks: 0 },
      checking: { current: 0, total: 0, serial: "", rowNumber: 0 },
      latest: "waiting",
      updated: 0,
      errors: 0
    };
  }

  start(summary) {
    this.state.summary = summary;
    this.render();
  }

  checking({ current, total, serial, rowNumber }) {
    this.state.checking = { current, total, serial, rowNumber };
    this.render();
  }

  result({ serial, connected, updated, errors }) {
    this.state.latest = `${serial} -> ${connected ? "connected" : "not connected"}`;
    this.state.updated = updated;
    this.state.errors = errors;
    this.render();
  }

  error({ serial, message, updated, errors }) {
    this.state.latest = `${serial} -> error: ${message}`;
    this.state.updated = updated;
    this.state.errors = errors;
    this.render();
  }

  finish({ updated, errors, csvPath, copiedPath }) {
    this.state.updated = updated;
    this.state.errors = errors;
    this.state.latest = "complete";
    this.render();
    this.write(`CSV: ${csvPath}\n`);
    if (copiedPath) this.write(`Copied CSV to: ${copiedPath}\n`);
  }

  render() {
    const lines = this.lines();

    if (this.isTTY && this.renderedLines > 0) {
      this.write(`\x1b[${this.renderedLines}F\x1b[J`);
    }

    this.write(`${lines.join("\n")}\n`);
    this.renderedLines = lines.length;
  }

  lines() {
    const { summary, checking, latest, updated, errors } = this.state;
    const title = color("1;36", "RIQD Serial Check", this.isTTY);
    const pending = color("33", String(summary.pendingChecks), this.isTTY);
    const connected = color("32", String(summary.connectedSerials), this.isTTY);
    const current = checking.total ? `${checking.current} of ${checking.total}` : "0 of 0";
    const serial = checking.serial ? `${checking.serial} (row ${checking.rowNumber})` : "-";

    return [
      title,
      `Total Serials:        ${summary.totalSerials}`,
      `RIQD Connected:       ${connected}`,
      `Pending RIQD Checks:  ${pending}`,
      `Checking:             ${current}`,
      `Serial:               ${serial}`,
      `Latest:               ${latest}`,
      `Updated This Run:     ${updated}`,
      `Errors:               ${errors}`
    ];
  }

  write(chunk) {
    this.stream.write(chunk);
  }
}

module.exports = { LiveSerialProgress };
