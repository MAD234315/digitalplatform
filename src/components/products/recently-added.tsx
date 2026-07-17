/**
 * "Recently Added" header strip shown at the top of the /products page.
 *
 * Sourced from `useProductsFilter().latestProducts` — the same 7-day rolling
 * window that powers the "Latest" stock filter. Renders only the section
 * heading and a "See all latest" CTA that applies the Latest filter.
 */
import type { SheetProduct } from "@/lib/sheet-products.functions";

export function RecentlyAdded({
  products,
  onSeeAll,
}: {
  products: SheetProduct[];
  onSeeAll: () => void;
}) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-added-heading"
      className="border-b border-border bg-hero"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Just in · last 7 days
            </div>
            <h2
              id="recently-added-heading"
              className="mt-2 font-display text-2xl sm:text-3xl"
            >
              Recently added
            </h2>
          </div>
          <button
            type="button"
            onClick={onSeeAll}
            className="shrink-0 rounded-full border border-border bg-card px-4 min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition hover:bg-muted"
          >
            See all latest →
          </button>
        </div>
      </div>
    </section>
  );
}
