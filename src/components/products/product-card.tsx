/**
 * Product card rendered inside the /products grid.
 *
 * Memoised because the grid can render 200+ cards. The `updatedAt` value
 * (which changes on every 60s refetch) is intentionally NOT a prop — it's
 * consumed via context by a small subcomponent, so a fresh timestamp only
 * re-renders the one line that shows it, not the whole card.
 */
import { createContext, memo, useContext } from "react";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { CONTACT } from "@/components/site-chrome";
import { AvailabilityBadge, Badge } from "./badge";
import { WaGlyph } from "./wa-glyph";
import { animeImageFor, formatRelative, gradientFor, initialsFor } from "@/lib/product-visuals";

/** Injects the current dataUpdatedAt into cards without breaking memoisation. */
export const UpdatedAtContext = createContext<number>(0);

function LastUpdatedLine() {
  const updatedAt = useContext(UpdatedAtContext);
  return (
    <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "var(--whatsapp)" }}
      />
      <span suppressHydrationWarning>Last updated {formatRelative(updatedAt)}</span>
    </div>
  );
}

/** Inline "Label - value" spec line inside the card. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <dt className="text-muted-foreground">{label} -</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}


export const ProductCard = memo(function ProductCard({
  p,
  onView,
}: {
  p: SheetProduct;
  onView?: (p: SheetProduct) => void;
}) {
  const waMsg = encodeURIComponent(
    `Hi, I'm interested in ${p.name}${p.plan ? ` (${p.plan})` : ""}${p.validity ? ` — ${p.validity}` : ""}. Please share the price.`,
  );
  const initials = initialsFor(p.name);

  return (
    <article
      id={`product-${p.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-0.5 hover:shadow-soft hover:border-foreground/20 focus-within:-translate-y-0.5 focus-within:shadow-soft scroll-mt-32"
      style={{ contentVisibility: "auto", containIntrinsicSize: "520px 380px" }}
    >
      <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-soft"
            style={{ background: gradientFor(p.name) }}
          >
            <img
              src={animeImageFor(p.name)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-8 w-8 object-contain drop-shadow-sm"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>


          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1 font-display text-[10px]"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {initials}
            </span>
            <span className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {p.category}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {p.badges.includes("new") && <Badge tone="new">🆕 New</Badge>}
          {p.badges.includes("high-demand") && <Badge tone="hot">🔥 Hot</Badge>}
          {p.loot && <Badge tone="loot">Loot</Badge>}
          <AvailabilityBadge availability={p.availability} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
        {p.plan && <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{p.plan}</div>}



        <dl className="mt-4 space-y-1.5 text-sm">
          {p.plan && <Row label="Plan" value={p.plan} />}
          {p.validity && <Row label="Validity" value={p.validity} />}
          <Row label="Type" value={p.type || "—"} />
          <Row label="Supports" value={p.supports || "—"} />
          {p.warranty && <Row label="Warranty" value={p.warranty} />}
        </dl>




        <p className="mt-3 text-[11px] text-muted-foreground">
          Contact admin for detailed info.
        </p>


        <LastUpdatedLine />

        <a
          href={`${CONTACT.WA_URL}?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => onView?.(p)}
          aria-label={`Quick DM for offer price on WhatsApp about ${p.name}`}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
          style={{ backgroundColor: "var(--whatsapp)" }}
        >
          <WaGlyph /> Quick DM for Offer Price
        </a>
      </div>
    </article>
  );
});
