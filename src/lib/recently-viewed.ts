/**
 * Recently-viewed products tracker.
 *
 * Persists the last {@link MAX} products a user has looked at in
 * `localStorage`, keyed by product id. Deduplicates on track so re-viewing
 * an item bumps it to the front instead of adding a duplicate. Purely
 * client-side — falls back to an empty list on SSR and in private mode.
 */
import { useCallback, useEffect, useState } from "react";

import type { SheetProduct } from "./sheet-products.functions";

export interface RecentItem {
  id: string;
  name: string;
  plan?: string;
  category: string;
  viewedAt: number;
}

const KEY = "dp:recently-viewed";
const MAX = 8;

function isRecentItem(v: unknown): v is RecentItem {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.category === "string" &&
    typeof r.viewedAt === "number" &&
    (r.plan === undefined || typeof r.plan === "string")
  );
}

function read(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentItem).slice(0, MAX);
  } catch {
    return [];
  }
}

function write(items: RecentItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* quota / private mode — safe to ignore */
  }
}


/** SSR-safe hook: returns [] on first render, hydrates from storage in effect. */
export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const track = useCallback((p: SheetProduct) => {
    const next: RecentItem = {
      id: p.id,
      name: p.name,
      plan: p.plan,
      category: p.category,
      viewedAt: Date.now(),
    };
    setItems((prev) => {
      const dedup = prev.filter((x) => x.id !== next.id);
      const merged = [next, ...dedup].slice(0, MAX);
      write(merged);
      return merged;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, track, clear };
}
