import { useDeferredValue, useEffect, useMemo, useState } from "react";

import type { SheetProduct } from "@/lib/sheet-products.functions";

type CategoryInfo = { name: string; count: number };

export type StockFilter = "all" | "latest" | "in-stock" | "limited" | "out";
export type SortKey = "default" | "name-asc" | "availability";

const AVAILABILITY_RANK: Record<SheetProduct["availability"], number> = {
  available: 0,
  limited: 1,
  out: 2,
};

const SEEN_KEY = "products-first-seen-v5";
const SOURCE_KEY = "products-source-v1";
const LATEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days rolling per product
const SOURCE_GRACE_MS = 24 * 60 * 60 * 1000; // 24h grace after catalogue URL swap


/** Stable product identity across sheet re-parses (sheet ids are positional). */
function keyOf(p: SheetProduct): string {
  return `${p.category}||${p.name}||${p.plan}`;
}

/**
 * Content fingerprint of a product row. Any edit in the spreadsheet that
 * changes ANY user-visible field flips the signature and re-stamps the
 * timestamp — so edited products re-enter "Latest" for 7 days.
 */
function signatureOf(p: SheetProduct): string {
  return [
    p.category,
    p.name,
    p.status,
    p.validity,
    p.plan,
    p.type,
    p.supports,
    p.warranty,
    p.availability,
    p.inStock ? "1" : "0",
    p.loot ? "1" : "0",
    p.badges.slice().sort().join(","),
  ].join("|");
}


type SeenEntry = { t: number; sig: string };
type SeenMap = Record<string, SeenEntry>;

function readSeen(): SeenMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SeenMap;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSeen(map: SeenMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / privacy-mode errors — Latest just won't persist.
  }
}

/**
 * Encapsulates products page filter/search state.
 *
 * "Latest" filter: each product key gets a first-seen timestamp plus a
 * content signature persisted in localStorage. A product is considered
 * "latest" for 7 days from the moment it either (a) first appears in the
 * catalogue, or (b) has any tracked field edited in the spreadsheet — the
 * clock restarts on edit. No weekday reset: the window is per-product and
 * rolling. On the very first mount we backfill existing products with
 * timestamp 0 so we don't flag the whole catalogue as new.
 */
