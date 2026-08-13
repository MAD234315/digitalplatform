/**
 * Server function: load customer reviews from a public Google Sheet,
 * a direct CSV URL, or a public Excel (.xlsx) file (OneDrive/SharePoint share).
 *
 * Sheet columns (header row required):
 *   NAME | LOCATION | RATING | PRODUCT | REVIEW | DATE | PUBLISHED
 * Approval is manual: a row is shown ONLY when PUBLISHED is YES / TRUE / 1 / SHOW.
 * Blank, NO, FALSE, 0 — or a missing PUBLISHED column — hides the row.
 */
import { createServerFn } from "@tanstack/react-start";

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
  formattedDate: string;
  tenure: string;
  liked: string;
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

const CACHE_TTL_MS = 10_000;
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
          const XLSX = await import("xlsx");
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
    const findAllIdx = (exact: string[], contains: string[] = []) =>
      header
        .map((h, i) => (exact.includes(h) || contains.some((k) => h.includes(k)) ? i : -1))
        .filter((i) => i >= 0);

    const iName = findIdx(["name", "customer", "customername", "yourname"], ["yourname", "name"]);
    const iLoc = findIdx(
      ["location", "city", "whereareyoufrom", "currentlocation", "currentlocationcitycountry"],
      ["whereareyoufrom", "whereyoufrom", "currentlocation", "location", "city", "country"],
    );
    const iRating = findIdx(
      ["rating", "stars", "score", "ratingoutof5"],
      ["ratingoutof", "rating", "rateyouroverall", "rateyourexperience", "howwouldyourate", "stars", "score"],
    );

    const iProduct = findIdx(
      ["product", "productname", "item", "productsorservicespurchased"],
      ["productsorservices", "purchasedfromus", "purchasedfrom", "product", "service", "purchased"],
    );
    const iBody = findIdx(["review", "body", "message", "comment", "text", "feedback"], ["honestreview", "reviewor", "review", "feedback", "comment", "message"]);
    const iDate = findIdx(["date", "month", "reviewdate", "timestamp"], ["timestamp", "date"]);
    const iPub = findIdx(["published", "publish", "show", "visible", "active", "publishyesno"], ["publish"]);
    const iTenure = findIdx(
      ["tenure", "customersince", "howlong", "yearswithus"],
      ["howlonghaveyoubeen", "howlong", "customerof", "yearswith", "since", "tenure"],
    );
    // Google Forms can end up with several "What did you like most…" columns
    // (question edited/duplicated), and a renamed header can degrade to a
    // generic "Column 6" / blank label. Collect every candidate column.
    const likedIdxs = findAllIdx(
      ["liked", "likedmost", "whatdidyoulikemost", "highlight"],
      ["likedmost", "whatdidyoulike", "likeabout", "liked", "highlight", "favorite"],
    );
    // Fallback: the column right after the rating, when its header is generic
    // ("Column 6", unnamed) and it isn't already mapped to another field.
    const mapped = new Set([iName, iLoc, iRating, iProduct, iBody, iDate, iPub, iTenure, ...likedIdxs]);
    const after = iRating >= 0 ? iRating + 1 : -1;
    if (
      after > 0 &&
      after < header.length &&
      !mapped.has(after) &&
      /^(|column\d*|untitled\d*)$/.test(header[after])
    ) {
      likedIdxs.push(after);
    }
    const pickLiked = (row: string[]): string => {
      for (const i of likedIdxs) {
        const v = s(row[i]).trim();
        // Skip consent-style answers that can land in a mis-mapped duplicate column
        if (!v || /^(yes|no|y|n|na|n\/a|\.|-)$/i.test(v)) continue;
        return v;
      }
      return "";
    };


    const formatReadableDate = (ts: number): string => {
      const d = new Date(ts);
      const day = d.getDate();
      const month = d.toLocaleString("en-GB", { month: "short" });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    };

    const parseWhen = (v: string): number => {
      const t = v.trim();
      if (!t) return -Infinity;
      // Sheet format is DD/MM/YYYY [hh:mm[:ss]] [AM/PM] — parse it first so that
      // dates like 05/08/2026 are read as 5 August, not 8 May.
      const m = t.match(
        /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/,
      );
      if (m) {
        const [, d, mo, y, hh = "0", mm = "0", ss = "0", ap] = m;
        let hours = Number(hh);
        if (ap) {
          const pm = ap.toLowerCase() === "pm";
          hours = hours % 12 + (pm ? 12 : 0);
        }
        const year = Number(y) < 100 ? 2000 + Number(y) : Number(y);
        const day = Number(d);
        const month = Number(mo);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const dt = new Date(year, month - 1, day, hours, Number(mm), Number(ss));
          const ms = dt.getTime();
          if (Number.isFinite(ms)) return ms;
        }
      }
      // ISO / other native-parseable formats
      const n = Date.parse(t);
      if (Number.isFinite(n)) return n;
      return -Infinity;
    };


    const reviews: (SheetReview & { _row: number; _when: number })[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = s(row[iName]).trim();
      const body = s(row[iBody]).trim();
      if (!name || !body) continue;

      // Manual approval: every review must be explicitly approved in the sheet.
      if (iPub < 0) continue;
      const p = s(row[iPub]).trim().toLowerCase();
      if (!/^(yes|y|true|1|show|on|publish|published|approved)$/.test(p)) continue;

      const ratingRaw = Number(s(row[iRating]).trim() || "5");
      const rating = Math.max(1, Math.min(5, Number.isFinite(ratingRaw) ? Math.round(ratingRaw) : 5));
      const rawDate = iDate >= 0 ? s(row[iDate]).trim() : "";

      const when = parseWhen(rawDate);
      reviews.push({
        id: `r-${r}`,
        name,
        location: s(row[iLoc]).trim(),
        rating,
        product: s(row[iProduct]).trim(),
        body,
        date: rawDate,
        formattedDate: Number.isFinite(when) ? formatReadableDate(when) : rawDate,
        tenure: iTenure >= 0 ? s(row[iTenure]).trim() : "",
        liked: pickLiked(row),
        _row: r,
        _when: when,
      });
    }

    // Newest first: parsed date desc, then sheet row desc (later submissions last)
    reviews.sort((a, b) => (b._when - a._when) || (b._row - a._row));
    const clean: SheetReview[] = reviews.map(({ _row, _when, ...rest }) => rest);

    return { reviews: clean, fetchedAt: new Date().toISOString(), configured: true };
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

export function revalidateReviewsCache() {
  cache = null;
  inflight = null;
}

export const getSheetReviews = createServerFn({ method: "GET" })
  .inputValidator((input?: { force?: boolean }) => ({ force: !!input?.force }))
  .handler(async ({ data }): Promise<ReviewsPayload> => {
    const now = Date.now();
    if (data.force) {
      revalidateReviewsCache();
    } else if (cache && now - cache.at < CACHE_TTL_MS) {
      return cache.payload;
    }
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
  });

export const revalidateReviews = createServerFn({ method: "POST" }).handler(async () => {
  revalidateReviewsCache();
  return { ok: true, revalidatedAt: new Date().toISOString() };
});


