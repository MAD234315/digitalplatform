import { useId, useState } from "react";
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




function nextThursday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // 4 = Thursday; advance to the next occurrence, or a week ahead if today is Thu.
  const daysUntilThu = (4 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilThu);
  return d;
}

function formatResetIn(target: Date, now = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "today";
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `in ${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.max(1, Math.round(ms / 3_600_000));
  return `in ${hours} hour${hours === 1 ? "" : "s"}`;
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
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft" aria-busy={isRefreshing}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Live status</div>
        {isRefreshing && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground" aria-live="polite">
            Refreshing…
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "var(--whatsapp)" }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--whatsapp)" }} />
        </span>
        Synced with stock sheet
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Last update: {new Date(updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className={`font-display text-4xl ${pulseCls}`}>{productCount}</div>
        <div className="text-xs text-muted-foreground">products listed</div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <StatTile
          label="Total"
          tooltip="Every product currently listed in the catalogue, across all categories."
        >
          <span className={pulseCls}>{productCount}</span>
        </StatTile>
        <StatTile
          label="In stock"
          tooltip={`Available to order right now${outCount > 0 ? ` — ${outCount} item${outCount === 1 ? "" : "s"} temporarily out.` : "."}`}
          valueStyle={{ color: "var(--whatsapp)" }}
        >
          <span className={pulseCls}>{inStockCount}</span>
          {outCount > 0 && (
            <span className="ml-1 align-middle text-[10px] font-sans text-muted-foreground">
              · {outCount} out
            </span>
          )}
        </StatTile>
      </dl>
      <button
        type="button"
        onClick={onShowLatest}
        disabled={!onShowLatest}
        aria-label={`Show ${latestCount} product${latestCount === 1 ? "" : "s"} added this week. Resets ${resetLabel} on Thursday.`}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition hover:border-foreground/30 hover:bg-muted disabled:cursor-default disabled:hover:border-border disabled:hover:bg-card"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
          <span className="font-medium uppercase tracking-[0.14em] text-[10px]">Latest this week</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className={`font-display text-base ${pulseCls}`}>{latestCount}</span>
          <span className="text-[10px] text-muted-foreground">· resets {resetLabel}</span>
        </span>
      </button>
      {limitedCount > 0 && (
        <div
          role="status"
          title="These products have limited stock left. Order soon to avoid disappointment."
          className="mt-3 flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs"
        >
          <span aria-hidden className="flex h-2 w-2">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--amber)" }} />
          </span>
          <span>
            <span className="font-medium">Low stock warning:</span>{" "}
            <span className={pulseCls}>{limitedCount}</span> item{limitedCount === 1 ? "" : "s"} running low — grab before they&apos;re gone.
          </span>
        </div>
      )}
    </div>
  );
}


function StatTile({
  label,
  tooltip,
  valueStyle,
  children,
}: {
  label: string;
  tooltip: string;
  valueStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  // Dismiss on Escape per WAI-ARIA APG tooltip pattern.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="relative bg-card px-3 py-2" onKeyDown={onKeyDown}>
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        <button
          type="button"
          aria-label={`About ${label}`}
          aria-describedby={tooltipId}
          aria-expanded={open}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-5 w-5 min-h-5 min-w-5 cursor-help items-center justify-center rounded-full border border-border text-[9px] font-semibold leading-none text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-1 focus-visible:ring-offset-card"
        >
          <span aria-hidden>i</span>
        </button>
      </dt>
      <dd className="mt-0.5 font-display text-xl" style={valueStyle}>
        {children}
      </dd>
      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={`pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-52 -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-normal normal-case tracking-normal text-foreground shadow-soft transition-opacity duration-150 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {tooltip}
      </div>
    </div>
  );
}




