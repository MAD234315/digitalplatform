/**
 * Server function: load the live product catalogue from a public Google Sheet.
 *
 * The sheet is exported as CSV, parsed row-by-row into typed
 * {@link SheetProduct} entries, and grouped into categories using uppercase
 * heading rows as delimiters. Availability and badges are inferred from the
 * status column using regex heuristics.
 *
 * A module-level LRU-of-one cache (60s TTL) plus an in-flight promise
 * collapse concurrent requests into a single upstream fetch — protecting the
 * upstream sheet when many browser tabs poll on the same 60s cadence.
 */
import { createServerFn } from "@tanstack/react-start";

// No hardcoded fallback: the catalogue source is whatever URL the admin has
// saved in app_settings.sheet_url. If it's blank, the catalogue is empty and
// the admin panel reflects the same "not set" state — no hidden defaults.

/**
 * Turn any supported spreadsheet URL into a fetchable content URL.
 *  - Google Sheets → CSV export.
 *  - OneDrive share (1drv.ms / onedrive.live.com) → shares content endpoint.
 *  - SharePoint or a direct .xlsx URL → the link itself.
 */
function toFetchUrl(sheetUrl: string): string {
  const url = sheetUrl.trim();
  const g = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  if (g) return `https://docs.google.com/spreadsheets/d/${g[1]}/export?format=csv`;
  if (/1drv\.ms\//i.test(url) || /onedrive\.live\.com\//i.test(url)) {
    const b64 = btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `https://api.onedrive.com/v1.0/shares/u!${b64}/root/content`;
  }
  return url;
}

let cachedUrl: { at: number; url: string } | null = null;
const URL_TTL = 30_000;

async function getPublicAppSettings(): Promise<{ sheet_url: string | null; site_online: boolean } | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await sb.rpc("get_public_app_settings");
    const row = Array.isArray(data) ? data[0] : data;
    return row ?? null;
  } catch {
    return null;
  }
}

async function resolveFetchUrl(): Promise<string | null> {
  const now = Date.now();
  if (cachedUrl && now - cachedUrl.at < URL_TTL) return cachedUrl.url || null;
  const row = await getPublicAppSettings();
  const url2 = row?.sheet_url ? toFetchUrl(row.sheet_url) : "";
  cachedUrl = { at: now, url: url2 };
  return url2 || null;
}

export type Availability = "available" | "limited" | "out";
export type ProductBadge = "new" | "high-demand";

export type SheetProduct = {
  id: string;
  category: string;
  status: string;
  name: string;
  validity: string;
  plan: string;

  type: string;
  supports: string;
  warranty: string;
  inStock: boolean;
  loot: boolean;
  availability: Availability;
  badges: ProductBadge[];
};

export type ProductsPayload = {
  categories: { name: string; count: number }[];
  products: SheetProduct[];
  fetchedAt: string;
  error?: string;
  /** True when the current payload is being served from cache because upstream is rate-limited (HTTP 429). */
  rateLimited?: boolean;
  /** True when the site has been switched Offline in the admin panel. */
  maintenance?: boolean;
};

// Minimal RFC 4180 CSV row parser (handles quoted commas & escaped quotes)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        /* skip */
      } else cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function isCategoryHeader(row: string[]): boolean {
  // Category header rows: first cell is an uppercase heading with at least
  // one letter, and the rest of the cells are empty.
  const first = (row[0] || "").trim();
  if (!first) return false;
  if (!/[A-Z]/.test(first)) return false; // must contain a letter
  if (first.toUpperCase() !== first) return false; // and be fully uppercase
  const restEmpty = row.slice(1).every((c) => !(c || "").trim());
  return restEmpty && first.length > 3 && !first.includes(",");
}

function isTableHeader(row: string[]): boolean {
  const first = (row[0] || "").trim().toUpperCase();
  return first === "STATUS" || first === "PRODUCT STATUS";
}

