import { useDeferredValue, useMemo, useState } from "react";
import type { SheetProduct } from "@/lib/sheet-products.functions";

type CategoryInfo = { name: string; count: number };

export type StockFilter = "all" | "in-stock" | "limited" | "out";

/**
 * Encapsulates products page filter/search state.
 * Uses useDeferredValue on the query so keystrokes stay snappy while the
 * (potentially large) filter pass runs at a lower priority.
 */
export function useProductsFilter(products: SheetProduct[], categories: CategoryInfo[]) {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");
  const deferredQ = useDeferredValue(q);

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
    return { all: products.length, "in-stock": inStock, limited, out } as Record<StockFilter, number>;
  }, [products]);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    return products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (stock === "in-stock" && p.availability !== "available") return false;
      if (stock === "limited" && p.availability !== "limited") return false;
      if (stock === "out" && p.availability !== "out") return false;
      if (needle && !`${p.name} ${p.plan} ${p.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [products, active, stock, deferredQ]);

  return { active, setActive, q, setQ, stock, setStock, stockCounts, filtered, categoryCounts };
}