export function useProductsFilter(products: SheetProduct[], categories: CategoryInfo[], sourceUrl: string = "") {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  // Defer the query for the heavy filter/sort work so the input keeps
  // painting keystrokes at 60fps even on large catalogues / low-end mobiles.
  // The input itself binds to the live `q`; only the filtered list lags by
  // at most one frame, which feels instant.
  const deferredQ = useDeferredValue(q);

  // Precompute a lowercased haystack per product once per catalogue load,
  // so every keystroke is a plain substring scan — no per-keystroke string
  // building or toLowerCase() over hundreds of rows.
  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      map.set(
        p.id,
        `${p.name} ${p.category} ${p.plan} ${p.type} ${p.validity} ${p.supports} ${p.badges.join(" ")}`.toLowerCase(),
      );
    }
    return map;
  }, [products]);


  const [seen, setSeen] = useState<SeenMap>({});
  // Grace period end after a catalogue URL swap: during this window "Latest"
  // is suppressed (count 0, no cards flagged). After it expires, normal 7-day
  // stamping resumes from the moment the grace ended.
  const [graceUntil, setGraceUntil] = useState<number>(0);

  // Track catalogue source URL. When the admin saves a new URL, we baseline
  // all currently-observed products (t=0, so nothing is Latest) and open a
  // 24h grace window before any product can be counted as Latest again.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (products.length === 0) return;
    const now = Date.now();

    let prevSource: string | null = null;
    let storedGrace = 0;
    try {
      const raw = window.localStorage.getItem(SOURCE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { url?: string; graceUntil?: number };
        prevSource = parsed.url ?? null;
        storedGrace = typeof parsed.graceUntil === "number" ? parsed.graceUntil : 0;
      }
    } catch {
      /* ignore */
    }

    const sourceChanged = prevSource !== null && prevSource !== sourceUrl;
    let map: SeenMap;
    let nextGrace = storedGrace;

    if (sourceChanged || prevSource === null) {
      // Fresh source (first ever visit OR admin swapped the URL): baseline
      // every product to t=0 so nothing shows in Latest, and open a 24h
      // grace window before stamping resumes.
      map = {};
      for (const p of products) {
        map[keyOf(p)] = { t: 0, sig: signatureOf(p) };
      }
      nextGrace = sourceChanged ? now + SOURCE_GRACE_MS : storedGrace;
      writeSeen(map);
      try {
        window.localStorage.setItem(
          SOURCE_KEY,
          JSON.stringify({ url: sourceUrl, graceUntil: nextGrace }),
        );
      } catch {
        /* ignore */
      }
    } else {
      const existing = readSeen();
      map = { ...(existing ?? {}) };
      const inGrace = now < storedGrace;
      let changed = false;
      for (const p of products) {
        const k = keyOf(p);
        const sig = signatureOf(p);
        const prev = map[k];
        if (!prev) {
          // New product: during grace, baseline to 0; after grace, stamp now
          // so it appears in Latest for 7 days.
          map[k] = { t: inGrace ? 0 : now, sig };
          changed = true;
        } else if (prev.sig !== sig) {
          // Edited: during grace, keep baseline; after grace, restart window.
          map[k] = { t: inGrace ? 0 : now, sig };
          changed = true;
        }
      }
      if (changed) writeSeen(map);
    }

    setSeen(map);
    setGraceUntil(nextGrace);
  }, [products, sourceUrl]);




  // Map of stable product key → last-observed update timestamp (0 = pre-existing
  // baseline, i.e. present on the very first mount before we started tracking).
  // Used both to sort "Latest" and to badge recently-edited cards.
  const updatedAtByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(keyOf(p), seen[keyOf(p)]?.t ?? 0);
    return m;
  }, [products, seen]);

  // Original catalogue order — used as a stable tiebreaker (proxy for creation
  // order) so products with the same updatedAt stay in a deterministic slot.
  const originalIndex = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [products]);

  // "Latest" = products edited/added within the last 7 days, sorted by most
  // recently updated first. Any edit in the admin panel flips the row's
  // signature (see effect above), restamps its timestamp to `now`, and the
  // product jumps to the top. After 7 days it drops out automatically but
  // remains in the main catalogue.
  const recentlyUpdatedProducts = useMemo(() => {
    const cutoff = Date.now() - LATEST_WINDOW_MS;
    return products
      .filter((p) => (updatedAtByKey.get(keyOf(p)) ?? 0) > cutoff)
      .sort((a, b) => {
        const tb = updatedAtByKey.get(keyOf(b)) ?? 0;
        const ta = updatedAtByKey.get(keyOf(a)) ?? 0;
        if (tb !== ta) return tb - ta;
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
      });
  }, [products, updatedAtByKey, originalIndex]);

  // Kept for back-compat with any consumer that used the full sorted list.
  const latestProducts = recentlyUpdatedProducts;

  const latestKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of recentlyUpdatedProducts) s.add(keyOf(p));
    return s;
  }, [recentlyUpdatedProducts]);

  const latestIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of recentlyUpdatedProducts) s.add(p.id);
    return s;
  }, [recentlyUpdatedProducts]);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of categories) m.set(c.name, c.count);
    return m;
  }, [categories]);

  const stockCounts = useMemo(() => {
    let inStock = 0, limited = 0, out = 0;
    for (const p of products) {
      if (p.availability === "out") out++;
      else if (p.availability === "limited") limited++;
      else inStock++;
    }
    return {
      all: products.length,
      // Latest counts only rows edited within the 7-day window.
      latest: recentlyUpdatedProducts.length,
      "in-stock": inStock,
      limited,
      out,
    } as Record<StockFilter, number>;
  }, [products, recentlyUpdatedProducts]);


  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    const searching = needle.length > 0;
    const cutoff = Date.now() - LATEST_WINDOW_MS;
    const list = products.filter((p) => {
      if (!searching) {
        if (active !== "All" && p.category !== active) return false;
        if (stock === "in-stock" && p.availability !== "available") return false;
        if (stock === "limited" && p.availability !== "limited") return false;
        if (stock === "out" && p.availability !== "out") return false;
        if (stock === "latest" && (updatedAtByKey.get(keyOf(p)) ?? 0) <= cutoff) return false;
      }
      if (needle) {
        const hay = haystacks.get(p.id);
        if (!hay || !hay.includes(needle)) return false;
      }
      return true;
    });
    if (stock === "latest" && !searching) {
      return list.slice().sort((a, b) => {
        const tb = updatedAtByKey.get(keyOf(b)) ?? 0;
        const ta = updatedAtByKey.get(keyOf(a)) ?? 0;
        if (tb !== ta) return tb - ta;
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
      });
    }
    if (sort === "name-asc") {
      return list.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "availability") {
      return list.slice().sort((a, b) => AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability]);
    }
    return list;
  }, [products, active, stock, sort, deferredQ, haystacks, updatedAtByKey, originalIndex]);





  return {
    active,
    setActive,
    q,
    setQ,
    stock,
    setStock,
    sort,
    setSort,
    stockCounts,
    filtered,
    categoryCounts,
    latestKeys,
    latestIds,
    latestProducts,
    recentlyUpdatedProducts,

  };
}
