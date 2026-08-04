import type { SheetProduct } from "@/lib/sheet-products.functions";
import type { RecentItem } from "@/lib/recently-viewed";
import { gradientFor, initialsFor } from "@/lib/product-visuals";

/**
 * "Continue where you left off" strip shown above the products grid.
 *
 * Only rendered when the user has previously viewed products that still
 * exist in the live catalogue (the parent filters stale entries). Clicking
 * a chip scrolls the corresponding card into view via `onJump`.
 */
export function RecentlyViewed({

  items,
  onJump,
  onClear,
}: {
  items: Array<{ recent: RecentItem; product: SheetProduct }>;
  onJump: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <section aria-labelledby="recently-viewed-heading" className="mb-6 rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Continue where you left off</div>
          <h2 id="recently-viewed-heading" className="mt-0.5 font-display text-lg">Recently viewed</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <ul className="scroll-slim mt-3 flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
        {items.map(({ recent, product }) => {
          const initials = initialsFor(product.name);
          return (
            <li key={recent.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onJump(recent.id)}
                className="group flex w-52 items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-soft hover:border-foreground/20"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-sm text-white shadow-soft"
                  style={{ background: gradientFor(product.name) }}
                >
                  {initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{product.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {product.plan || product.category}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
