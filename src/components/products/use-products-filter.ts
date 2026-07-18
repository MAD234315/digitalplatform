import { useEffect, useMemo, useState } from "react";

import type { SheetProduct } from "@/lib/sheet-products.functions";

type CategoryInfo = { name: string; count: number };

export type StockFilter = "all" | "latest" | "in-stock" | "limited" | "out";
export type SortKey = "default" | "name-asc" | "availability";

const AVAILABILITY_RANK: Record<SheetProduct["availability"], number> = {
  available: 0,
  limited: 1,
  out: 2,
};

const SEEN_KEY = "products-first-seen-v3";
const LATEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days rolling per product

/** Stable product identity across sheet re-parses (sheet ids are positional). */
function keyOf(p: SheetProduct): string {
  return `${p.category}||${p.name}||${p.plan}`;
}

/**
 * Content fingerprint of a product row. Any edit in the spreadsheet that
 * changes one of these fields flips the signature and re-stamps the
 * first-seen timestamp — so edited products re-enter "Latest" for 7 days.
 */
function signatureOf(p: SheetProduct): string {
  return [
    p.status,
    p.validity,
    p.plan,
    p.type,
    p.supports,
    p.warranty,
    p.availability,
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
export function useProductsFilter(products: SheetProduct[], categories: CategoryInfo[]) {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  // No debounce: filter against the live query so cleared/changed input
  // instantly resets results — never a stale keyword lingering on-screen.


  const [seen, setSeen] = useState<SeenMap>({});

  // Merge newly-appearing OR edited products into the first-seen map.
  useEffect(() => {
    if (products.length === 0) return;
    const existing = readSeen();
    const now = Date.now();
    const firstRun = existing === null;
    const map: SeenMap = { ...(existing ?? {}) };
    let changed = false;
    for (const p of products) {
      const k = keyOf(p);
      const sig = signatureOf(p);
      const prev = map[k];
      if (!prev) {
        // First run: backfill with 0 so pre-existing items aren't "latest".
        // Later runs: stamp with now so new items stay "latest" for 7 days.
        map[k] = { t: firstRun ? 0 : now, sig };
        changed = true;
      } else if (prev.sig !== sig) {
        // Row edited in the spreadsheet → restart the 7-day window from today.
        map[k] = { t: now, sig };
        changed = true;
      }
    }
    if (changed) writeSeen(map);
    setSeen(map);
  }, [products]);

  // Single source of truth for "Latest": one filtered+sorted array; every
  // other Latest-derived value (Set of keys, Set of ids, count, list) is
  // derived from it so the Live Stats card and the product grid can never
  // drift apart.
  const latestProducts = useMemo(() => {
    const cutoff = Date.now() - LATEST_WINDOW_MS;
    return products
      .filter((p) => p.availability === "available" && p.inStock)
      .map((p) => ({ p, t: seen[keyOf(p)]?.t ?? 0 }))
      .filter((x) => x.t > cutoff)
      .sort((a, b) => b.t - a.t)
      .map((x) => x.p);
  }, [products, seen]);

  const latestKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of latestProducts) s.add(keyOf(p));
    return s;
  }, [latestProducts]);

  const latestIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of latestProducts) s.add(p.id);
    return s;
  }, [latestProducts]);

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
      latest: latestProducts.length,
      "in-stock": inStock,
      limited,
      out,
    } as Record<StockFilter, number>;
  }, [products, latestProducts]);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    // When the user is actively searching, ignore the category and stock
    // filters — the query should hit the whole catalogue so results aren't
    // silently hidden by an active "In stock" / "Latest" / category pill.
    const searching = needle.length > 0;
    const list = products.filter((p) => {
      if (!searching) {
        if (active !== "All" && p.category !== active) return false;
        if (stock === "in-stock" && p.availability !== "available") return false;
        if (stock === "limited" && p.availability !== "limited") return false;
        if (stock === "out" && p.availability !== "out") return false;
        if (stock === "latest" && !latestIds.has(p.id)) return false;
      }
      if (needle) {
        const hay = `${p.name} ${p.category} ${p.plan} ${p.type} ${p.validity} ${p.supports} ${p.badges.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    if (sort === "name-asc") {
      return list.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "availability") {
      return list.slice().sort((a, b) => AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability]);
    }
    return list;
  }, [products, active, stock, sort, deferredQ, latestIds]);


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
  };
}
