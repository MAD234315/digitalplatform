import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";
import { ProductCard, UpdatedAtContext } from "@/components/products/product-card";
import { TiltCard } from "@/components/tilt-card";
import { ErrorBoundary } from "@/components/error-boundary";
import { getSheetProducts, type SheetProduct } from "@/lib/sheet-products.functions";

/**
 * Home-page preview of the live catalogue: shows a handful of the most
 * recently updated in-stock cards, linking through to /products.
 */
export function FeaturedProductsSection() {
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ["sheet-products"],
    queryFn: () => getSheetProducts(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  const featured = useMemo<SheetProduct[]>(() => {
    if (!data?.products) return [];
    const inStock = data.products.filter((p) => p.availability !== "out");
    return inStock.slice(0, 8);
  }, [data]);

  if (!data || featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Eyebrow>Featured products</Eyebrow>
            <h2 id="featured-heading" className="mt-4 font-display text-3xl sm:text-4xl">
              Fresh from the shelf.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A live peek at what&apos;s in stock right now — updated straight from our catalogue.
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] transition hover:bg-muted"
          >
            View all products →
          </Link>
        </Reveal>

        <UpdatedAtContext.Provider value={dataUpdatedAt}>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
              <ErrorBoundary key={p.id} boundary="home:featured-card" fallback={null}>
                <TiltCard max={4}>
                  <ProductCard p={p} />
                </TiltCard>
              </ErrorBoundary>
            ))}
          </div>
        </UpdatedAtContext.Provider>
      </div>
    </section>
  );
}
