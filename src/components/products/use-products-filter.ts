import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SheetProduct } from "@/lib/sheet-products.functions";

type CategoryInfo = { name: string; count: number };

export type StockFilter = "all" | "latest" | "in-stock" | "limited" | "out";

const SEEN_KEY = "products-first-seen-v2";
const LATEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Stable product identity across sheet re-parses (sheet ids are positional). */
function keyOf(p: SheetProduct): string {
  return `${p.category}||${p.name}||${p.plan}`;
}

type SeenMap = Record<string, number>;

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
 * "Latest" filter: each product key gets a first-seen timestamp persisted in
 * localStorage. A product is considered "latest" for 7 days from the moment
 * it first appears in the catalogue on this device. On the very first mount
 * we backfill existing products with timestamp 0 so we don't flag the whole
 * catalogue as new.
 */
export function useProductsFilter(products: SheetProduct[], categories: CategoryInfo[]) {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const deferredQ = useDeferredValue(q);

  const [seen, setSeen] = useState<SeenMap>({});

  // Merge newly-appearing products into the first-seen map.
  useEffect(() => {
    if (products.length === 0) return;
    const existing = readSeen();
    const now = Date.now();
    const firstRun = existing === null;
    const map: SeenMap = { ...(existing ?? {}) };
    let changed = false;
    for (const p of products) {
      const k = keyOf(p);
      if (!(k in map)) {
        // First run: backfill with 0 so pre-existing items aren't "latest".
        // Later runs: stamp with now so new items stay "latest" for 7 days.
        map[k] = firstRun ? 0 : now;
        changed = true;
      }
    }
    if (changed) writeSeen(map);
    setSeen(map);
  }, [products]);

  const latestKeys = useMemo(() => {
    const cutoff = Date.now() - LATEST_WINDOW_MS;
    const fresh = new Set<string>();
    for (const p of products) {
      const t = seen[keyOf(p)];
      if (typeof t === "number" && t > cutoff) fresh.add(keyOf(p));
    }
    return fresh;
  }, [products, seen]);

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
      latest: latestKeys.size,
      "in-stock": inStock,
      limited,
      out,
    } as Record<StockFilter, number>;
  }, [products, latestKeys]);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    return products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (stock === "in-stock" && p.availability !== "available") return false;
      if (stock === "limited" && p.availability !== "limited") return false;
      if (stock === "out" && p.availability !== "out") return false;
      if (stock === "latest" && !latestKeys.has(keyOf(p))) return false;
      if (needle && !`${p.name} ${p.plan} ${p.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [products, active, stock, deferredQ, latestKeys]);

  return {
    active,
    setActive,
    q,
    setQ,
    stock,
    setStock,
    stockCounts,
    filtered,
    categoryCounts,
    latestKeys,
  };
}
