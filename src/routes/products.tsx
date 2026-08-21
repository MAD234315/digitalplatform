import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSheetProducts, type Availability, type SheetProduct } from "@/lib/sheet-products.functions";
import { getSiteStatus } from "@/lib/admin.functions";
import { TiltCard } from "@/components/tilt-card";
import { OG_IMAGE, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/site-config";
import { useRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";
import { ProductCard, UpdatedAtContext } from "@/components/products/product-card";
import { ProductsHero } from "@/components/products/products-hero";
import { ProductsFilterBar } from "@/components/products/products-filter-bar";

import { RecentlyViewed } from "@/components/products/recently-viewed";
import { RecentlyAdded } from "@/components/products/recently-added";
import { useProductsFilter } from "@/components/products/use-products-filter";
import { ActiveFilters } from "@/components/products/active-filters";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorBoundary } from "@/components/error-boundary";


// Static options (not a factory) — keeps queryKey referentially stable so
// useSuspenseQuery, ensureQueryData, and any getQueryData reads share the
// same cache entry across renders.
const productsQueryOptions = queryOptions({
  queryKey: ["sheet-products"],
  queryFn: () => getSheetProducts(),
  // 5 min fresh, 5 min poll, no polling while tab hidden — cuts worker load
  // and mobile battery/data ~5x vs 60s while still feeling "live".
  staleTime: 5 * 60_000,
  refetchInterval: 5 * 60_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  gcTime: 30 * 60_000,
});


const PRODUCTS_URL = SITE_URL + "/products";
const PRODUCTS_TITLE = "Digital Subscriptions & Software — Digital Platform";
const PRODUCTS_DESC = "Live catalogue of premium subscriptions, AI tools, software licenses and gift cards. Updated daily from our stock sheet. DM for live pricing.";

function availabilityToSchema(a: Availability): string {
  if (a === "out") return "https://schema.org/OutOfStock";
  if (a === "limited") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/InStock";
}

export const Route = createFileRoute("/products")({
  head: ({ loaderData }: { loaderData?: { products?: SheetProduct[] } }) => {
    const items = loaderData?.products?.slice(0, 20) ?? [];
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      url: PRODUCTS_URL,
      name: PRODUCTS_TITLE,
      numberOfItems: items.length,
      itemListElement: items.map((p: SheetProduct, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name + (p.plan ? ` — ${p.plan}` : ""),
          category: p.category,
          brand: { "@type": "Brand", name: "Digital Platform" },
          offers: {
            "@type": "Offer",
            availability: availabilityToSchema(p.availability),
            priceCurrency: "INR",
            price: "0",
            url: PRODUCTS_URL,
            seller: { "@id": ORG_ID },
          },
        },
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
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:alt", content: "Digital Platform — live product catalogue" },
        { name: "twitter:title", content: PRODUCTS_TITLE },
        { name: "twitter:description", content: PRODUCTS_DESC },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: PRODUCTS_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            url: PRODUCTS_URL,
            name: PRODUCTS_TITLE,
            description: PRODUCTS_DESC,
            isPartOf: { "@id": WEBSITE_ID },
            publisher: { "@id": ORG_ID },
          }),
        },
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
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
              { "@type": "ListItem", position: 2, name: "Products", item: PRODUCTS_URL },
            ],
          }),
        },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: Products,
  errorComponent: ProductsError,
  notFoundComponent: ProductsNotFound,
});

function ProductsError({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">The catalogue is offline.</h1>
        <p className="mt-3 text-muted-foreground">
          {error?.message || "We couldn't reach the live stock sheet just now."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground"
        >
          Retry
        </button>
      </div>
    </PageShell>
  );
}

function ProductsNotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Nothing here.</h1>
        <p className="mt-3 text-muted-foreground">This part of the catalogue doesn&apos;t exist.</p>
      </div>
    </PageShell>
  );
}

