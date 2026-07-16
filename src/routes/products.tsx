import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";
import { getSheetProducts, type SheetProduct } from "@/lib/sheet-products.functions";

// Static options (not a factory) — keeps queryKey referentially stable so
// useSuspenseQuery, ensureQueryData, and any getQueryData reads share the
// same cache entry across renders.
const productsQueryOptions = queryOptions({
  queryKey: ["sheet-products"],
  queryFn: () => getSheetProducts(),
  staleTime: 60_000,          // consider fresh for 1 min
  refetchInterval: 60_000,    // live update every minute
  refetchOnWindowFocus: true,
});

const SITE = "https://digitalplatform13.lovable.app";
const PRODUCTS_URL = SITE + "/products";
const PRODUCTS_TITLE = "Digital Subscriptions & Software — Digital Platform";
const PRODUCTS_DESC = "Live catalogue of premium subscriptions, AI tools, software licenses and gift cards. Updated daily from our stock sheet. DM for live pricing.";

export const Route = createFileRoute("/products")({
  head: ({ loaderData }: { loaderData?: { products?: SheetProduct[] } }) => {
    const items = loaderData?.products?.slice(0, 20) ?? [];
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      url: PRODUCTS_URL,
      name: PRODUCTS_TITLE,
      itemListElement: items.map((p: SheetProduct, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name + (p.plan ? ` — ${p.plan}` : ""),
      })),
    };
    return {
      meta: [
        { title: PRODUCTS_TITLE },
        { name: "description", content: PRODUCTS_DESC },
        { property: "og:title", content: PRODUCTS_TITLE },
        { property: "og:description", content: PRODUCTS_DESC },
        { property: "og:url", content: PRODUCTS_URL },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: PRODUCTS_TITLE },
        { name: "twitter:description", content: PRODUCTS_DESC },
      ],
      links: [{ rel: "canonical", href: PRODUCTS_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(itemList),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
              { "@type": "ListItem", position: 2, name: "Products", item: PRODUCTS_URL },
            ],
          }),
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: Products,
});

function Products() {
  const { data, dataUpdatedAt } = useSuspenseQuery(productsQueryOptions);
  const [active, setActive] = useState<string>("All");
  const [q, setQ] = useState("");

  // Precompute a category → count map so the filter bar doesn't re-scan
  // `data.categories` for each chip on every keystroke.
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of data.categories) m.set(c.name, c.count);
    return m;
  }, [data.categories]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (needle && !`${p.name} ${p.plan} ${p.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [data.products, active, q]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />

      {/* Paper (light) theme wraps only the catalogue surface. */}
      <div className="theme-paper bg-background text-foreground">
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

          </div>
        </div>
      </header>

      {/* Sticky filter bar — remains visible while scrolling long lists */}
      <div className="sticky top-16 sm:top-20 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-3 flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filter by category"
            className="scroll-slim flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          >
            {["All", ...data.categories.map((c) => c.name)].map((name) => {
              const isActive = active === name;
              const count = name === "All" ? data.products.length : (categoryCounts.get(name) ?? 0);
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-pressed={isActive}
                  onClick={() => setActive(name)}
                  className={`whitespace-nowrap rounded-full border px-4 min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition ${
                    isActive
                      ? "border-transparent shadow-soft"
                      : "border-border bg-card hover:bg-muted hover:border-foreground/20"
                  }`}
                  style={isActive ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                >
                  {name.toLowerCase()} <span className="opacity-60">· {count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-72 lg:shrink-0">
            <label htmlFor="products-search" className="sr-only">Search products</label>
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              id="products-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-full border border-border bg-card pl-11 pr-10 min-h-10 text-sm outline-none transition focus:border-foreground/40"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>


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

      </div>
      {/* Footer sits outside `.theme-paper` so it renders in the sitewide dark palette. */}
      <SiteFooter />
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
