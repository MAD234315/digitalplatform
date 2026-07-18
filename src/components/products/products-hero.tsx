import { useEffect, useId, useRef, useState } from "react";
import { Package, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";


/**
 * Header block for the /products page. Reuses the shared PageHero for the
 * eyebrow / headline / lede, and passes a live-status card as the aside slot.
 */
export function ProductsHero({
  productCount,
  inStockCount,
  limitedCount = 0,
  latestCount = 0,
  updatedAt,
  isRefreshing = false,
  onShowLatest,
}: {
  productCount: number;
  inStockCount: number;
  limitedCount?: number;
  latestCount?: number;
  updatedAt: number;
  isRefreshing?: boolean;
  onShowLatest?: () => void;
}) {
  return (
    <header className="relative border-b border-border">
      <PageHero
        size="wide"
        eyebrow="The catalogue"
        title="Every product,"
        titleAccent="live from our shelf."
        lede={<>Updated in real-time from our internal stock sheet. Prices depend on stock availability and demand — DM us for today&apos;s rate.</>}
        aside={
          <LiveStatusCard
            productCount={productCount}
            inStockCount={inStockCount}
            limitedCount={limitedCount}
            latestCount={latestCount}
            updatedAt={updatedAt}
            isRefreshing={isRefreshing}
            onShowLatest={onShowLatest}
          />
        }
      />
    </header>
  );
}


/**
 * Smoothly counts up from 0 → target when it first appears in the viewport.
 * Purely visual; the underlying number is passed through unchanged for a11y.
 */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const from = 0;
      const to = Math.max(0, Math.floor(target));
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(from + (to - from) * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) start();
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, durationMs]);

  // If the target changes after animation, snap to it.
  useEffect(() => {
    if (startedRef.current) setValue(Math.max(0, Math.floor(target)));
  }, [target]);

  return { value, ref: nodeRef };
}


