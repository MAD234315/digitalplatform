/**
 * Deterministic inline-SVG "minimal logo" for a product.
 *
 * Picks one glyph from a curated set of simple geometric marks using a hash
 * of the product name — so the same product always renders the same shape,
 * and the shapes are visually varied across the grid. Inline SVG means zero
 * network requests (unlike DiceBear), which matters when 200+ cards render
 * at once.
 *
 * The mark is drawn in white with a soft inner sheen so it reads as a
 * floating logo on the parent's gradient/glow background.
 */

type Props = {
  /** Product name — drives which glyph gets picked. */
  name: string;
  /** Pixel size (width & height). */
  size?: number;
  className?: string;
};

function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

// Each glyph draws inside a 40x40 viewBox, centered, stroke/fill in white.
const GLYPHS: Array<(id: string) => React.ReactNode> = [
  // 1. Ring + dot
  () => (
    <>
      <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
    </>
  ),
  // 2. Rotated square (diamond) with inner square
  () => (
    <>
      <rect x="8" y="8" width="24" height="24" rx="3" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="15" y="15" width="10" height="10" rx="1.5" fill="currentColor" transform="rotate(45 20 20)" />
    </>
  ),
  // 3. Triangle
  () => (
    <polygon points="20,6 34,30 6,30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  ),
  // 4. Hexagon
  () => (
    <polygon points="20,5 33,12 33,28 20,35 7,28 7,12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  ),
  // 5. Star (5-point)
  () => (
    <polygon
      points="20,5 24,15.5 35,16 26.5,23.5 29.5,34 20,28 10.5,34 13.5,23.5 5,16 16,15.5"
      fill="currentColor"
    />
  ),
  // 6. Cross / plus
  () => (
    <path d="M17 6h6v11h11v6H23v11h-6V23H6v-6h11z" fill="currentColor" />
  ),
  // 7. Two overlapping circles
  () => (
    <>
      <circle cx="14" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="26" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </>
  ),
  // 8. Wave / infinity-ish
  () => (
    <path
      d="M6 20 C10 8, 18 8, 20 20 S30 32, 34 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  ),
  // 9. Grid of 4 squares
  () => (
    <>
      <rect x="7" y="7" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="21" y="7" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="7" y="21" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="21" y="21" width="12" height="12" rx="2" fill="currentColor" />
    </>
  ),
  // 10. Bolt
  () => (
    <path d="M22 4L8 22h10l-4 14 16-20H20z" fill="currentColor" />
  ),
  // 11. Concentric arcs
  () => (
    <>
      <path d="M6 30 A14 14 0 0 1 34 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 30 A8 8 0 0 1 28 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="30" r="2.5" fill="currentColor" />
    </>
  ),
  // 12. Sparkle (4-point star)
  () => (
    <path d="M20 4 L23 17 L36 20 L23 23 L20 36 L17 23 L4 20 L17 17 Z" fill="currentColor" />
  ),
];

export function LogoMark({ name, size = 32, className }: Props) {
  const h = hash(name);
  const glyph = GLYPHS[h % GLYPHS.length];
  const rotation = (h % 4) * 15; // 0°, 15°, 30°, 45°
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      style={{ color: "white", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
      aria-hidden
    >
      <g transform={`rotate(${rotation} 20 20)`}>{glyph(`m${h}`)}</g>
    </svg>
  );
}
