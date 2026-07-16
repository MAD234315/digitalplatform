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

async function loadFromSheet(): Promise<ProductsPayload> {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const text = await res.text();
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

      products.push({
        id: `p-${idx++}`,
        category: currentCategory,
        status: status || "IN-STOCK",
        name,
        validity,
        plan,
        originalPrice: cleanPrice(originalPrice),
        type,
        supports,
        warranty,
        inStock: /\bin[\s-]?stock\b/i.test(status) && !/\bnot\s+in\b/i.test(status),
        loot: /\bloot\b/i.test(status),
      });
    }

    const catMap = new Map<string, number>();
    for (const p of products) catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
    const categories = [...catMap.entries()].map(([name, count]) => ({ name, count }));

    return { categories, products, fetchedAt: new Date().toISOString() };
  } catch (e) {
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

