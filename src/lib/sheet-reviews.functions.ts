/**
 * Server function: load customer reviews from a public Google Sheet,
 * a direct CSV URL, or a public Excel (.xlsx) file (OneDrive/SharePoint share).
 *
 * Sheet columns (header row required):
 *   NAME | LOCATION | RATING | PRODUCT | REVIEW | DATE | PUBLISHED
 * PUBLISHED accepts blank / TRUE / YES / 1 as "show". FALSE / NO / 0 hides the row.
 */
import { createServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";

const DEFAULT_REVIEWS_URL = "";

function toFetchUrl(sheetUrl: string): string {
  const url = sheetUrl.trim();
  // Google Sheets → CSV export
  const g = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(url);
  if (g) return `https://docs.google.com/spreadsheets/d/${g[1]}/export?format=csv`;
  // OneDrive / SharePoint share links → direct file content
  if (/1drv\.ms\//i.test(url) || /onedrive\.live\.com\//i.test(url) || /sharepoint\.com\//i.test(url)) {
    const b64 = btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `https://api.onedrive.com/v1.0/shares/u!${b64}/root/content`;
  }
  return url;
}

async function getReviewsSourceUrl(): Promise<string> {
  try {
    const { serverPublicClient } = await import("@/lib/lovable-cloud-auth");
    const sb = serverPublicClient();
    const { data } = await sb.rpc("get_public_app_settings");
    const row = Array.isArray(data) ? data[0] : data;
    const raw = (row?.reviews_sheet_url as string | undefined) ?? "";
    return raw ? toFetchUrl(raw) : DEFAULT_REVIEWS_URL;
  } catch (e) {
    console.error("[getReviewsSourceUrl] failed:", e);
    return DEFAULT_REVIEWS_URL;
  }
}


export type SheetReview = {
  id: string;
  name: string;
  location: string;
  rating: number;
  product: string;
  body: string;
  date: string;
};

export type ReviewsPayload = {
  reviews: SheetReview[];
  fetchedAt: string;
  configured: boolean;
  error?: string;
};

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
        } else inQ = false;
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

function normalizeHeader(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

const CACHE_TTL_MS = 60_000;
let cache: { at: number; payload: ReviewsPayload } | null = null;
let inflight: Promise<ReviewsPayload> | null = null;

async function loadFromSheet(): Promise<ReviewsPayload> {
  const sourceUrl = await getReviewsSourceUrl();
  if (!sourceUrl) {
    return { reviews: [], fetchedAt: new Date().toISOString(), configured: false };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let rows: string[][];
    try {
      const res = await fetch(sourceUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`Sheet fetch failed (${res.status}).`);
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const looksXlsx =
        /sheet|excel|officedocument|octet-stream|binary/.test(ct) ||
        /\.xlsx(\?|$)/i.test(sourceUrl);
      if (looksXlsx) {
        const buf = await res.arrayBuffer();
        // Sniff for CSV vs xlsx (PK zip magic): 0x50 0x4B
        const head = new Uint8Array(buf.slice(0, 2));
        if (head[0] === 0x50 && head[1] === 0x4b) {
          const wb = XLSX.read(buf, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, blankrows: false, defval: "" }) as string[][];
        } else {
          rows = parseCsv(new TextDecoder().decode(buf));
        }
      } else {
        rows = parseCsv(await res.text());
      }
    } finally {
      clearTimeout(timeout);
    }

    rows = rows.filter((r) => r.some((c) => String(c || "").trim()));

    if (rows.length === 0)
      return { reviews: [], fetchedAt: new Date().toISOString(), configured: true };

    const s = (v: unknown) => (v == null ? "" : String(v));
    const header = rows[0].map((h) => normalizeHeader(s(h)));
    const findIdx = (exact: string[], contains: string[] = []) => {
      let i = header.findIndex((h) => exact.includes(h));
      if (i >= 0) return i;
      return header.findIndex((h) => contains.some((k) => h.includes(k)));
    };
    const iName = findIdx(["name", "customer", "customername"], ["yourname", "name"]);
    const iLoc = findIdx(["location", "city"], ["whereareyoufrom", "location", "city", "from"]);
    const iRating = findIdx(["rating", "stars", "score"], ["rating", "stars", "score"]);
    const iProduct = findIdx(["product", "productname", "item"], ["product", "service", "purchased"]);
    const iBody = findIdx(["review", "body", "message", "comment", "text"], ["review", "feedback", "comment", "message"]);
    const iDate = findIdx(["date", "month", "reviewdate", "timestamp"], ["timestamp", "date"]);
    const iPub = findIdx(
      ["published", "publish", "show", "visible", "active"],
      ["canwedisplay", "displayyourreview", "displayonwebsite", "publish", "display"],
    );

    const reviews: SheetReview[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = s(row[iName]).trim();
      const body = s(row[iBody]).trim();
      if (!name || !body) continue;

      if (iPub >= 0) {
        const p = s(row[iPub]).trim().toLowerCase();
        if (!/^(yes|y|true|1|show|on|publish|published)$/.test(p)) continue;
      }

      const ratingRaw = Number(s(row[iRating]).trim() || "5");
      const rating = Math.max(1, Math.min(5, Number.isFinite(ratingRaw) ? Math.round(ratingRaw) : 5));

      reviews.push({
        id: `r-${r}`,
        name,
        location: s(row[iLoc]).trim(),
        rating,
        product: s(row[iProduct]).trim(),
        body,
        date: s(row[iDate]).trim(),
      });
    }


    return { reviews, fetchedAt: new Date().toISOString(), configured: true };
  } catch (e) {
    console.error("[getSheetReviews] load failed:", e);
    return {
      reviews: [],
      fetchedAt: new Date().toISOString(),
      configured: true,
      error: e instanceof Error ? e.message : "Failed to load reviews",
    };
  }
}

export const getSheetReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReviewsPayload> => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) return cache.payload;
    if (!inflight) {
      inflight = loadFromSheet()
        .then((payload) => {
          if (!payload.error) cache = { at: Date.now(), payload };
          return payload;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  },
);
