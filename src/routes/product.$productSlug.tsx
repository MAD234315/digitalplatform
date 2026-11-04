import { createFileRoute, Link, notFound, useRouter, useCanGoBack } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, Layers, Monitor, ShieldCheck, Tag } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ProductArtwork } from "@/components/products/product-artwork";
import { PricingEnquiry } from "@/components/products/pricing-enquiry";
import { getSheetProducts } from "@/lib/sheet-products.functions";
import { productSlug, withoutPricing } from "@/lib/product-presentation";
import { useState } from "react";
import { ARTWORK_CATALOGUE } from "@/lib/product-artwork-catalogue";

const catalogueQuery = queryOptions({ queryKey: ["sheet-products"], queryFn: () => getSheetProducts(), staleTime: 5 * 60_000 });

export const Route = createFileRoute("/product/$productSlug")({
  validateSearch: (search: Record<string, unknown>): { artworkRow?: string } => ({
    artworkRow: typeof search.artworkRow === "string" ? search.artworkRow : undefined,
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(catalogueQuery);
    if (data.error && !data.products.length) throw new Error("The catalogue is temporarily unavailable. Please try again.");
    const product = data.products.find((p) => productSlug(p) === params.productSlug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const name = withoutPricing(loaderData?.product.name) || "Product unavailable";
    const title = `${name} — Digital Platform`;
    const description = withoutPricing(loaderData?.product.description).slice(0, 160) || `Explore ${name} at Digital Platform. Contact us on WhatsApp for details.`;
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: ProductDetails,
  pendingComponent: () => <PageShell><div className="mx-auto max-w-3xl px-5 pb-16 pt-32" role="status">Loading product details…</div></PageShell>,
  notFoundComponent: () => <ProductUnavailable />,
  errorComponent: ({ reset }) => <ProductUnavailable retry={reset} />,
});

function ProductUnavailable({ retry }: { retry?: () => void }) {
  return <PageShell><div className="mx-auto max-w-3xl px-5 pb-16 pt-32"><h1 className="text-2xl">{retry ? "Product details are temporarily unavailable" : "Product not found"}</h1><div className="mt-6 flex gap-3"><Button asChild variant="outline"><Link to="/products">Back to catalogue</Link></Button>{retry && <Button onClick={retry}>Retry</Button>}</div></div></PageShell>;
}

function ProductDetails() {
  const { product: loadedProduct } = Route.useLoaderData();
  const { artworkRow } = Route.useSearch();
  const rows = ARTWORK_CATALOGUE[productSlug(loadedProduct)];
  const product = artworkRow && rows?.includes(artworkRow) ? { ...loadedProduct, id: artworkRow } : loadedProduct;
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const name = withoutPricing(product.name) || "Product";
  const description = withoutPricing(product.description);
  const fields = [
    { label: "Plan", value: product.plan, icon: Calendar },
    { label: "Validity", value: product.validity, icon: Clock },
    { label: "Type", value: product.type, icon: Layers },
    { label: "Supports", value: product.supports, icon: Monitor },
    { label: "Warranty", value: product.warranty, icon: ShieldCheck },
    { label: "Category", value: product.category, icon: Tag },
  ].map((field) => ({ ...field, value: withoutPricing(field.value) })).filter((field) => field.value);
  return (
    <PageShell>
      <div className="shop-product-details mx-auto max-w-3xl px-5 pb-16 pt-28 sm:px-6 sm:pt-32">
        <header className="mb-5 flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Back to catalogue"><Link to="/products" onClick={(e) => { if (canGoBack) { e.preventDefault(); router.history.back(); } }}><ArrowLeft /></Link></Button>
          <div><p className="shop-detail-heading">Product details</p><p className="text-xs text-muted-foreground">Digital Platform</p></div>
        </header>
        <section aria-label={`${name} image gallery`}>
          <Button variant="ghost" className="block h-auto w-full overflow-hidden rounded-2xl p-0" onClick={() => setExpanded(true)} aria-label={`Enlarge ${name} artwork`}><ProductArtwork product={product} size="large" /></Button>
        </section>
        <div className="pt-5">
          <h1 className="shop-detail-name">{name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{[withoutPricing(product.plan), withoutPricing(product.validity)].filter(Boolean).join(" · ")}</p>
          <p className={`shop-stock mt-3 ${product.availability === "out" ? "shop-stock-out" : product.availability === "limited" ? "shop-stock-low" : "shop-stock-available"}`}>{product.availability === "out" ? "Out of stock" : product.availability === "limited" ? "Limited stock" : "In stock"}</p>
          {description && <section className="mt-6"><h2 className="shop-section-heading">Description &amp; features</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{description}</p></section>}
          {fields.length > 0 && <section className="mt-6"><h2 className="shop-section-heading">Product information</h2><dl className="shop-info-list mt-3">{fields.map(({ label, value, icon: Icon }) => <div key={label} className="shop-info-row"><Icon size={18} aria-hidden="true" /><div className="min-w-0"><dt className="text-sm font-semibold">{label}</dt><dd className="break-words text-sm text-muted-foreground">{value}</dd></div></div>)}</dl></section>}
          <div className="mt-6 flex"><PricingEnquiry name={product.name} soldOut={product.availability === "out"} /></div>
        </div>
        {expanded && <div role="dialog" aria-modal="true" aria-label={`${name} artwork`} className="shop-artwork-dialog fixed inset-0 z-50 flex items-center justify-center p-5" onClick={() => setExpanded(false)} onKeyDown={(e) => { if (e.key === "Escape") setExpanded(false); }}><div className="w-full max-w-3xl"><ProductArtwork product={product} size="large" /><Button autoFocus variant="outline" className="mt-4 min-h-11 w-full" onClick={() => setExpanded(false)}>Close</Button></div></div>}
      </div>
    </PageShell>
  );
}