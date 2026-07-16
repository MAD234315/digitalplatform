import { Link } from "@tanstack/react-router";
import { useCallback, type ComponentProps, type MouseEvent, type ReactNode } from "react";

/** Small uppercase kicker used above section headings. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] uppercase tracking-[0.22em] text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}

/** Pill badge with a pulsing gold dot. */
export function LiveBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/5 px-3 py-1.5">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: "var(--amber)" }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--amber)" }}
        />
      </span>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] font-medium text-amber">
        {children}
      </span>
    </div>
  );
}

type CtaSize = "md" | "lg";
type CtaVariant = "primary" | "outline";

const baseCta =
  "relative overflow-hidden inline-flex items-center justify-center rounded-sm font-semibold uppercase tracking-[0.14em] transition-all duration-300 will-change-transform active:translate-y-0 active:scale-[0.98]";
const sizeMap: Record<CtaSize, string> = {
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-12 px-7 text-sm",
};
const variantMap: Record<CtaVariant, string> = {
  primary: "shadow-gold hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_0_1px_oklch(0.80_0.14_82/0.4),0_18px_50px_-12px_oklch(0.80_0.14_82/0.55)]",
  outline: "border border-border bg-transparent text-foreground hover:bg-card hover:border-amber/40 hover:-translate-y-0.5",
};

function ctaClasses(variant: CtaVariant, size: CtaSize, extra = "") {
  return `${baseCta} ${sizeMap[size]} ${variantMap[variant]} ${extra}`.trim();
}

function ctaStyle(variant: CtaVariant) {
  return variant === "primary"
    ? { backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }
    : undefined;
}

/** Anchor-styled CTA (external links, mailto, tel, wa.me). */
export function CtaLink({
  variant = "primary",
  size = "lg",
  className = "",
  ...props
}: ComponentProps<"a"> & { variant?: CtaVariant; size?: CtaSize }) {
  return <a {...props} className={ctaClasses(variant, size, className)} style={ctaStyle(variant)} />;
}

/** TanStack Router Link-styled CTA. */
export function CtaRouterLink({
  variant = "primary",
  size = "lg",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: CtaVariant; size?: CtaSize }) {
  return (
    <Link
      {...(props as ComponentProps<typeof Link>)}
      className={ctaClasses(variant, size, className)}
      style={ctaStyle(variant)}
    />
  );
}

/** Small gold-tinted icon tile used in cards. */
export function AccentTile({
  children,
  size = "lg",
  className = "",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-4 w-4 text-[10px]" : size === "md" ? "h-9 w-9 text-sm" : "h-10 w-10 text-sm";
  const shape = size === "sm" ? "rounded-full" : "rounded-sm";
  return (
    <div
      aria-hidden
      className={`inline-flex ${dims} ${shape} items-center justify-center font-medium ${className}`}
      style={{
        backgroundColor: "color-mix(in oklab, var(--amber) 15%, transparent)",
        color: "var(--amber)",
      }}
    >
      {children}
    </div>
  );
}
