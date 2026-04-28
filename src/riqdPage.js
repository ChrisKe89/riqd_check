const connectedSignals = [
  { type: "text", value: "IQ Score History" },
  { type: "text", value: "Best Score" },
  { type: "text", value: "Worst Score" },
  { type: "text", value: "Average Score" }
];

const gotoTimeline = async (page, baseUrl) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
};

const searchSerial = async (page, serial) => {
  const input = page.locator("#serial-input");
  await input.waitFor({ state: "visible" });
  await input.fill("");
  await input.fill(String(serial));
  const searchButton = page.getByRole("button", { name: /^Search$/ });
  await Promise.all([
    page.waitForLoadState("networkidle").catch(() => {}),
    searchButton.click()
  ]);
};

const isConnected = async (page, waitMs) => {
  const deadline = Date.now() + waitMs;

  while (Date.now() < deadline) {
    for (const sig of connectedSignals) {
      if (sig.type === "text") {
        const loc = page.getByText(sig.value, { exact: false });
        if (await loc.first().isVisible().catch(() => false)) return true;
      }
    }
    await page.waitForTimeout(250);
  }

  return false;
};

module.exports = { gotoTimeline, searchSerial, isConnected };
