import { useRef } from "react";

/**
 * Prominent glassmorphism search bar rendered directly below the Products
 * hero, above the categories/sort/filters row. Shares the same `query`
 * state as the compact search input inside `ProductsFilterBar` — typing in
 * either instantly updates the other and filters the grid in real time.
 *
 * Only used on /products.
 */
export function TopSearchBar({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10 pt-6 pb-2">
      <div className="group relative">
        {/* Soft accent halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[2px] rounded-[calc(1.5rem+2px)] opacity-40 blur-md transition-opacity duration-300 group-focus-within:opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(90deg, color-mix(in oklab, var(--amber) 55%, transparent), color-mix(in oklab, var(--amber) 15%, transparent))",
          }}
        />
        <div
          className="relative rounded-3xl border-[1.5px] bg-card/70 backdrop-blur-xl supports-[backdrop-filter]:bg-card/55 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] transition-all duration-300 focus-within:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.55)]"
          style={{ borderColor: "color-mix(in oklab, var(--amber) 55%, transparent)" }}
        >
          <label htmlFor="products-search-top" className="sr-only">
            Search products, brands or services
          </label>
          <span
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--amber)" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="products-search-top"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                inputRef.current?.blur();
              }
            }}
            placeholder="Search products, brands or services…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            name="products-search-top"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            className="w-full rounded-3xl bg-transparent pl-14 pr-14 h-[52px] sm:h-[54px] text-base outline-none placeholder:text-muted-foreground/90 placeholder:font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
