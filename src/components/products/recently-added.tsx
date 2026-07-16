/**
 * "Recently Added" horizontal strip shown at the top of the /products page.
 *
 * Sourced from `useProductsFilter().latestProducts` — the same 7-day rolling
 * window that powers the "Latest" stock filter. Rendered as a scroll-snap
 * carousel of compact cards; each card links out to WhatsApp with a
 * pre-composed enquiry, mirroring the primary CTA on the full product card.
 */
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { CONTACT } from "@/components/site-chrome";
import { AvailabilityBadge } from "./badge";
import { gradientFor, initialsFor } from "@/lib/product-visuals";

export function RecentlyAdded({
  products,
  onSeeAll,
}: {
  products: SheetProduct[];
  onSeeAll: () => void;
}) {
  if (products.length === 0) return null;
  const items = products.slice(0, 12);

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

        <div
          className="scroll-slim mt-6 -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
          role="list"
        >
          {items.map((p) => (
            <RecentCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentCard({ p }: { p: SheetProduct }) {
  const waMsg = encodeURIComponent(
    `Hi, I'm interested in ${p.name}${p.plan ? ` (${p.plan})` : ""}${p.validity ? ` — ${p.validity}` : ""}. Please share the price.`,
  );
  const gradient = gradientFor(p.name);
  const initials = initialsFor(p.name);

  return (
    <a
      role="listitem"
      href={`${CONTACT.WA_URL}?text=${waMsg}`}
      target="_blank"
      rel="noreferrer"
      className="group relative flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/25 hover:shadow-soft"
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ background: gradient }}
      >
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center font-display text-4xl font-bold tracking-tight text-white/95 transition duration-500 group-hover:scale-[1.04]"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
        >
          {initials}
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] backdrop-blur">
          New
        </span>
        <div className="absolute right-2 top-2">
          <AvailabilityBadge availability={p.availability} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{p.name}</div>
          {p.plan && (
            <div className="truncate text-xs text-muted-foreground">{p.plan}</div>
          )}
        </div>
        <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {p.category}
        </div>
      </div>
    </a>
  );
}
