import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { PRODUCT_PICTURES } from "@/assets/product-art/pictures";
import { brandMark, pictureKeyFor } from "@/lib/product-artwork";
import { withoutPricing } from "@/lib/product-presentation";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { cn } from "@/lib/utils";

/** Individual product illustration shared by cards, details, thumbnails and zoom. */
export function ProductArtwork({
  product,
  size = "card",
  className,
}: {
  product: SheetProduct;
  size?: "card" | "large" | "thumb";
  className?: string;
}) {
  const key = pictureKeyFor(product);
  const picture = key ? PRODUCT_PICTURES[key] : undefined;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [picture]);
  const plan = withoutPricing(product.plan);
  const name = withoutPricing(product.name) || "Product";
  return (
    <div
      className={cn("shop-artwork", size === "large" && "shop-artwork-large", size === "thumb" && "shop-artwork-thumb", className)}
      data-artwork-key={key ?? "placeholder"}
    >
      {picture && !failed ? (
        <img src={picture} alt={`${name} artwork`} loading={size === "large" ? "eager" : "lazy"} width={320} height={320} className="shop-artwork-picture" onError={() => setFailed(true)} />
      ) : (
        <span className="shop-artwork-placeholder" role="img" aria-label={`${name} picture unavailable`}><ImageIcon aria-hidden="true" /></span>
      )}
      <span className="shop-artwork-mark">{brandMark(product.name)}</span>
      {plan ? <span className="shop-plan-tag">{plan}</span> : null}
      {product.availability === "out" ? <span className="shop-sold-tag">Sold out</span> : null}
    </div>
  );
}