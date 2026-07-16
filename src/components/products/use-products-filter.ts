import { useDeferredValue, useMemo, useState } from "react";
import type { SheetProduct } from "@/lib/sheet-products.functions";

type CategoryInfo = { name: string; count: number };

/**
 * Encapsulates products page filter/search state.
 * Uses useDeferredValue on the query so keystrokes stay snappy while the
 * (potentially large) filter pass runs at a lower priority.
 */
export function useProductsFilter(products: SheetProduct[], categories: CategoryInfo[]) {
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of categories) m.set(c.name, c.count);
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    return products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (needle && !`${p.name} ${p.plan} ${p.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [products, active, deferredQ]);

  return { active, setActive, q, setQ, filtered, categoryCounts };
}