function LiveStatusCard({
  productCount,
  inStockCount,
  limitedCount = 0,
  latestCount = 0,
  updatedAt,
  isRefreshing = false,
  onShowLatest,
}: {
  productCount: number;
  inStockCount: number;
  limitedCount?: number;
  latestCount?: number;
  updatedAt: number;
  isRefreshing?: boolean;
  onShowLatest?: () => void;
}) {
  const outCount = Math.max(0, productCount - inStockCount);
  const pulseCls = isRefreshing ? "animate-pulse" : "";
  const inStockPct = productCount > 0 ? Math.round((inStockCount / productCount) * 100) : 0;
  const outPct = Math.max(0, 100 - inStockPct);

  const total = useCountUp(productCount);
  const inStock = useCountUp(inStockCount);
  const latest = useCountUp(latestCount);

  // Animate the progress bar in on mount.
  const [barFilled, setBarFilled] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setBarFilled(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  // Format the timestamp only on the client — the server renders in UTC and
  // the client in the visitor's local zone, so doing this at render time
  // hydration-mismatches. Empty string on the server keeps markup identical.
  const [updatedLabel, setUpdatedLabel] = useState("");
  const [agoLabel, setAgoLabel] = useState("");
  useEffect(() => {
    setUpdatedLabel(
      new Date(updatedAt).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    const format = () => {
      const diff = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
      if (diff < 60) return `${diff}s ago`;
      const m = Math.floor(diff / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m ago`;
    };
    setAgoLabel(format());
    const id = window.setInterval(() => setAgoLabel(format()), 1000);
    return () => window.clearInterval(id);
  }, [updatedAt]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-amber/25 bg-card/60 p-6 sm:p-7 shadow-soft backdrop-blur-xl animate-fade-in"
      aria-busy={isRefreshing}
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in oklab, var(--amber) 6%, transparent), transparent 55%)",
      }}
    >
      {/* Header: LIVE badge + sync line */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-300"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
        {isRefreshing && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground" aria-live="polite">
            Refreshing…
          </span>
        )}
      </div>

      <div className="mt-2 text-sm font-medium text-foreground">
        Synced with stock sheet
      </div>

      {/* Last-updated pill */}
      <div
        className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground min-h-[22px]"
        suppressHydrationWarning
      >
        <RefreshCw aria-hidden className={`h-2.5 w-2.5 ${isRefreshing ? "animate-spin" : ""}`} />
        {updatedLabel ? (
          <>
            <span className="truncate">Updated {updatedLabel}</span>
            <span aria-hidden className="opacity-40">·</span>
            <span className="font-medium text-emerald-300">{agoLabel}</span>
          </>
        ) : (
          <span className="opacity-0">placeholder</span>
        )}
      </div>

      {/* Focal count */}
      <div className="mt-5 flex items-baseline gap-2">
        <div
          ref={total.ref}
          className={`font-display text-4xl leading-none tracking-tight ${pulseCls}`}
          aria-label={`${productCount} products listed`}
        >
          {total.value}
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Products listed
        </div>
      </div>


      {/* Stock availability progress */}
      <div className="mt-4" aria-hidden={productCount === 0}>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {inStockCount} In stock ({inStockPct}%)
          </span>
          <span className="inline-flex items-center gap-1">
            {outCount} Out ({outPct}%)
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={inStockPct}
          aria-label="Stock availability"
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/40"
        >
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{
              width: `${barFilled ? inStockPct : 0}%`,
              background:
                "linear-gradient(90deg, rgb(52 211 153), rgb(16 185 129))",
              boxShadow: "0 0 10px rgba(16,185,129,0.35)",
            }}
          />
        </div>
      </div>

      {/* Dashboard-style stat cards */}
      <dl className="mt-5 grid grid-cols-3 gap-2.5">
        <StatCard
          icon={<Package className="h-3 w-3" />}
          label="Total"
          sub="Products"
          countRef={total.ref}
        >
          <span className={pulseCls}>{total.value}</span>
        </StatCard>
        <StatCard
          icon={<CheckCircle2 className="h-3 w-3" />}
          label="In stock"
          sub="Available"
          valueClass="text-emerald-300"
          countRef={inStock.ref}
        >
          <span className={pulseCls}>{inStock.value}</span>
        </StatCard>
        <StatCard
          icon={<Sparkles className="h-3 w-3" />}
          label="Latest"
          sub="Last 7 days"
          valueClass="text-amber"
          highlight
          countRef={latest.ref}
        >
          <span className={pulseCls}>{latest.value}</span>
        </StatCard>
      </dl>


      {/* Latest CTA */}
      {onShowLatest && (
        <button
          type="button"
          onClick={onShowLatest}
          aria-label={`Show ${latestCount} product${latestCount === 1 ? "" : "s"} added in the last 7 days.`}
          className="group mt-5 flex w-full items-center justify-between gap-2 rounded-xl border border-amber/30 bg-gradient-to-r from-amber/10 via-transparent to-transparent px-3.5 py-2.5 text-left text-xs transition hover:border-amber/60 hover:shadow-[0_0_0_1px_var(--amber),0_8px_24px_-12px_var(--amber)]"
        >
          <span className="flex items-center gap-2">
            <Sparkles aria-hidden className="h-3.5 w-3.5 text-amber" />
            <span className="font-semibold uppercase tracking-[0.16em] text-[10px] text-amber">
              Latest · last 7 days
            </span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className={`font-display text-base ${pulseCls}`}>{latestCount}</span>
            <span className="text-[10px] text-muted-foreground">new arrivals →</span>
          </span>
        </button>
      )}

      {limitedCount > 0 && (
        <div
          role="status"
          title="These products have limited stock left. Order soon to avoid disappointment."
          className="mt-3 flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-3 py-2 text-xs"
        >
          <span aria-hidden className="flex h-2 w-2">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--amber)" }} />
          </span>
          <span>
            <span className="font-medium">Low stock:</span>{" "}
            <span className={pulseCls}>{limitedCount}</span> item{limitedCount === 1 ? "" : "s"} running low — grab before they&apos;re gone.
          </span>
        </div>
      )}
    </div>
  );
}


function StatCard({
  icon,
  label,
  sub,
  valueClass,
  highlight,
  countRef,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  valueClass?: string;
  highlight?: boolean;
  countRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={`group relative rounded-xl border p-2.5 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-14px_color-mix(in_oklab,var(--amber)_60%,transparent)] ${
        highlight
          ? "border-amber/40 bg-gradient-to-br from-amber/10 to-transparent"
          : "border-border/70 bg-card/60 hover:border-amber/40"
      }`}
      aria-labelledby={id}
    >
      <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
        <span
          aria-hidden
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/40 ${
            highlight ? "text-amber" : ""
          }`}
        >
          {icon}
        </span>
        <span id={id} className="min-w-0 truncate whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>

      <div
        ref={countRef}
        className={`mt-1 font-display text-xl leading-none ${valueClass ?? ""}`}
      >
        {children}
      </div>
      <div className="mt-0.5 text-[9px] text-muted-foreground">{sub}</div>
    </div>

  );
}
