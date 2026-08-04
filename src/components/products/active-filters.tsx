/**
 * Active filters chip row displayed above the product grid.
 *
 * Renders a chip for every non-default filter (category, stock, sort, search),
 * each removable with an ×, plus a "Clear all" action that resets everything.
 * Hidden entirely when no filter is active so the layout stays clean.
 */
import type { SortKey, StockFilter } from "./use-products-filter";

const STOCK_LABELS: Record<StockFilter, string> = {
  all: "All Products",
  latest: "Latest",
  "in-stock": "In stock",
  limited: "Low stock",
  out: "Out of stock",
};

const SORT_LABELS: Record<SortKey, string> = {
  default: "Newest first",
  "name-asc": "Name A–Z",
  availability: "In stock first",
};

type Chip = { key: string; label: string; onRemove: () => void };

export function ActiveFilters({
  active,
  stock,
  sort,
  query,
  onCategoryReset,
  onStockReset,
  onSortReset,
  onQueryReset,
  onClearAll,
}: {
  active: string;
  stock: StockFilter;
  sort: SortKey;
  query: string;
  onCategoryReset: () => void;
  onStockReset: () => void;
  onSortReset: () => void;
  onQueryReset: () => void;
  onClearAll: () => void;
}) {
  const chips: Chip[] = [];
  if (active && active !== "All") {
    chips.push({ key: "cat", label: active, onRemove: onCategoryReset });
  }
  if (stock !== "all") {
    chips.push({ key: "stock", label: STOCK_LABELS[stock], onRemove: onStockReset });
  }
  if (sort !== "default") {
    chips.push({ key: "sort", label: `Sort: ${SORT_LABELS[sort]}`, onRemove: onSortReset });
  }
  const q = query.trim();
  if (q.length > 0) {
    chips.push({ key: "q", label: `“${q}”`, onRemove: onQueryReset });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Active filters
      </span>
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 pl-2.5 pr-1 py-0.5 text-[11px] font-medium text-foreground"
        >
          <span className="max-w-[12rem] truncate">{c.label}</span>
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={`Remove filter ${c.label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-amber/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 inline-flex min-h-8 items-center rounded-full border border-border bg-card px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground transition hover:bg-muted hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </button>
    </div>
  );
}
