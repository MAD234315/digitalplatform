/**
 * Sticky filter bar for the /products page.
 *
 * Renders category chips (with counts) plus a debounced search input. The
 * bar is a pure controlled component — state lives in the parent via
 * `useProductsFilter` so URL sync or persistence can be added there
 * without touching this file.
 */
export function ProductsFilterBar({

  categories,
  totalCount,
  categoryCounts,
  active,
  onActiveChange,
  query,
  onQueryChange,
}: {
  categories: string[];
  totalCount: number;
  categoryCounts: Map<string, number>;
  active: string;
  onActiveChange: (name: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="sticky top-16 sm:top-20 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-3 flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
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
                role="tab"
                aria-selected={isActive}
                aria-pressed={isActive}
                onClick={() => onActiveChange(name)}
                className={`whitespace-nowrap rounded-full border px-4 min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition ${
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
        <div className="relative w-full lg:w-72 lg:shrink-0">
          <label htmlFor="products-search" className="sr-only">Search products</label>
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="products-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-border bg-card pl-11 pr-10 min-h-10 text-sm outline-none transition focus:border-foreground/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
