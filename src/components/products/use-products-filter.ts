import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SheetProduct } from "@/lib/sheet-products.functions";

type CategoryInfo = { name: string; count: number };

export type StockFilter = "all" | "latest" | "in-stock" | "limited" | "out";

const BASELINE_KEY = "products-latest-baseline-v1";

/** Stable product identity across sheet re-parses (sheet ids are positional). */
function keyOf(p: SheetProduct): string {
  return `${p.category}||${p.name}||${p.plan}`;
}

/**
 * Returns the timestamp (ms) of the most recent Thursday 00:00 local time.
 * Used as the "current week" anchor — the Latest window resets each Thursday.
 */
function currentWeekAnchor(now = new Date()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // getDay(): Sun=0 … Thu=4 … Sat=6
  const daysSinceThu = (d.getDay() - 4 + 7) % 7;
  d.setDate(d.getDate() - daysSinceThu);
  return d.getTime();
}

type Baseline = { anchor: number; keys: string[] };

function readBaseline(): Baseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BASELINE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Baseline;
    if (typeof parsed?.anchor !== "number" || !Array.isArray(parsed?.keys)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeBaseline(b: Baseline) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BASELINE_KEY, JSON.stringify(b));
  } catch {
    // Ignore quota / privacy-mode errors — Latest just won't persist.
  }
}

/**
 * Encapsulates products page filter/search state.
 *
 * "Latest" filter: on the first render of each new week (Thursday reset),
 * snapshot the current product keys. Any product not in that snapshot is
 * considered "latest" until the next Thursday, at which point everything
 * currently listed becomes the new baseline.
 */
export function useProductsFilter(products: SheetProduct[], categories: CategoryInfo[]) {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const deferredQ = useDeferredValue(q);

  const [baseline, setBaseline] = useState<Baseline | null>(null);

  // Rotate the baseline when the week changes or on first mount.
  useEffect(() => {
    if (products.length === 0) return;
    const anchor = currentWeekAnchor();
    const existing = readBaseline();
    if (!existing || existing.anchor !== anchor) {
      const next: Baseline = { anchor, keys: products.map(keyOf) };
      writeBaseline(next);
      setBaseline(next);
    } else {
      setBaseline(existing);
    }
    // Intentionally depend on product length only — refreshing the sheet
    // shouldn't reset "latest" mid-week when the same items refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const latestKeys = useMemo(() => {
    if (!baseline) return new Set<string>();
    const known = new Set(baseline.keys);
    const fresh = new Set<string>();
    for (const p of products) {
      const k = keyOf(p);
      if (!known.has(k)) fresh.add(k);
    }
    return fresh;
  }, [products, baseline]);

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