function Products() {
  const { data, dataUpdatedAt, isFetching } = useSuspenseQuery(productsQueryOptions);
  const statusFn = useServerFn(getSiteStatus);
  const { data: siteStatus } = useQuery({
    queryKey: ["site-status"],
    queryFn: () => statusFn(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const isMaintenance = siteStatus?.online === false;

  const { active, setActive, q, setQ, stock, setStock, sort, setSort, stockCounts, filtered, categoryCounts, recentlyUpdatedProducts, latestIds } = useProductsFilter(
    data.products,
    data.categories,
    data.sourceUrl ?? "",
  );

  const { items: recent, track, clear } = useRecentlyViewed();

  // Only surface recents that still exist in the live catalogue, and skip
  // whatever is being filtered — jumping to a hidden card would confuse users.
  const recentVisible = useMemo(() => {
    const byId = new Map(data.products.map((p) => [p.id, p] as const));
    return recent
      .map((r) => ({ recent: r, product: byId.get(r.id) }))
      .filter((x): x is { recent: RecentItem; product: SheetProduct } => Boolean(x.product));
  }, [recent, data.products]);

  // Single pass over products to compute availability tallies — avoids two
  // full filter() sweeps on every render of the products page.
  const { inStockCount, limitedCount } = useMemo(() => {
    let inStock = 0;
    let limited = 0;
    for (const p of data.products) {
      if (p.availability !== "out") inStock++;
      if (p.availability === "limited") limited++;
    }
    return { inStockCount: inStock, limitedCount: limited };
  }, [data.products]);




  return (
    <PageShell>
      <ProductsHero
        productCount={data.products.length}
        inStockCount={inStockCount}
        limitedCount={limitedCount}
        latestCount={stockCounts.latest}
        updatedAt={dataUpdatedAt}
        isRefreshing={isFetching}
        onShowLatest={() => setStock("latest")}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 pt-4 flex flex-col items-center gap-1">
        <p className="text-center text-xs text-muted-foreground">
          Clear your doubts on{" "}
          <Link to="/chat" className="font-medium text-foreground underline underline-offset-2 hover:text-amber transition-colors">
            Ask AI — CREATOR AI
          </Link>
        </p>
        <p className="text-center text-[10px] text-muted-foreground/80">
          Buying from outside India? See our{" "}
          <Link to="/global-customers" className="font-medium text-foreground/90 underline underline-offset-2 hover:text-amber transition-colors">
            Global Customers
          </Link>{" "}
          guide before ordering.
        </p>
      </div>

      {isMaintenance && (
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-8 sm:py-12">
          <div className="rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/10 to-transparent p-6 sm:p-10 text-center">
            <span className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-amber">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
              </span>
              Maintenance
            </span>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">
              Catalogue Under Maintenance
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              We&rsquo;re updating the catalogue right now. Please check back shortly, or message us on WhatsApp for urgent requests.
            </p>
            <a
              href="https://wa.me/919652191369?text=Hi%20Digital%20Platform%21%20The%20catalogue%20is%20under%20maintenance%20and%20I%27d%20like%20to%20ask%20about%20a%20product."
              className="mt-5 inline-flex items-center justify-center rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground transition hover:bg-amber/90"
              target="_blank"
              rel="noreferrer"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>
      )}

      {!isMaintenance && (
        <ProductsFilterBar
          slot="search"
          categories={data.categories.map((c) => c.name)}
          totalCount={data.products.length}
          categoryCounts={categoryCounts}
          active={active}
          onActiveChange={setActive}
          query={q}
          onQueryChange={setQ}
          stock={stock}
          onStockChange={setStock}
          stockCounts={stockCounts}
          sort={sort}
          onSortChange={setSort}
          products={data.products}
        />
      )}

      {!isMaintenance && stock !== "latest" && (
        <ErrorBoundary boundary="products:recently-added" fallback={null}>
          <RecentlyAdded
            products={recentlyUpdatedProducts}
            onSeeAll={() => {
              setActive("All");
              setQ("");
              setStock("latest");
            }}
          />
        </ErrorBoundary>
      )}


      {!isMaintenance && (
        <ProductsFilterBar
          slot="controls"
          categories={data.categories.map((c) => c.name)}
          totalCount={data.products.length}
          categoryCounts={categoryCounts}
          active={active}
          onActiveChange={setActive}
          query={q}
          onQueryChange={setQ}
          stock={stock}
          onStockChange={setStock}
          stockCounts={stockCounts}
          sort={sort}
          onSortChange={setSort}
          products={data.products}
        />
      )}



      {!isMaintenance && (
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-3 sm:py-4">
        {data.rateLimited && data.products.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber/40 bg-amber/10 p-3 text-sm">
            Showing cached catalogue — the live sheet is temporarily rate-limited. Fresh data will resume automatically.
          </div>
        )}
        {data.error && data.products.length === 0 && (
          <div className="mb-4 rounded-xl border border-danger/40 p-3 text-sm" style={{ color: "var(--danger)" }}>
            Couldn&apos;t load the live sheet ({data.error}). Please retry shortly.
          </div>
        )}

        {recentVisible.length > 0 && (
          <ErrorBoundary boundary="products:recently-viewed" fallback={null}>
            <RecentlyViewed
              items={recentVisible}
              onClear={clear}
              onJump={(id) => {
                const el = document.getElementById(`product-${id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-2", "ring-amber");
                  window.setTimeout(() => el.classList.remove("ring-2", "ring-amber"), 1500);
                }
              }}
            />
          </ErrorBoundary>
        )}

        <h2 className="sr-only">Live product catalogue</h2>

        <ActiveFilters
          active={active}
          stock={stock}
          sort={sort}
          query={q}
          onCategoryReset={() => setActive("All")}
          onStockReset={() => setStock("all")}
          onSortReset={() => setSort("default")}
          onQueryReset={() => setQ("")}
          onClearAll={() => {
            setActive("All");
            setStock("all");
            setSort("default");
            setQ("");
          }}
        />

        {filtered.length > 0 && (
          <div
            aria-live="polite"
            className="mb-3 text-sm text-muted-foreground"
          >
            {q.trim() ? (
              <>
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                <span className="font-semibold text-foreground">{data.products.length}</span>{" "}
                {data.products.length === 1 ? "product" : "products"} for &ldquo;
                <span className="font-medium text-foreground">{q.trim()}</span>&rdquo;
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                <span className="font-semibold text-foreground">{data.products.length}</span>{" "}
                {data.products.length === 1 ? "product" : "products"}
              </>
            )}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-base text-foreground">
              {q.trim()
                ? <>No products found for &ldquo;<span className="font-medium">{q.trim()}</span>&rdquo;</>
                : "No products match this filter. Try another category."}
            </p>
            {q.trim() && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-full border border-border bg-card px-4 min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition hover:bg-muted"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <ErrorBoundary boundary="products:grid" resetKeys={[active, stock, q]}>
            <UpdatedAtContext.Provider value={dataUpdatedAt}>
              <div className="grid gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ErrorBoundary key={p.id} boundary="products:card" fallback={null}>
                    <TiltCard max={4}>
                      <ProductCard p={p} onView={track} isLatest={latestIds.has(p.id)} />
                    </TiltCard>
                  </ErrorBoundary>
                ))}
              </div>
            </UpdatedAtContext.Provider>
          </ErrorBoundary>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices depend on stock &amp; demand — <span className="font-medium text-foreground">contact admin for detailed info.</span>
        </p>
      </div>
      )}
    </PageShell>
  );
}
