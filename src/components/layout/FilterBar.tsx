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
    <div data-sticky="filter-bar" className="sticky top-16 sm:top-20 z-30 border-y border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter by category"
          className="scroll-slim flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]"
        >
          {categories.map((name) => {
            const isActive = active === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={isActive}
                onClick={() => onActiveChange(name)}
                className={`relative whitespace-nowrap rounded-full border px-5 min-h-11 md:min-h-10 text-[13px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? "border-transparent text-[color:var(--primary-foreground)] shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--amber)_60%,transparent),0_0_0_1px_color-mix(in_oklab,var(--amber)_45%,transparent)]"
                    : "border-border bg-card hover:bg-muted hover:border-[color:var(--amber)]/40 hover:text-foreground"
                }`}
                style={
                  isActive
                    ? {
                        backgroundImage:
                          "linear-gradient(135deg, color-mix(in oklab, var(--amber) 100%, transparent) 0%, color-mix(in oklab, var(--amber) 78%, #000 8%) 100%)",
                      }
                    : undefined
                }
              >
                <span>
                  {name} <span className="opacity-70">· {counts.get(name) ?? 0}</span>
                </span>
                {isActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 -bottom-[7px] h-[3px] w-8 -translate-x-1/2 rounded-full animate-[fade-in_240ms_ease-out]"
                    style={{ backgroundColor: "var(--amber)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-80 lg:shrink-0">
          <label htmlFor={searchId} className="sr-only">{searchLabel}</label>
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--amber)]/80">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="w-full rounded-full border border-[color:var(--amber)]/25 bg-card/80 pl-11 pr-4 min-h-11 md:min-h-11 text-sm text-foreground placeholder:text-muted-foreground/80 outline-none transition-all duration-300 focus:border-[color:var(--amber)]/70 focus:bg-card focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--amber)_18%,transparent),0_10px_30px_-15px_color-mix(in_oklab,var(--amber)_40%,transparent)]"
          />
        </div>
      </div>
    </div>
  );
}
