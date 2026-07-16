import { PageHero } from "@/components/layout/PageHero";

/**
 * Header block for the /products page. Reuses the shared PageHero for the
 * eyebrow / headline / lede, and passes a live-status card as the aside slot.
 */
export function ProductsHero({
  productCount,
  inStockCount,
  limitedCount = 0,
  updatedAt,
  isRefreshing = false,
}: {
  productCount: number;
  inStockCount: number;
  limitedCount?: number;
  updatedAt: number;
  isRefreshing?: boolean;
}) {
  return (
    <header className="relative border-b border-border">
      <PageHero
        size="wide"
        eyebrow="The catalogue"
        title="Every product,"
        titleAccent="live from our shelf."
        lede={<>Updated in real-time from our internal stock sheet. Prices depend on stock availability and demand — DM us for today&apos;s rate.</>}
        aside={<LiveStatusCard productCount={productCount} inStockCount={inStockCount} limitedCount={limitedCount} updatedAt={updatedAt} isRefreshing={isRefreshing} />}
      />
    </header>
  );
}



function LiveStatusCard({
  productCount,
  inStockCount,
  limitedCount = 0,
  updatedAt,
  isRefreshing = false,
}: {
  productCount: number;
  inStockCount: number;
  limitedCount?: number;
  updatedAt: number;
  isRefreshing?: boolean;
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
  return (
    <div className="group relative bg-card px-3 py-2">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        <span
          tabIndex={0}
          aria-label={`${label}: ${tooltip}`}
          className="inline-flex h-3 w-3 cursor-help items-center justify-center rounded-full border border-border text-[8px] font-semibold leading-none text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-amber"
        >
          i
        </span>
      </dt>
      <dd className="mt-0.5 font-display text-xl" style={valueStyle}>
        {children}
      </dd>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-52 -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-normal normal-case tracking-normal text-foreground opacity-0 shadow-soft transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {tooltip}
      </div>
    </div>
  );
}


  );
}

