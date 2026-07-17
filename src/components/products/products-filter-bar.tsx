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
const MAX_RECENT = 2;

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
  slot = "all",
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
  /** Which row to render: search only, controls only, or both (default). */
  slot?: "all" | "search" | "controls";
}) {
  const [open, setOpen] = useState(false);
  // -1 = nothing highlighted. We NEVER auto-select the first suggestion;
  // the user must press ArrowDown or hover explicitly.
  const [highlight, setHighlight] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  // Hydrate recent searches after mount (localStorage is client-only).
  useEffect(() => { setRecent(readRecent()); }, []);

  const pool = useMemo(() => buildSuggestions(products), [products]);

  const trimmed = query.trim();
  const suggestions = useMemo(() => {
    if (trimmed.length < 1) return [];
    return rankMatches(pool, trimmed);
  }, [pool, trimmed]);

  const showingRecent = trimmed.length === 0;
  const showEmpty = trimmed.length >= 1 && suggestions.length === 0;
  const items: Suggestion[] = showingRecent ? [] : suggestions;
  // Hide overlay entirely when we'd only be showing an empty recent list.
  const showList = open && !(showingRecent && recent.length === 0);
  const navigableCount = items.length;

  // Reset highlight to -1 (no selection) whenever the visible list changes.
  useEffect(() => { setHighlight(-1); }, [showingRecent, suggestions]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);


  const pushRecent = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecent((prev) => {
      const dedup = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
      writeRecent(dedup);
      return dedup;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

  const closeOverlay = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  const commit = (s: Suggestion) => {
    onQueryChange(s.label);
    pushRecent(s.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const applyRecent = (term: string) => {
    onQueryChange(term);
    pushRecent(term);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { closeOverlay(); return; }
    if (e.key === "Enter") {
      // Never auto-commit a suggestion the user didn't deliberately highlight.
      // Enter searches with whatever the user has typed and closes the panel.
      e.preventDefault();
      if (highlight >= 0) {
        const s = items[highlight];
        if (s) { commit(s); return; }
      }
      if (trimmed.length > 0) {
        // Only persist the term if it actually matches at least one product.
        const needle = trimmed.toLowerCase();
        const hasMatch = products.some((p) => {
          const hay = `${p.name} ${p.category} ${p.plan} ${p.type} ${p.validity} ${p.supports} ${p.badges.join(" ")}`.toLowerCase();
          return hay.includes(needle);
        });
        if (hasMatch) pushRecent(trimmed);
      }
      closeOverlay();
      return;
    }
    if (navigableCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h < 0 ? 0 : (h + 1) % navigableCount));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h < 0 ? navigableCount - 1 : (h - 1 + navigableCount) % navigableCount));
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
        {slot !== "controls" && (
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
            aria-activedescendant={showList && highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            name="products-search"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
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
            <div
              className="animate-fade-in absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-border/70 bg-popover/85 text-popover-foreground shadow-2xl ring-1 ring-black/10 backdrop-blur-xl supports-[backdrop-filter]:bg-popover/70"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 pt-3 pb-2 bg-inherit backdrop-blur-xl">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {showingRecent ? "Recent searches" : showEmpty ? "No results" : "Suggestions"}
                </div>
                <div className="flex items-center gap-1">
                  {showingRecent && recent.length > 0 && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); clearRecent(); }}
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Clear history
                    </button>
                  )}
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); closeOverlay(); }}
                    aria-label="Close search"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {showingRecent ? (
                recent.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No recent searches.
                  </div>
                ) : (
                  <ul className="pb-2">
                    {recent.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); applyRecent(term); }}
                          className="group flex w-full items-center gap-3 border-t border-border/40 first:border-t-0 px-4 py-2.5 text-left transition hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none"
                        >
                          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">{term}</span>
                          <span aria-hidden className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : showEmpty ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
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
                        className={`flex cursor-pointer items-center gap-3 border-t border-border/40 first:border-t-0 px-4 py-2.5 transition ${
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
        )}

        {/* Row 2: categories | sort | filters */}
        {slot !== "search" && (
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

          <div className="relative min-w-0 flex-1 sm:flex-none sm:w-48">
            <label htmlFor="products-stock" className="sr-only">Filter by availability</label>
            <select
              id="products-stock"
              value={stock}
              onChange={(e) => onStockChange(e.target.value as StockFilter)}
              className={`w-full ${selectClass}`}
            >
              {STOCK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Filter: {opt.label} · {stockCounts[opt.value] ?? 0}
                </option>
              ))}
            </select>
            {chevron}
            <span className="sr-only">{activeStockCount > 0 ? `${activeStockCount} filter active` : "No filter active"}</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
