import { createContext, memo } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { Button } from "@/components/ui/button";
import { ProductArtwork } from "./product-artwork";
import { PricingEnquiry } from "./pricing-enquiry";
import { productSlug, withoutPricing } from "@/lib/product-presentation";

// Preserved for the catalogue's existing provider and refresh logic.
export const UpdatedAtContext = createContext<number>(0);

export const ProductCard = memo(function ProductCard({ p, onView }: {
  p: SheetProduct;
  onView?: (p: SheetProduct) => void;
  isLatest?: boolean;
}) {
  const slug = productSlug(p);
  const name = withoutPricing(p.name) || "Product";
  const details = [withoutPricing(p.plan), withoutPricing(p.validity)].filter(Boolean).join(" · ");
  const description = withoutPricing(p.description);
  return (
    <article id={`product-${p.id}`} className="shop-product-card relative flex h-full flex-col overflow-hidden scroll-mt-32">
      <Link to="/product/$productSlug" params={{ productSlug: slug }} onClick={() => onView?.(p)} className="block flex-1" aria-label={`View details for ${name}`}>
        <ProductArtwork product={p} className="rounded-t-[15px]" />
        <div className="shop-product-body">
          <h3 className="shop-product-name">{name}</h3>
          {details && <p className="shop-product-meta">{details}</p>}
          {description && <p className="shop-product-description line-clamp-2">{description}</p>}
          <p className={`shop-stock ${p.availability === "out" ? "shop-stock-out" : p.availability === "limited" ? "shop-stock-low" : "shop-stock-available"}`}>
            {p.availability === "out" ? "Out of stock" : p.availability === "limited" ? "Limited stock" : "In stock"}
          </p>
        </div>
      </Link>
      <div className="flex items-stretch gap-2 px-3 pb-3">
        <PricingEnquiry name={p.name} onClick={() => onView?.(p)} soldOut={p.availability === "out"} />
        <Button asChild variant="outline" size="icon" className="shop-cart-symbol h-11 w-11 shrink-0" title="View product details">
          <Link to="/product/$productSlug" params={{ productSlug: slug }} onClick={() => onView?.(p)} aria-label={`View ${name} product details`}><ShoppingCart aria-hidden="true" /></Link>
        </Button>
      </div>
    </article>
  );
});
