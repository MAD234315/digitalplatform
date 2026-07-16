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


const SHEET_ID = "1TIUdOcKgAkx_I7ANlyDJaRRTQySDINf8NAAJfg47XlU";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export type Availability = "available" | "limited" | "out";
export type ProductBadge = "new" | "high-demand";

export type SheetProduct = {
  id: string;
  category: string;
  status: string;
  name: string;
  validity: string;
  plan: string;
  originalPrice: string;
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
        if (text[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
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

function cleanPrice(v: string): string {
  // Strip an existing ₹ prefix, trailing "/-", and whitespace, then re-prefix ₹
  // so callers can safely pass raw sheet values without doubling the symbol.
  const t = (v || "").trim().replace(/^₹\s*/, "").replace(/\/-\s*$/, "").trim();
  if (!t) return "";
  return `₹${t}`;
}

// Cross-request in-memory cache. On serverless workers this shares within an
// isolate, which still absorbs the burst of clients polling every 60s.
const CACHE_TTL_MS = 60_000;
let cache: { at: number; payload: ProductsPayload } | null = null;
let inflight: Promise<ProductsPayload> | null = null;

const FETCH_TIMEOUT_MS = 8_000;

/**
 * Fetch the sheet with a hard timeout so a slow/unresponsive upstream can't
 * pin a Worker request indefinitely. Classifies failures into a short set of
 * user-safe messages instead of leaking raw internals to the client.
 */
async function fetchSheetCsv(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(CSV_URL, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? "Stock sheet not found (404)."
          : res.status >= 500
            ? `Upstream sheet error (${res.status}). Please retry shortly.`
            : `Sheet fetch failed (${res.status}).`,
      );
    }
    return await res.text();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Sheet fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadFromSheet(): Promise<ProductsPayload> {
  try {
    const text = await fetchSheetCsv();
    const rows = parseCsv(text);

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
      if (/YOU ARE IN|NOTE|LAST UPDATED|WhatsApp Me|PLANS & PRICES|FOR OUR PRICES/i.test(name)) continue;
      if (!/^[A-Za-z0-9]/.test(name)) continue;

      const validity = (row[3] || "").trim();
      const plan = (row[4] || "").trim();
      const originalPrice = (row[6] || "").trim();
      const type = (row[7] || "").trim();
      const supports = (row[10] || "").trim();
      const warranty = (row[11] || "").trim();

      const statusVal = status || "IN-STOCK";
      const isOut = /\b(out\s*of\s*stock|not\s*in\s*stock|sold\s*out|unavailable)\b/i.test(statusVal);
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
        originalPrice: cleanPrice(originalPrice),
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
    return {
      categories: [],
      products: [],
      fetchedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : "Failed to load catalogue",
    };
  }
}

export const getSheetProducts = createServerFn({ method: "GET" }).handler(async (): Promise<ProductsPayload> => {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.payload;

  // Coalesce concurrent misses into a single upstream fetch
  if (!inflight) {
    inflight = loadFromSheet().then((payload) => {
      if (!payload.error) cache = { at: Date.now(), payload };
      return payload;
    }).finally(() => { inflight = null; });
  }
  return inflight;
});

