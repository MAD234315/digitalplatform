/**
 * Header block for the /products page. Shows the section headline plus a
 * live-status card with the last sync timestamp and total product count.
 */
export function ProductsHero({ productCount, updatedAt }: { productCount: number; updatedAt: number }) {

  return (
    <header className="relative border-b border-border">
      <div className="absolute inset-0 bg-hero" aria-hidden />
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-36 pb-14">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">The catalogue</div>
              <h1 className="mt-4 font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98]">
                Every product,
                <br />
                <em className="italic" style={{ color: "var(--accent)" }}>live from our shelf.</em>
              </h1>
              <p className="mt-6 max-w-xl text-muted-foreground">
                Updated in real-time from our internal stock sheet. Prices depend on stock availability
                and demand — DM us for today&apos;s rate.
              </p>
            </div>
            <div className="lg:col-span-4">
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
