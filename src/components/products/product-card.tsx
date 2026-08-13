/**
 * Premium product card — dashboard-grade visual treatment.
 *
 * Keeps all original data, WhatsApp CTA logic and memoisation semantics.
 * Only the visual layer is redesigned: gold-bordered glass surface, iconified
 * spec rows, animated availability pill, and premium CTAs.
 */
import { createContext, memo, useContext, useState } from "react";
import { Calendar, Clock, Info, Lock, Star, FileText } from "lucide-react";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { CONTACT } from "@/components/site-chrome";
import { WaGlyph } from "./wa-glyph";
import { Badge } from "./badge";
import { formatRelative, gradientFor, initialsFor } from "@/lib/product-visuals";
import { LogoMark } from "./logo-mark";
import { ProductInfoDialog } from "./product-info-dialog";


/** Injects the current dataUpdatedAt into cards without breaking memoisation. */
export const UpdatedAtContext = createContext<number>(0);

function LastUpdatedLine() {
  const updatedAt = useContext(UpdatedAtContext);
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span aria-hidden className="relative inline-flex h-1.5 w-1.5">
        <span
          className="absolute inset-0 rounded-full opacity-70"
          style={{ backgroundColor: "var(--whatsapp)" }}
        />
        <span className="relative inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--whatsapp)" }} />
      </span>
      <span suppressHydrationWarning>Last updated {formatRelative(updatedAt)}</span>
    </div>
  );
}

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Icon size={13} className="shrink-0" style={{ color: "var(--primary)" }} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="break-words text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function AvailabilityPill({ availability }: { availability: SheetProduct["availability"] }) {
  if (availability === "out") {
    return (
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
        style={{
          background: "linear-gradient(135deg, #e5484d, #b3261e)",
          boxShadow: "0 0 18px -4px rgba(229,72,77,0.55), 0 0 0 1px rgba(229,72,77,0.35)",
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" />
        Out of Stock
      </span>
    );
  }
  if (availability === "limited") {
    return (
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{
          background: "linear-gradient(135deg, #f4b740, #d68a10)",
          color: "#2a1a00",
          boxShadow: "0 0 18px -4px rgba(244,183,64,0.5), 0 0 0 1px rgba(244,183,64,0.35)",
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-black/80" />
        Limited Stock
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
      style={{
        background: "linear-gradient(135deg, #22c55e, #15803d)",
        boxShadow: "0 0 18px -4px rgba(34,197,94,0.55), 0 0 0 1px rgba(34,197,94,0.35)",
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
      Available Now
    </span>
  );
}

export const ProductCard = memo(function ProductCard({
  p,
  onView,
}: {
  p: SheetProduct;
  onView?: (p: SheetProduct) => void;
  isLatest?: boolean;
}) {
  const waMsg = encodeURIComponent(
    [
      `Hello Creator,`,
      ``,
      `I'm interested in this product.`,
      ``,
      p.name && `📦 Product: ${p.name}`,
      p.plan && `💎 Plan: ${p.plan}`,
      p.validity && `📅 Validity: ${p.validity}`,
      p.type && `🏷️ Type: ${p.type}`,
      p.warranty && `🛡️ Warranty: ${p.warranty}`,
      ``,
      `Please let me know the purchase price.`,
      `Thank you!`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const initials = initialsFor(p.name);
  const isOut = p.availability === "out";
  const [infoOpen, setInfoOpen] = useState(false);

  const specs: Array<{ icon: typeof Calendar; label: string; value: string } | null> = [
    p.plan ? { icon: Calendar, label: "Plan", value: p.plan } : null,
    p.validity ? { icon: Clock, label: "Validity", value: p.validity } : null,
  ];


  return (
    <article
      id={`product-${p.id}`}
      className="relative flex h-full flex-col overflow-hidden scroll-mt-32"
      style={{
        borderRadius: "16px",
        background:
          "linear-gradient(160deg, color-mix(in oklab, var(--card) 92%, transparent) 0%, color-mix(in oklab, var(--background) 96%, transparent) 100%)",
        border: "1px solid color-mix(in oklab, var(--primary) 28%, transparent)",
        boxShadow:
          "0 0 0 1px color-mix(in oklab, var(--primary) 8%, transparent), 0 10px 30px -18px rgba(0,0,0,0.55)",
        backdropFilter: "blur(12px) saturate(140%)",
      }}
    >
      {/* Header */}
      <div className="relative flex items-start gap-3 p-4 pb-3">
        <div
          aria-hidden
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: gradientFor(p.name),
            boxShadow: "0 6px 18px -6px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <LogoMark name={p.name} size={28} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{
                background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--accent) 18%, transparent))",
                color: "var(--primary)",
                border: "1px solid color-mix(in oklab, var(--primary) 40%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="inline-flex h-3 min-w-3 items-center justify-center rounded px-1 font-display text-[8px]"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {initials}
              </span>
              <span className="truncate">{p.category}</span>
            </span>
          </div>
          <h3 className="mt-1.5 font-display text-[1.15rem] leading-tight tracking-tight text-foreground line-clamp-2 min-h-[2.8rem]">
            {p.name}
          </h3>
        </div>

        <button
          type="button"
          aria-label="Favourite (coming soon)"
          disabled
          className="shrink-0 rounded-full p-1 text-muted-foreground opacity-60"
        >
          <Star size={15} aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-4">
        <AvailabilityPill availability={p.availability} />
        {p.badges.includes("new") && <Badge tone="new">🆕 New</Badge>}
        {p.badges.includes("high-demand") && <Badge tone="hot">🔥 Hot</Badge>}
        {p.loot && <Badge tone="loot">Loot</Badge>}
      </div>

      {/* Specs */}
      <dl className="mt-2 flex-1 divide-y px-4" style={{ borderColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}>
        {specs.filter(Boolean).map((s, i) => (
          <SpecRow key={i} icon={s!.icon} label={s!.label} value={s!.value} />
        ))}
      </dl>

      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label={`View full info about ${p.name}`}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-semibold"
          style={{
            background: "color-mix(in oklab, var(--primary) 10%, transparent)",
            color: "var(--primary)",
            border: "1px solid color-mix(in oklab, var(--primary) 38%, transparent)",
          }}
        >
          <FileText size={14} aria-hidden />
          View Full Info
        </button>
      </div>

      {infoOpen && <ProductInfoDialog product={p} onClose={() => setInfoOpen(false)} />}

      {/* Info card */}
      <div
        className="mx-4 mt-3 flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] leading-snug text-muted-foreground"
        style={{
          background: "color-mix(in oklab, var(--primary) 5%, transparent)",
          border: "1px dashed color-mix(in oklab, var(--primary) 32%, transparent)",
        }}
      >
        <Info size={13} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} aria-hidden />
        <div>
          <div className="font-semibold text-foreground">Need more info?</div>
          <div>WhatsApp us for complete details.</div>
        </div>
      </div>

      {/* CTA + footer */}
      <div className="p-4 pt-3">
        {isOut ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label={`${p.name} is out of stock`}
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold"
            style={{
              background: "color-mix(in oklab, var(--muted) 70%, transparent)",
              color: "var(--muted-foreground)",
              border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
            }}
          >
            <Lock size={14} aria-hidden />
            Currently Out of Stock
          </button>
        ) : (
          <a
            href={`${CONTACT.WA_URL}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => onView?.(p)}
            aria-label={`Quick DM for offer price on WhatsApp about ${p.name}`}
            className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
              boxShadow: "0 8px 24px -10px rgba(37,211,102,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          >
            <WaGlyph />
            Quick DM for Offer Price
          </a>
        )}

        <div className="mt-2 flex items-center justify-between">
          <LastUpdatedLine />
        </div>
      </div>
    </article>
  );
});