// Cross-request in-memory cache. On serverless workers this shares within an
// isolate, which still absorbs the burst of clients polling every 60s.
const CACHE_TTL_MS = 60_000;
let cache: { at: number; payload: ProductsPayload } | null = null;
let inflight: Promise<ProductsPayload> | null = null;

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 1; // one polite retry on 429 / 503
const MAX_RETRY_WAIT_MS = 4_000; // cap Retry-After to keep the Worker snappy
const RESPONSE_MAX_BYTES = 2_000_000; // 2 MB hard cap on CSV size (OOM guard)

/**
 * Custom error carrying a machine-readable status so callers can react to
 * rate-limits (429) or upstream 5xx without regex-matching the message.
 */
class SheetFetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "SheetFetchError";
  }
}

/**
 * Parse a `Retry-After` header. RFC 7231 allows either delta-seconds or
 * an HTTP-date; we support both and clamp the result to `MAX_RETRY_WAIT_MS`.
 * Returns `undefined` when the header is missing or unparseable.
 */
function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();
  const asSeconds = Number(trimmed);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, MAX_RETRY_WAIT_MS);
  }
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    return Math.min(Math.max(dateMs - Date.now(), 0), MAX_RETRY_WAIT_MS);
  }
  return undefined;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Fetch the sheet with a hard timeout, size cap, and one polite retry on
 * transient failures (429 rate-limit, 503 service-unavailable). Honours
 * `Retry-After` when present, otherwise applies a short jittered backoff.
 * Classifies failures into a short set of user-safe messages instead of
 * leaking raw internals to the client.
 */
async function fetchSheetRows(): Promise<string[][]> {
  const fetchUrl = await resolveFetchUrl();
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(fetchUrl, { signal: controller.signal, redirect: "follow" });

      if (!res.ok) {
        const retryable = res.status === 429 || res.status === 503;
        const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));

        if (retryable && attempt < MAX_RETRIES) {
          const waitMs = retryAfterMs ?? 500 + Math.floor(Math.random() * 400);
          attempt++;
          clearTimeout(timeout);
          await sleep(waitMs);
          continue;
        }

        const message =
          res.status === 429
            ? "Catalogue is being rate-limited. Please retry shortly."
            : res.status === 404
              ? "Stock sheet not found (404)."
              : res.status >= 500
                ? `Upstream sheet error (${res.status}). Please retry shortly.`
                : `Sheet fetch failed (${res.status}).`;
        throw new SheetFetchError(message, res.status, retryAfterMs);
      }

      // Size-guarded read: stream the body and abort if it exceeds the cap.
      const reader = res.body?.getReader();
      let bytes: Uint8Array;
      if (!reader) {
        bytes = new Uint8Array(await res.arrayBuffer());
      } else {
        const chunks: Uint8Array[] = [];
        let total = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > RESPONSE_MAX_BYTES) {
            controller.abort();
            throw new SheetFetchError("Sheet response too large.", 413);
          }
          chunks.push(value);
        }
        bytes = chunks.length === 1 ? chunks[0] : concatChunks(chunks, total);
      }

      // Detect Excel .xlsx (ZIP magic: PK\x03\x04) vs CSV/text.
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const looksXlsx =
        (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) ||
        /sheet|excel|officedocument|spreadsheetml/.test(ct) ||
        /\.xlsx(\?|$)/i.test(fetchUrl);

      if (looksXlsx && bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(bytes, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          blankrows: false,
          defval: "",
        }) as unknown[][];
        return rows.map((r) => r.map((c) => (c == null ? "" : String(c))));
      }

      return parseCsv(new TextDecoder("utf-8").decode(bytes));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new SheetFetchError(`Sheet fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s.`, 408);
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }
}


