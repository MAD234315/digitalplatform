import { useId } from "react";
import {
  Bot, Clapperboard, Code2, Gift, Music, Package, Palette, Sparkles, Tag, Zap,
  type LucideIcon,
} from "lucide-react";
import { artworkKeyForCategory, brandMark, type ArtworkKey } from "@/lib/product-artwork";
import { productSlug, withoutPricing } from "@/lib/product-presentation";
import type { SheetProduct } from "@/lib/sheet-products.functions";
import { cn } from "@/lib/utils";

/**
 * Vector artwork generated from each product's own identity: unique colours,
 * pattern and layout per product, its brand wordmark and its section icon.
 * Being SVG it stays razor sharp at any size, and new sheet products get
 * artwork automatically with no uploads or AI credits.
 */
const ICONS: Record<ArtworkKey, LucideIcon> = {
  entertainment: Clapperboard, "gift-cards": Gift, editing: Palette,
  "ai-productivity": Bot, "new-offers": Tag, developer: Code2,
  "ai-credits": Zap, music: Music, "mini-packs": Package, "ai-new": Sparkles,
};

function hash(text: string, seed: number): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function ProductArtwork({
  product, size = "card", className,
}: { product: SheetProduct; size?: "card" | "large" | "thumb"; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const identity = productSlug(product) + "|" + product.name;
  const r = (n: number) => hash(identity, n);
  const hue = Math.floor(r(1) * 360);
  const hue2 = (hue + 30 + Math.floor(r(2) * 120)) % 360;
  const pattern = Math.floor(r(3) * 4);
  const angle = Math.floor(r(4) * 360);
  const key = artworkKeyForCategory(product.category ?? "");
  const Icon = key ? ICONS[key] : Sparkles;
  const mark = brandMark(product.name);
  const plan = withoutPricing(product.plan);
  const name = withoutPricing(product.name) || "Product";
  const fontSize = mark.length > 12 ? 52 : mark.length > 7 ? 70 : 96;

  const shapes = Array.from({ length: 7 }, (_, i) => ({
    x: r(10 + i) * 600, y: r(20 + i) * 600, s: 30 + r(30 + i) * 170, o: 0.06 + r(40 + i) * 0.14,
  }));

  return (
    <div
      className={cn("shop-artwork", size === "large" && "shop-artwork-large", size === "thumb" && "shop-artwork-thumb", className)}
      data-artwork-key={key ?? "placeholder"}
      role="img"
      aria-label={`${name} artwork`}
    >
      <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" className="shop-artwork-picture" aria-hidden="true">
        <defs>
          <linearGradient id={`g${uid}`} gradientTransform={`rotate(${angle} .5 .5)`}>
            <stop offset="0" stopColor={`hsl(${hue} 70% 22%)`} />
            <stop offset="1" stopColor={`hsl(${hue2} 75% 42%)`} />
          </linearGradient>
          <radialGradient id={`l${uid}`} cx={0.2 + r(5) * 0.6} cy={0.2 + r(6) * 0.5} r="0.7">
            <stop offset="0" stopColor="hsl(0 0% 100%)" stopOpacity="0.35" />
            <stop offset="1" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="600" fill={`url(#g${uid})`} />
        {shapes.map((s, i) =>
          pattern === 0 ? <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="hsl(0 0% 100%)" opacity={s.o} />
          : pattern === 1 ? <rect key={i} x={s.x - s.s / 2} y={s.y - s.s / 2} width={s.s} height={s.s} rx={s.s / 5} transform={`rotate(${r(50 + i) * 90} ${s.x} ${s.y})`} fill="hsl(0 0% 100%)" opacity={s.o} />
          : pattern === 2 ? <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="none" stroke="hsl(0 0% 100%)" strokeWidth={4 + r(60 + i) * 10} opacity={s.o + 0.05} />
          : <path key={i} d={`M${s.x - s.s} ${s.y + s.s} L${s.x} ${s.y - s.s} L${s.x + s.s} ${s.y + s.s}Z`} fill="hsl(0 0% 100%)" opacity={s.o} />,
        )}
        <rect width="600" height="600" fill={`url(#l${uid})`} />
        <text x="300" y="420" textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="hsl(0 0% 100%)" letterSpacing="2" style={{ fontFamily: "inherit" }}>{mark}</text>
      </svg>
      <span className="pointer-events-none absolute left-1/2 top-[34%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/20 p-[5cqw] backdrop-blur-sm">
        <Icon style={{ width: "16cqw", height: "16cqw", color: "var(--shop-artwork-text)" }} strokeWidth={1.6} aria-hidden="true" />
      </span>
      {plan ? <span className="shop-plan-tag">{plan}</span> : null}
      {product.availability === "out" ? <span className="shop-sold-tag">Sold out</span> : null}
    </div>
  );
}
