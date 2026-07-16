import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getSheetProducts, type Availability, type SheetProduct } from "@/lib/sheet-products.functions";
import { TiltCard } from "@/components/tilt-card";
import { OG_IMAGE, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/site-config";
import { useRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/products/product-card";
import { ProductsHero } from "@/components/products/products-hero";
import { ProductsFilterBar } from "@/components/products/products-filter-bar";
import { RecentlyViewed } from "@/components/products/recently-viewed";
import { useProductsFilter } from "@/components/products/use-products-filter";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorBoundary } from "@/components/error-boundary";


// Static options (not a factory) — keeps queryKey referentially stable so
// useSuspenseQuery, ensureQueryData, and any getQueryData reads share the
// same cache entry across renders.
const productsQueryOptions = queryOptions({
  queryKey: ["sheet-products"],
  queryFn: () => getSheetProducts(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
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
  const { active, setActive, q, setQ, stock, setStock, stockCounts, filtered, categoryCounts } = useProductsFilter(
    data.products,
    data.categories,
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



      <ProductsFilterBar
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
      />


      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14">
        {data.rateLimited && data.products.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm">
            Showing cached catalogue — the live sheet is temporarily rate-limited. Fresh data will resume automatically.
          </div>
        )}
        {data.error && data.products.length === 0 && (
          <div className="mb-6 rounded-xl border border-danger/40 p-4 text-sm" style={{ color: "var(--danger)" }}>
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
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            No products match this filter. Try another category.
          </div>
        ) : (
          <ErrorBoundary boundary="products:grid" resetKeys={[active, stock, q]}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ErrorBoundary key={p.id} boundary="products:card" fallback={null}>
                  <TiltCard max={4}>
                    <ProductCard p={p} updatedAt={dataUpdatedAt} onView={track} />
                  </TiltCard>
                </ErrorBoundary>
              ))}
            </div>
          </ErrorBoundary>
        )}

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Prices depend on stock &amp; demand — <span className="font-medium text-foreground">contact admin for detailed info.</span>
        </p>
      </div>
    </PageShell>
  );
}
