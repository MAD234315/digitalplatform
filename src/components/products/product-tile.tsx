import { initialsFor } from "@/lib/product-visuals";
import { productTone, withoutPricing } from "@/lib/product-presentation";
import type { SheetProduct } from "@/lib/sheet-products.functions";

/** The reference's initials artwork; no invented product photographs. */
export function ProductTile({ product, large = false }: { product: SheetProduct; large?: boolean }) {
  return (
    <div role="img" aria-label={`${withoutPricing(product.name) || "Product"} artwork`} data-tone={productTone(product.name)} className={`shop-product-tile ${large ? "shop-product-tile-large" : ""}`}>
      <span aria-hidden="true">{initialsFor(product.name)}</span>
      {withoutPricing(product.validity) && <span className="shop-plan-tag">{withoutPricing(product.validity)}</span>}
      {product.availability === "out" && <span className="shop-sold-tag">Sold out</span>}
    </div>
  );
}