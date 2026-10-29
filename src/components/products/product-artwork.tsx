import type { ReactNode } from "react";
import { BACKDROPS } from "@/assets/product-art";
import { artworkFor } from "@/lib/product-artwork";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { cn } from "@/lib/utils";

/** Gold emblems rotated deterministically per product name. */
const EMBLEMS: ReactNode[] = [
  <>
    <circle cx="24" cy="24" r="13" />
    <circle cx="24" cy="24" r="6.5" />
  </>,
  <>
    <polygon points="24,8.5 37.5,16.25 37.5,31.75 24,39.5 10.5,31.75 10.5,16.25" />
    <circle cx="24" cy="24" r="3.2" fill="currentColor" stroke="none" />
  </>,
  <>
    <path d="M24 9 L38.5 36.5 L9.5 36.5 Z" />
    <circle cx="24" cy="28.5" r="2.6" fill="currentColor" stroke="none" />
  </>,
  <>
    <path d="M24 8.5 L39.5 24 L24 39.5 L8.5 24 Z" />
    <path d="M15 24 H33" />
  </>,
  <>
    <path d="M11 21 L24 12 L37 21" />
    <path d="M11 29 L24 20 L37 29" />
    <path d="M11 37 L24 28 L37 37" />
  </>,
  <>
    <circle cx="14" cy="14" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="24" cy="14" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="34" cy="14" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="14" cy="24" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="24" cy="24" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="34" cy="24" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="14" cy="34" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="24" cy="34" r="2.3" fill="currentColor" stroke="none" />
    <circle cx="34" cy="34" r="2.3" fill="currentColor" stroke="none" />
  </>,
  <>
    <path d="M9 19c5-7 9-7 14 0s9 7 15 0" />
    <path d="M9 27c5-7 9-7 14 0s9 7 15 0" />
    <path d="M9 35c5-7 9-7 14 0s9 7 15 0" />
  </>,
  <>
    <path d="M24 7v9M24 32v9M7 24h9M32 24h9M12 12l6.4 6.4M29.6 29.6L36 36M36 12l-6.4 6.4M18.4 29.6L12 36" />
    <circle cx="24" cy="24" r="3.4" fill="currentColor" stroke="none" />
  </>,
];

/**
 * The picture on a product card and details page: the section's branded
 * backdrop, a gold emblem unique to the product, and the brand wordmark.
 * Falls back to a plain onyx placeholder when no backdrop matches.
 */
export function ProductArtwork({
  product,
  size = "card",
  className,
}: {
  product: SheetProduct;
  size?: "card" | "large" | "thumb";
  className?: string;
}) {
  const art = artworkFor(product);
  const backdrop = art.key ? BACKDROPS[art.key] : undefined;
  const plan = product.plan?.trim();
  return (
    <div
      className={cn(
        "shop-artwork",
        size === "large" && "shop-artwork-large",
        size === "thumb" && "shop-artwork-thumb",
        className,
      )}
      data-category={art.key ?? "placeholder"}
    >
      {backdrop ? (
        <img
          src={backdrop}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={512}
          height={512}
          className="shop-artwork-bg"
        />
      ) : (
        <span className="shop-artwork-placeholder" aria-hidden="true" />
      )}
      <span className="shop-artwork-scrim" aria-hidden="true" />
      <span className="shop-artwork-center">
        <svg
          className="shop-artwork-emblem"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {EMBLEMS[art.emblem] ?? EMBLEMS[0]}
        </svg>
        <span className="shop-artwork-mark">{art.mark}</span>
      </span>
      {plan ? <span className="shop-plan-tag">{plan}</span> : null}
      {product.availability === "out" ? <span className="shop-sold-tag">Sold out</span> : null}
    </div>
  );
}
