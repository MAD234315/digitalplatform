import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";
import { getSheetProducts, type SheetProduct } from "@/lib/sheet-products.functions";

const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["sheet-products"],
    queryFn: () => getSheetProducts(),
    staleTime: 60_000,          // consider fresh for 1 min
    refetchInterval: 60_000,    // live update every minute
    refetchOnWindowFocus: true,
  });

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Digital Platform" },
      { name: "description", content: "Live catalogue of premium subscriptions, AI tools, software licenses and gift cards. Updated daily from our stock sheet." },
      { property: "og:title", content: "Products — Digital Platform" },
      { property: "og:description", content: "Live catalogue. Updated daily. DM for prices." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions()),
  component: Products,
});

function Products() {
  const { data, dataUpdatedAt } = useSuspenseQuery(productsQueryOptions());
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return data.products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (q && !`${p.name} ${p.plan} ${p.category}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data.products, active, q]);

  return (
    <div className="theme-paper min-h-screen bg-background text-foreground">
      {/* HEADER — light theme */}
      <SiteNav />
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
                    Last update: {new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <div className="font-display text-4xl">{data.products.length}</div>
                    <div className="text-xs text-muted-foreground">products listed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", ...data.categories.map((c) => c.name)].map((name) => {
                  const isActive = active === name;
                  const count = name === "All" ? data.products.length : (data.categories.find((c) => c.name === name)?.count ?? 0);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setActive(name)}
                      aria-pressed={isActive}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition ${
                        isActive
                          ? "border-transparent shadow-soft"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                      style={isActive ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                    >
                      {name.toLowerCase()} <span className="opacity-60">· {count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative min-w-[240px]">
                <label htmlFor="products-search" className="sr-only">Search products</label>
                <input
                  id="products-search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  className="w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm outline-none focus:border-foreground/40"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* GRID */}
      <main className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
        {data.error && (
          <div className="mb-6 rounded-xl border border-danger/40 p-4 text-sm" style={{ color: "var(--danger)" }}>
            Couldn&apos;t load the live sheet ({data.error}). Please retry shortly.
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            No products match this filter. Try another category.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Prices depend on stock &amp; demand — <span className="font-medium text-foreground">contact admin for detailed info.</span>
        </p>
      </main>

      <div className="theme-paper--reset">
        <SiteFooter />
      </div>
    </div>
  );
}

function PaperNav() {
  return (
    <div className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-foreground">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg font-display text-xl" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>D</span>
          <span className="leading-tight">
            <span className="block font-display text-lg">Digital Platform</span>
            <span className="block text-[10px] uppercase tracking-[0.22em] opacity-60">Live catalogue</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-9 text-sm">
          <Link to="/" className="opacity-70 hover:opacity-100">Home</Link>
          <Link to="/products" className="opacity-100">Products</Link>
          <Link to="/about" className="opacity-70 hover:opacity-100">About</Link>
          <Link to="/contact" className="opacity-70 hover:opacity-100">Contact</Link>
        </nav>
        <a
          href={CONTACT.WA_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--whatsapp)" }}
        >
          <WaGlyph /> Quick DM
        </a>
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: SheetProduct }) {
  const waMsg = encodeURIComponent(`Hi, I'm interested in ${p.name}${p.plan ? ` (${p.plan})` : ""}${p.validity ? ` — ${p.validity}` : ""}. Please share the price.`);
  const initials = p.name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || p.name.slice(0, 2).toUpperCase();

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-soft">
      {/* image + logo tile */}
      <div className="relative aspect-[5/3] overflow-hidden" style={{ background: gradientFor(p.name) }}>
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(closest-side at 30% 30%, rgba(255,255,255,0.5), transparent 70%)" }} />
        <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white font-display text-lg shadow-soft" style={{ color: "var(--primary)" }}>
          {initials}
        </div>
        <div className="absolute right-4 top-4 flex gap-1.5">
          {p.loot && (
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: "var(--accent)" }}>
              Loot
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${p.inStock ? "text-white" : "bg-black/70 text-white"}`}
            style={p.inStock ? { backgroundColor: "var(--whatsapp)" } : undefined}
          >
            {p.inStock ? "In stock" : "Out"}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 text-[10px] uppercase tracking-[0.18em] text-white/85">
          {p.category}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
        {p.plan && <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{p.plan}</div>}

        {p.originalPrice && (
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground line-through">{p.originalPrice}</span>
          </div>
        )}

        <dl className="mt-4 space-y-1.5 text-sm">
          {p.validity && <Row label="Validity" value={p.validity} />}
          {p.type && <Row label="Delivery" value={p.type} />}
          {p.warranty && <Row label="Warranty" value={p.warranty} />}
        </dl>

        <p className="mt-4 text-[11px] text-muted-foreground">Contact admin for detailed info.</p>

        <a
          href={`${CONTACT.WA_URL}?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105"
          style={{ backgroundColor: "var(--whatsapp)" }}
        >
          <WaGlyph /> Offer: Quick DM
        </a>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function WaGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3 17l-1 5 5.2-1.3A11 11 0 1 0 20.5 3.5Zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21.5Zm5.2-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.2.2-.3.2-.6 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.3s.9 2.7 1 2.9c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.3-.1-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

// Deterministic accent gradient per product name for visual variety
function gradientFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${h2} 75% 40%))`;
}
