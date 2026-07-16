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
  updatedAt,
  isRefreshing = false,
}: {
  productCount: number;
  inStockCount: number;
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
        <div className="bg-card px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total</dt>
          <dd className={`mt-0.5 font-display text-xl ${pulseCls}`}>{productCount}</dd>
        </div>
        <div className="bg-card px-3 py-2">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">In stock</dt>
          <dd className={`mt-0.5 font-display text-xl ${pulseCls}`} style={{ color: "var(--whatsapp)" }}>
            {inStockCount}
            {outCount > 0 && (
              <span className="ml-1 align-middle text-[10px] font-sans text-muted-foreground">
                · {outCount} out
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

