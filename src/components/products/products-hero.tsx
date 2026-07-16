import { PageHero } from "@/components/layout/PageHero";

/**
 * Header block for the /products page. Reuses the shared PageHero for the
 * eyebrow / headline / lede, and passes a live-status card as the aside slot.
 */
export function ProductsHero({ productCount, updatedAt }: { productCount: number; updatedAt: number }) {
  return (
    <header className="relative border-b border-border">
      <PageHero
        size="wide"
        eyebrow="The catalogue"
        title="Every product,"
        titleAccent="live from our shelf."
        lede={<>Updated in real-time from our internal stock sheet. Prices depend on stock availability and demand — DM us for today&apos;s rate.</>}
        aside={<LiveStatusCard productCount={productCount} updatedAt={updatedAt} />}
      />
    </header>
  );
}

function LiveStatusCard({ productCount, updatedAt }: { productCount: number; updatedAt: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Live status</div>
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
        <div className="font-display text-4xl">{productCount}</div>
        <div className="text-xs text-muted-foreground">products listed</div>
      </div>
    </div>
  );
}
