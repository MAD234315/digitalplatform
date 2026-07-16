/**
 * Filter bar for the /products page.
 *
 * Renders category chips (with counts) plus a debounced search input with
 * an instant-suggestions dropdown. The bar is a pure controlled component
 * — state lives in the parent via `useProductsFilter` so URL sync or
 * persistence can be added there without touching this file.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { StockFilter } from "./use-products-filter";
import type { SheetProduct } from "@/lib/sheet-products.functions";

const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "latest", label: "Latest" },
  { value: "in-stock", label: "In stock" },
  { value: "limited", label: "Low stock" },
  { value: "out", label: "Out" },
];

const MAX_SUGGESTIONS = 8;

type Suggestion = {
  key: string;
  label: string;      // e.g. "Canva Pro"
  sub: string;        // e.g. "Design · 1 Year"
  matchText: string;  // lowercase composite used for matching
};

function buildSuggestions(products: SheetProduct[]): Suggestion[] {
  const seen = new Set<string>();
  const list: Suggestion[] = [];
  for (const p of products) {
    const key = `${p.name}||${p.plan}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const sub = [p.category, p.plan].filter(Boolean).join(" · ");
    list.push({
      key,
      label: p.name,
      sub,
      matchText: `${p.name} ${p.plan} ${p.category}`.toLowerCase(),
    });
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
    // Prefer name prefix > name contains > any contains
    const score =
      s.label.toLowerCase().startsWith(n) ? 0 :
      nameIdx >= 0 ? 1 + nameIdx / 100 :
      2 + anyIdx / 100;
    scored.push({ s, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, MAX_SUGGESTIONS).map((x) => x.s);
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
  products: SheetProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const pool = useMemo(() => buildSuggestions(products), [products]);

  const suggestions = useMemo(() => {
    const needle = query.trim();
    if (needle.length < 1) return [];
    return rankMatches(pool, needle);
  }, [pool, query]);

  // Reset highlight when the suggestion list changes.
  useEffect(() => { setHighlight(0); }, [suggestions]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const showList = open && suggestions.length > 0;

  const commit = (s: Suggestion) => {
    onQueryChange(s.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!showList) {
      if (e.key === "ArrowDown" && suggestions.length > 0) { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === "Enter") {
      const s = suggestions[highlight];
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

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-2 lg:py-3 flex flex-col gap-2">
        <div
          role="group"
          aria-label="Filter by category"
          className="scroll-slim flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {["All", ...categories].map((name) => {
            const isActive = active === name;
            const count = name === "All" ? totalCount : (categoryCounts.get(name) ?? 0);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={isActive}
                onClick={() => onActiveChange(name)}
                className={`whitespace-nowrap rounded-full border px-4 min-h-11 md:min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? "border-transparent shadow-soft"
                    : "border-border bg-card hover:bg-muted hover:border-foreground/20"
                }`}
                style={isActive ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
              >
                {name.toLowerCase()} <span className="opacity-60">· {count}</span>
              </button>
            );
          })}
        </div>
        <div
            role="group"
            aria-label="Filter by stock"
            className="scroll-slim inline-flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
          >
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
                  aria-pressed={isActive}
                  onClick={() => onStockChange(opt.value)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 min-h-10 md:min-h-8 text-[11px] font-medium uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card ${
                    isActive
                      ? "shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
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
          <div ref={wrapRef} className="relative w-full lg:w-72 lg:shrink-0">
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
              aria-activedescendant={showList ? `${listboxId}-opt-${highlight}` : undefined}
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
              <ul
                id={listboxId}
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg backdrop-blur"
              >
                {suggestions.map((s, i) => {
                  const isActive = i === highlight;
                  return (
                    <li
                      key={s.key}
                      id={`${listboxId}-opt-${i}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setHighlight(i)}
                      onMouseDown={(e) => { e.preventDefault(); commit(s); }}
                      className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm transition ${
                        isActive ? "bg-muted" : ""
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        {renderHighlighted(s.label, query)}
                      </span>
                      {s.sub && (
                        <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          {s.sub}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