function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function loadFromSheet(): Promise<ProductsPayload> {
  try {
    const rows = await fetchSheetRows();

    const products: SheetProduct[] = [];
    let currentCategory = "General";
    let idx = 0;

    for (const row of rows) {
      if (!row || row.every((c) => !(c || "").trim())) continue;

      if (isCategoryHeader(row)) {
        currentCategory = (row[0] || "").trim();
        continue;
      }
      if (isTableHeader(row)) continue;

      const status = (row[0] || "").trim();
      const name = (row[2] || "").trim();
      if (!name) continue;
      if (name.length > 60) continue;
      if (/YOU ARE IN|NOTE|LAST UPDATED|WhatsApp Me|PLANS & PRICES|FOR OUR PRICES/i.test(name))
        continue;
      if (!/^[A-Za-z0-9]/.test(name)) continue;

      // Sheet columns:
      // 0 STATUS · 1 S.NO · 2 PRODUCT · 3 VALIDITY · 4 PLAN · 5 OUR PRICE
      // 6 ACTIVATION TYPE · 7 DEVICES LIMIT · 8 USE AT ONCE · 9 SUPPORTS · 10 WARRANTY
      const validity = (row[3] || "").trim();
      const plan = (row[4] || "").trim();
      const type = (row[6] || "").trim();
      const supports = (row[9] || "").trim();
      const warranty = (row[10] || "").trim();

      const statusVal = status || "IN-STOCK";
      const isOut = /\b(out\s*of\s*stock|not\s*in\s*stock|sold\s*out|unavailable)\b/i.test(
        statusVal,
      );
      const isLimited = /\b(limited|low\s*stock|few\s*left|almost\s*(out|gone))\b/i.test(statusVal);
      const inStock = !isOut && /\bin[\s-]?stock\b/i.test(statusVal);
      const loot = /\bloot\b/i.test(statusVal);
      const isHighDemand = /\b(high\s*demand|hot|trending|popular|🔥)\b/i.test(statusVal) || loot;
      const isNew = /\b(new|just\s*added|fresh|🆕)\b/i.test(statusVal);

      const availability: Availability = isOut ? "out" : isLimited ? "limited" : "available";
      const badges: ProductBadge[] = [];
      if (isNew) badges.push("new");
      if (isHighDemand) badges.push("high-demand");

      products.push({
        id: `p-${idx++}`,
        category: currentCategory,
        status: statusVal,
        name,
        validity,
        plan,

        type,
        supports,
        warranty,
        inStock: inStock || (!isOut && !isLimited),
        loot,
        availability,
        badges,
      });
    }

    const catMap = new Map<string, number>();
    for (const p of products) catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
    const categories = [...catMap.entries()].map(([name, count]) => ({ name, count }));

    return { categories, products, fetchedAt: new Date().toISOString() };
  } catch (e) {
    // Log the raw error server-side so it appears in Server Logs with a stack.
    // The `error` field in the payload is what surfaces in the UI banner —
    // keep it terse and safe for end-user display.
    console.error("[getSheetProducts] load failed:", e);
    const rateLimited = e instanceof SheetFetchError && e.status === 429;
    return {
      categories: [],
      products: [],
      fetchedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : "Failed to load catalogue",
      rateLimited,
    };
  }
}

async function isSiteOnline(): Promise<boolean> {
  const row = await getPublicAppSettings();
  return row?.site_online ?? true; // fail-open
}

export const getSheetProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductsPayload> => {
    // Honour the admin Website Status toggle — when Offline, don't scan the sheet.
    if (!(await isSiteOnline())) {
      return {
        categories: [],
        products: [],
        fetchedAt: new Date().toISOString(),
        maintenance: true,
      };
    }

    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) return cache.payload;

    // Coalesce concurrent misses into a single upstream fetch. On failure —
    // especially 429 rate-limits — fall back to the last successful cache
    // (even if stale) so the UI stays populated instead of going blank.
    if (!inflight) {
      inflight = loadFromSheet()
        .then((payload) => {
          if (!payload.error) {
            cache = { at: Date.now(), payload };
            return payload;
          }
          if (payload.rateLimited && cache) {
            // Serve stale cache during a rate-limit window; flag it so the UI
            // can show a subtle "using cached data" hint.
            return { ...cache.payload, rateLimited: true, error: payload.error };
          }
          return payload;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  },
);
