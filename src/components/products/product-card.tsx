/**
 * Premium product card — dashboard-grade visual treatment.
 *
 * Keeps all original data, WhatsApp CTA logic and memoisation semantics.
 * Only the visual layer is redesigned: gold-bordered glass surface, iconified
 * spec rows, animated availability pill, and premium CTAs.
 */
import { createContext, memo, useContext } from "react";
import { Calendar, Clock, Tag, Monitor, ShieldCheck, Info, Lock, Star } from "lucide-react";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { CONTACT } from "@/components/site-chrome";
import { WaGlyph } from "./wa-glyph";
import { Badge } from "./badge";
import { formatRelative, gradientFor, initialsFor } from "@/lib/product-visuals";
import { LogoMark } from "./logo-mark";

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
    <div className="flex items-start gap-2.5 py-2 text-sm">
      <Icon size={14} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} aria-hidden />
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="ml-auto text-right font-medium text-foreground break-words">{value}</span>
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
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-white/90" style={{ animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }} />
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white" />
      </span>
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

  const specs: Array<{ icon: typeof Calendar; label: string; value: string } | null> = [
    p.plan ? { icon: Calendar, label: "Plan", value: p.plan } : null,
    p.validity ? { icon: Clock, label: "Validity", value: p.validity } : null,
    { icon: Tag, label: "Type", value: p.type || "—" },
    { icon: Monitor, label: "Supports", value: p.supports || "—" },
    p.warranty ? { icon: ShieldCheck, label: "Warranty", value: p.warranty } : null,
  ];

  return (
    <article
      id={`product-${p.id}`}
      className="group relative flex h-full flex-col overflow-hidden scroll-mt-32 transition duration-300 ease-out hover:-translate-y-1"
      style={{
        borderRadius: "20px",
        background:
          "linear-gradient(160deg, color-mix(in oklab, var(--card) 92%, transparent) 0%, color-mix(in oklab, var(--background) 96%, transparent) 100%)",
        border: "1px solid color-mix(in oklab, var(--primary) 28%, transparent)",
        boxShadow:
          "0 0 0 1px color-mix(in oklab, var(--primary) 8%, transparent), 0 10px 30px -18px rgba(0,0,0,0.55)",
        backdropFilter: "blur(12px) saturate(140%)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 0 1px color-mix(in oklab, var(--primary) 45%, transparent), 0 20px 50px -20px color-mix(in oklab, var(--primary) 55%, transparent), 0 0 40px -12px color-mix(in oklab, var(--primary) 35%, transparent)";
        e.currentTarget.style.borderColor = "color-mix(in oklab, var(--primary) 55%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 0 1px color-mix(in oklab, var(--primary) 8%, transparent), 0 10px 30px -18px rgba(0,0,0,0.55)";
        e.currentTarget.style.borderColor = "color-mix(in oklab, var(--primary) 28%, transparent)";
      }}
    >
      {/* Header */}
      <div className="relative flex items-start gap-3 p-5 pb-4">
        <div
          aria-hidden
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
          style={{
            background: gradientFor(p.name),
            boxShadow: "0 6px 18px -6px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <LogoMark name={p.name} size={32} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--accent) 18%, transparent))",
                color: "var(--primary)",
                border: "1px solid color-mix(in oklab, var(--primary) 40%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded px-1 font-display text-[9px]"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {initials}
              </span>
              <span className="truncate">{p.category}</span>
            </span>
          </div>
          <h3 className="mt-2 font-display text-[1.4rem] leading-tight tracking-tight text-foreground line-clamp-2 min-h-[3.4rem]">
            {p.name}
          </h3>
        </div>

        <button
          type="button"
          aria-label="Favourite (coming soon)"
          disabled
          className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-60 transition hover:text-primary hover:opacity-100"
        >
          <Star size={16} aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-5">
        <AvailabilityPill availability={p.availability} />
        {p.badges.includes("new") && <Badge tone="new">🆕 New</Badge>}
        {p.badges.includes("high-demand") && <Badge tone="hot">🔥 Hot</Badge>}
        {p.loot && <Badge tone="loot">Loot</Badge>}
      </div>

      {/* Specs */}
      <dl className="mt-3 flex-1 divide-y px-5" style={{ borderColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}>
        {specs.filter(Boolean).map((s, i) => (
          <SpecRow key={i} icon={s!.icon} label={s!.label} value={s!.value} />
        ))}
      </dl>

      {/* Info card */}
      <div
        className="mx-5 mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[11px] leading-snug text-muted-foreground"
        style={{
          background: "color-mix(in oklab, var(--primary) 5%, transparent)",
          border: "1px dashed color-mix(in oklab, var(--primary) 32%, transparent)",
        }}
      >
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} aria-hidden />
        <div>
          <div className="font-semibold text-foreground">Need more information?</div>
          <div>Contact us on WhatsApp for complete details.</div>
        </div>
      </div>

      {/* CTA + footer */}
      <div className="p-5 pt-4">
        {isOut ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label={`${p.name} is out of stock`}
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              background: "color-mix(in oklab, var(--muted) 70%, transparent)",
              color: "var(--muted-foreground)",
              border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
            }}
          >
            <Lock size={15} aria-hidden />
            Currently Out of Stock
          </button>
        ) : (
          <a
            href={`${CONTACT.WA_URL}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => onView?.(p)}
            aria-label={`Quick DM for offer price on WhatsApp about ${p.name}`}
            className="group/cta relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
              boxShadow: "0 8px 24px -10px rgba(37,211,102,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 12px 30px -8px rgba(37,211,102,0.75), 0 0 30px -6px rgba(37,211,102,0.5), inset 0 0 0 1px rgba(255,255,255,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 8px 24px -10px rgba(37,211,102,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)";
            }}
          >
            <WaGlyph />
            Quick DM for Offer Price
          </a>
        )}

        <div className="mt-3 flex items-center justify-between">
          <LastUpdatedLine />
        </div>
      </div>
    </article>
  );
});
