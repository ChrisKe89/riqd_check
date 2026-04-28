const fs = require("fs");

const defaultSearchIdFactory = () =>
  String(Math.floor(1000000000000000 + Math.random() * 9000000000000000));

const hasAnalyses = (payload) => Array.isArray(payload?.analyses) && payload.analyses.length > 0;

const trimForError = (text, max = 500) => {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
};

const requireCsrfToken = (csrfToken) => {
  if (csrfToken) return csrfToken;
  throw new Error(
    "No CSRF token available. Set CSRF_TOKEN in .env from the captured x-csrftoken request header, then rerun pnpm run run."
  );
};

const cookieHeaderFromStorageState = (storageStatePath, baseUrl) => {
  const state = JSON.parse(fs.readFileSync(storageStatePath, "utf8"));
  const target = new URL(baseUrl);
  const cookies = (state.cookies || []).filter((cookie) => {
    const domain = String(cookie.domain || "").replace(/^\./, "");
    return target.hostname === domain || target.hostname.endsWith(`.${domain}`);
  });

  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
};

const csrfFromCookies = (cookieHeader) => {
  const cookies = Object.fromEntries(
    String(cookieHeader || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const eq = part.indexOf("=");
        return eq === -1 ? [part, ""] : [part.slice(0, eq), part.slice(eq + 1)];
      })
  );

  return (
    cookies.csrftoken ||
    cookies.csrf_token ||
    cookies.CSRFToken ||
    cookies.XSRF_TOKEN ||
    cookies["XSRF-TOKEN"] ||
    ""
  );
};

const createTimelineClient = ({
  baseUrl,
  cookies,
  csrfToken,
  fetchImpl = globalThis.fetch,
  searchIdFactory = defaultSearchIdFactory
}) => {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required. Use Node.js 18 or newer.");
  }

  const searchSerial = async (serial) => {
    const body = new URLSearchParams({
      product_name: "",
      serial_number: String(serial),
      date_sort: "print_date",
      paging: "false",
      search_id: searchIdFactory()
    });

    const response = await fetchImpl(baseUrl, {
      method: "POST",
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-GB,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        referer: baseUrl,
        "x-requested-with": "XMLHttpRequest",
        ...(csrfToken ? { "x-csrftoken": csrfToken } : {}),
        ...(cookies ? { cookie: cookies } : {})
      },
      body
    });

    if (!response.ok) {
      const details =
        typeof response.text === "function" ? trimForError(await response.text().catch(() => "")) : "";
      throw new Error(
        `Timeline search failed with HTTP ${response.status} ${response.statusText}${
          details ? `: ${details}` : ""
        }`
      );
    }

    return response.json();
  };

  return { searchSerial };
};

module.exports = {
  cookieHeaderFromStorageState,
  createTimelineClient,
  csrfFromCookies,
  hasAnalyses,
  requireCsrfToken
};
