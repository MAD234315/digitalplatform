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
import { formatRelative, gradientFor, initialsFor } from "@/lib/product-visuals";
import { LogoMark } from "./logo-mark";


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

/** Compact info chip used in the card header strip. */
function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "category" | "fresh" | "delivery" | "warranty";
}) {
  const style: React.CSSProperties =
    tone === "fresh"
      ? { backgroundColor: "color-mix(in oklab, var(--whatsapp) 14%, transparent)", color: "var(--whatsapp)", borderColor: "color-mix(in oklab, var(--whatsapp) 32%, transparent)" }
      : tone === "delivery"
      ? { backgroundColor: "color-mix(in oklab, var(--amber) 14%, transparent)", color: "var(--amber)", borderColor: "color-mix(in oklab, var(--amber) 32%, transparent)" }
      : tone === "warranty"
      ? { backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)", color: "var(--foreground)", borderColor: "color-mix(in oklab, var(--primary) 28%, transparent)" }
      : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderColor: "var(--border)" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
      style={style}
    >
      {children}
    </span>
  );
}



export const ProductCard = memo(function ProductCard({
  p,
  onView,
  isLatest = false,
}: {
  p: SheetProduct;
  onView?: (p: SheetProduct) => void;
  isLatest?: boolean;
}) {
  const waMsg = encodeURIComponent(
    [
      `👋 Hello Creator,`,
      ``,
      `I'm interested in this product.`,
      ``,
      `📦 Product: ${p.name || "—"}`,
      `💎 Plan: ${p.plan || "—"}`,
      `📅 Validity: ${p.validity || "—"}`,
      `🏷️ Sub Type: ${p.type || "—"}`,
      `🛡️ Warranty: ${p.warranty || "—"}`,
      ``,
      `Please let me know the product price.`,
      `Thank you!`,
    ].join("\n"),
  );
  const initials = initialsFor(p.name);
  const deliveryTime = p.availability === "out" ? "On restock" : "Instant";

  return (
    <article
      id={`product-${p.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition duration-300 hover:-translate-y-1 focus-within:-translate-y-1 scroll-mt-32"
    >


      <div className="relative flex flex-col gap-2 px-3 py-2.5 border-b border-border">

        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border"
            style={{ background: gradientFor(p.name) }}
          >
            <LogoMark name={p.name} size={26} />

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

        <div className="flex min-h-[1.75rem] flex-wrap items-center gap-1">
          {p.badges.includes("new") && <Badge tone="new">🆕 New</Badge>}
          {p.badges.includes("high-demand") && <Badge tone="hot">🔥 Hot</Badge>}
          {p.loot && <Badge tone="loot">Loot</Badge>}
          <AvailabilityBadge availability={p.availability} />
        </div>

      </div>


      <div className="relative flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="min-h-[3.75rem] font-display text-2xl leading-tight">{p.name}</h3>
          {p.plan && <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{p.plan}</div>}

          <dl className="mt-4 space-y-1.5 text-sm">
            {p.plan && <Row label="Plan" value={p.plan} />}
            {p.validity && <Row label="Validity" value={p.validity} />}
            <Row label="Type" value={p.type || "—"} />
            <Row label="Supports" value={p.supports || "—"} />
            {p.warranty && <Row label="Warranty" value={p.warranty} />}
          </dl>
        </div>

        <div className="pt-4">
          <p className="text-[11px] text-muted-foreground">
            Contact admin for detailed info.
          </p>

          <LastUpdatedLine />

          {p.availability === "out" ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label={`${p.name} is out of stock`}
              className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold opacity-60"
              style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              Out of Stock
            </button>
          ) : (
            <a
              href={`${CONTACT.WA_URL}?text=${waMsg}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onView?.(p)}
              aria-label={`Quick DM for offer price on WhatsApp about ${p.name}`}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
              style={{ backgroundColor: "var(--whatsapp)" }}
            >
              <WaGlyph /> Quick DM for Offer Price
            </a>
          )}
        </div>
      </div>

    </article>
  );
});
