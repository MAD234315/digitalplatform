/**
 * Filter bar for the /products page.
 *
 * Compact layout:
 *   Row 1 — full-width search with instant suggestions
 *   Row 2 — [Categories dropdown]  [Sort dropdown]  [Filters button]
 *
 * The Filters button opens a popover containing the stock-availability
 * pills (all / latest / in-stock / limited / out). State lives in the
 * parent via `useProductsFilter`.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { SortKey, StockFilter } from "./use-products-filter";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { gradientFor, initialsFor } from "@/lib/product-visuals";

const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "latest", label: "Latest" },
  { value: "in-stock", label: "In stock" },
  { value: "limited", label: "Low stock" },
  { value: "out", label: "Out" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Newest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "availability", label: "In stock first" },
];

const MAX_SUGGESTIONS = 8;
const RECENT_SEARCHES_KEY = "products-recent-searches-v1";
const MAX_RECENT = 8;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

type Suggestion = {
  key: string;
  label: string;
  category: string;
  plan: string;
  availability: SheetProduct["availability"];
  matchText: string;
};

function toSuggestion(p: SheetProduct): Suggestion {
  return {
    key: `${p.name}||${p.plan}`,
    label: p.name,
    category: p.category,
    plan: p.plan,
    availability: p.availability,
    matchText: `${p.name} ${p.plan} ${p.category}`.toLowerCase(),
  };
}

function buildSuggestions(products: SheetProduct[]): Suggestion[] {
  const seen = new Set<string>();
  const list: Suggestion[] = [];
  for (const p of products) {
    const s = toSuggestion(p);
    if (seen.has(s.key)) continue;
    seen.add(s.key);
    list.push(s);
  }
  return list;
}

function rankMatches(pool: Suggestion[], needle: string): Suggestion[] {
  const n = needle.toLowerCase();
  const scored: { s: Suggestion; score: number }[] = [];
  for (const s of pool) {
    const nameIdx = s.label.toLowerCase().indexOf(n);
    const anyIdx = s.matchText.indexOf(n);
    if (anyIdx === -1) continue;
    const score =
      s.label.toLowerCase().startsWith(n) ? 0 :
      nameIdx >= 0 ? 1 + nameIdx / 100 :
      2 + anyIdx / 100;
    scored.push({ s, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, MAX_SUGGESTIONS).map((x) => x.s);
}

function stockMeta(a: Suggestion["availability"]): { color: string; label: string } {
  if (a === "out") return { color: "var(--danger)", label: "Out" };
  if (a === "limited") return { color: "var(--amber)", label: "Low" };
  return { color: "var(--whatsapp)", label: "In stock" };
}

export function ProductsFilterBar({
  categories,
  totalCount,
  categoryCounts,
  active,
  onActiveChange,
  query,
  onQueryChange,
  stock,
  onStockChange,
  stockCounts,
  sort,
  onSortChange,
  products,
}: {
  categories: string[];
  totalCount: number;
  categoryCounts: Map<string, number>;
  active: string;
  onActiveChange: (name: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  stock: StockFilter;
  onStockChange: (value: StockFilter) => void;
  stockCounts: Record<StockFilter, number>;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  products: SheetProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const pool = useMemo(() => buildSuggestions(products), [products]);

  const popular = useMemo(() => {
    const inStock = pool.filter((s) => s.availability !== "out");
    const source = inStock.length > 0 ? inStock : pool;
    return source.slice(0, POPULAR_COUNT);
  }, [pool]);

  const trimmed = query.trim();
  const suggestions = useMemo(() => {
    if (trimmed.length < 1) return [];
    return rankMatches(pool, trimmed);
  }, [pool, trimmed]);

  const showingPopular = trimmed.length === 0;
  const showEmpty = trimmed.length >= 2 && suggestions.length === 0;
  const items: Suggestion[] = showingPopular ? popular : suggestions;
  const showList = open && (items.length > 0 || showEmpty);
  const navigableCount = items.length;

  useEffect(() => { setHighlight(0); }, [showingPopular, suggestions, popular]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filtersRef.current) return;
      if (!filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const commit = (s: Suggestion) => {
    onQueryChange(s.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!showList || navigableCount === 0) {
      if (e.key === "ArrowDown" && navigableCount > 0) { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % navigableCount); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + navigableCount) % navigableCount); }
    else if (e.key === "Enter") {
      const s = items[highlight];
      if (s) { e.preventDefault(); commit(s); }
    }
  };

  const renderHighlighted = (text: string, needle: string) => {
    const n = needle.trim().toLowerCase();
    if (!n) return text;
    const idx = text.toLowerCase().indexOf(n);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-transparent text-foreground font-semibold">{text.slice(idx, idx + n.length)}</mark>
        {text.slice(idx + n.length)}
      </>
    );
  };

  const activeStockCount = stock === "all" ? 0 : 1;
  const activeCategoryCount = categoryCounts.get(active) ?? totalCount;

  const selectClass =
    "min-w-0 min-h-11 md:min-h-10 appearance-none rounded-full border border-border bg-card pl-4 pr-9 text-sm outline-none transition focus:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const chevron = (
    <svg viewBox="0 0 24 24" aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-2 lg:py-3 flex flex-col gap-2">
        {/* Row 1: search */}
        <div ref={wrapRef} className="relative w-full">
          <label htmlFor="products-search" className="sr-only">Search products</label>
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="products-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { onQueryChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search products…"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={showList && navigableCount > 0 ? `${listboxId}-opt-${highlight}` : undefined}
            autoComplete="off"
            className="w-full rounded-full border border-border bg-card pl-11 pr-12 min-h-11 md:min-h-10 text-sm outline-none transition focus:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          {query && (
            <button
              type="button"
              onClick={() => { onQueryChange(""); setOpen(false); inputRef.current?.focus(); }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {showList && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-black/5 backdrop-blur">
              <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {showingPopular ? "Popular" : showEmpty ? "No results" : "Suggestions"}
              </div>
              {showEmpty ? (
                <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground">
                  No products match “<span className="text-foreground">{trimmed}</span>”. Try a shorter term.
                </div>
              ) : (
                <ul id={listboxId} role="listbox" className="pb-1">
                  {items.map((s, i) => {
                    const isActive = i === highlight;
                    const meta = stockMeta(s.availability);
                    return (
                      <li
                        key={s.key}
                        id={`${listboxId}-opt-${i}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseDown={(e) => { e.preventDefault(); commit(s); }}
                        className={`flex cursor-pointer items-center gap-3 border-t border-border/50 first:border-t-0 px-4 py-2.5 transition ${
                          isActive ? "bg-muted" : "hover:bg-muted/60"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-semibold text-white shadow-inner"
                          style={{ backgroundImage: gradientFor(s.label) }}
                        >
                          {initialsFor(s.label)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {renderHighlighted(s.label, trimmed)}
                          </span>
                          <span className="block truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            {[s.category, s.plan].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                          {meta.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Row 2: categories | sort | filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-0 flex-1 sm:flex-none sm:w-56">
            <label htmlFor="products-category" className="sr-only">Category</label>
            <select
              id="products-category"
              value={active}
              onChange={(e) => onActiveChange(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="All">All categories · {totalCount}</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name} · {categoryCounts.get(name) ?? 0}
                </option>
              ))}
            </select>
            {chevron}
            <span className="sr-only">Currently showing {activeCategoryCount} products</span>
          </div>

          <div className="relative min-w-0 flex-1 sm:flex-none sm:w-44">
            <label htmlFor="products-sort" className="sr-only">Sort</label>
            <select
              id="products-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className={`w-full ${selectClass}`}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            {chevron}
          </div>

          <div ref={filtersRef} className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={filtersOpen}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 min-h-11 md:min-h-10 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                activeStockCount > 0
                  ? "border-transparent shadow-soft"
                  : "border-border bg-card hover:bg-muted"
              }`}
              style={activeStockCount > 0 ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
              </svg>
              Filters
              {activeStockCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background/25 px-1.5 text-[10px] font-semibold">
                  {activeStockCount}
                </span>
              )}
            </button>

            {filtersOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-border bg-popover text-popover-foreground p-3 shadow-xl ring-1 ring-black/5"
              >
                <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Availability
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STOCK_OPTIONS.map((opt) => {
                    const isActive = stock === opt.value;
                    const count = stockCounts[opt.value] ?? 0;
                    const dotColor =
                      opt.value === "latest" ? "var(--primary)" :
                      opt.value === "in-stock" ? "var(--whatsapp)" :
                      opt.value === "limited" ? "var(--amber)" :
                      opt.value === "out" ? "var(--danger)" :
                      undefined;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => { onStockChange(opt.value); setFiltersOpen(false); }}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 min-h-9 text-[11px] font-medium uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isActive
                            ? "border-transparent shadow-soft"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                        style={isActive ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                      >
                        {dotColor && (
                          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                        )}
                        {opt.label}
                        <span className="opacity-60">· {count}</span>
                      </button>
                    );
                  })}
                </div>
                {(stock !== "all" || active !== "All" || sort !== "default") && (
                  <button
                    type="button"
                    onClick={() => {
                      onStockChange("all");
                      onActiveChange("All");
                      onSortChange("default");
                      setFiltersOpen(false);
                    }}
                    className="mt-3 w-full rounded-full border border-border bg-card min-h-9 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
