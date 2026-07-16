import type { Dispatch, SetStateAction } from "react";

/**
 * Sticky filter bar: horizontally scrollable category tabs + search input.
 *
 * Shared between the FAQ and any future filterable list. `counts` is a Map
 * keyed by category name; missing entries render as `· 0`.
 */
export function FilterBar<T extends string>({
  categories,
  counts,
  active,
  onActiveChange,
  query,
  onQueryChange,
  searchLabel = "Search",
  searchPlaceholder = "Search…",
  searchId,
}: {
  categories: readonly T[];
  counts: Map<string, number>;
  active: T;
  onActiveChange: Dispatch<SetStateAction<T>> | ((next: T) => void);
  query: string;
  onQueryChange: (next: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchId: string;
}) {
  return (
    <div className="sticky top-16 sm:top-20 z-30 border-y border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter by category"
          className="scroll-slim flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {categories.map((name) => {
            const isActive = active === name;
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
                {name} <span className="opacity-60">· {counts.get(name) ?? 0}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-72 lg:shrink-0">
          <label htmlFor={searchId} className="sr-only">{searchLabel}</label>
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-border bg-card pl-11 pr-4 min-h-11 md:min-h-10 text-sm outline-none transition focus:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>
      </div>
    </div>
  );
}
