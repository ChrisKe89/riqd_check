const test = require("node:test");
const assert = require("node:assert/strict");

const { createTimelineClient, hasAnalyses, requireCsrfToken } = require("../src/riqdApi");

test("hasAnalyses returns true only when analyses are present", () => {
  assert.equal(hasAnalyses({ analyses: [{ id: 1 }] }), true);
  assert.equal(hasAnalyses({ analyses: [] }), false);
  assert.equal(hasAnalyses({}), false);
  assert.equal(hasAnalyses(null), false);
});

test("timeline client posts the expected serial search body", async () => {
  const calls = [];
  const client = createTimelineClient({
    baseUrl: "https://example.test/iq/timeline",
    cookies: "session=abc; csrftoken=token123",
    csrfToken: "token123",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => null },
        json: async () => ({ analyses: [{ serialNumber: "510061" }] })
      };
    },
    searchIdFactory: () => "5792743543537664"
  });

  const response = await client.searchSerial("510061");

  assert.equal(hasAnalyses(response), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://example.test/iq/timeline");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.cookie, "session=abc; csrftoken=token123");
  assert.equal(calls[0].init.headers["x-csrftoken"], "token123");
  assert.equal(
    calls[0].init.body.toString(),
    "product_name=&serial_number=510061&date_sort=print_date&paging=false&search_id=5792743543537664"
  );
});

test("timeline client includes response body details for failed searches", async () => {
  const client = createTimelineClient({
    baseUrl: "https://example.test/iq/timeline",
    cookies: "session=abc",
    fetchImpl: async () => ({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "The CSRF token is missing."
    }),
    searchIdFactory: () => "5792743543537664"
  });

  await assert.rejects(
    () => client.searchSerial("640014"),
    /Timeline search failed with HTTP 400 Bad Request: The CSRF token is missing\./
  );
});

test("requireCsrfToken reports how to configure a missing token", () => {
  assert.throws(
    () => requireCsrfToken(""),
    /No CSRF token available\. Set CSRF_TOKEN in \.env from the captured x-csrftoken request header/
  );
  assert.equal(requireCsrfToken("token123"), "token123");
});
