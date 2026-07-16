/**
 * Presentation helpers shared by product cards, tiles and recently-viewed
 * chips. Kept pure and framework-free so any component can import them.
 */

/**
 * Minimal random-logo image URL for a product. Uses DiceBear "shapes" so
 * each product gets a distinct, deterministic geometric glyph on a
 * transparent background — the parent gradient shows through and the
 * shape reads as a floating minimal logo.
 * Deterministic per product name: same product → same mark.
 */
export function animeImageFor(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundType=solid&backgroundColor=transparent&shape1Color=ffffff,f8fafc&shape2Color=ffffffcc,f1f5f9cc&shape3Color=ffffff80,e2e8f080`;
}

/** Hue anchor per product name — shared by gradient and glow so they match. */
export function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

/** Deterministic accent gradient per product name for visual variety. */
export function gradientFor(name: string): string {
  const h = hueFor(name);
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${h2} 75% 40%))`;
}

/** Matching glow color per product — used for the glassmorphism halo. */
export function glowFor(name: string): string {
  const h = hueFor(name);
  return `hsl(${h} 80% 60%)`;
}



/** Two-letter initials fallback for a product name. */
export function initialsFor(name: string): string {
  return (
    name
      .replace(/[^A-Za-z ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || name.slice(0, 2).toUpperCase()
  );
}

/** Human-friendly "x min ago" formatter. */
export function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const sec = Math.max(0, Math.round(diffMs / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}
