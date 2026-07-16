import type { SheetProduct } from "@/lib/sheet-products.functions";
import type { RecentItem } from "@/lib/recently-viewed";
import { gradientFor, initialsFor } from "@/lib/product-visuals";

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
    <section aria-labelledby="recently-viewed-heading" className="mb-10 rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Continue where you left off</div>
          <h2 id="recently-viewed-heading" className="mt-1 font-display text-xl">Recently viewed</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs uppercase tracking-[0.14em] text-muted-foreground transition hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <ul className="scroll-slim mt-4 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {items.map(({ recent, product }) => {
          const initials = initialsFor(product.name);
          return (
            <li key={recent.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onJump(recent.id)}
                className="group flex w-56 items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft hover:border-foreground/20"
              >
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm text-white shadow-soft"
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
