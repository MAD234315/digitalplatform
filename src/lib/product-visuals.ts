/**
 * Presentation helpers shared by product cards, tiles and recently-viewed
 * chips. Kept pure and framework-free so any component can import them.
 */

/**
 * Minimal-logo image URL for a product. Uses a DiceBear "initials" style so
 * every card shows a clean monogram centered on a neutral background — the
 * gradient behind it (see `gradientFor`) provides the brand accent.
 * Deterministic per product name: same product → same mark, forever.
 */
export function animeImageFor(name: string): string {
  const seed = encodeURIComponent(name);
  // Transparent background so the parent `gradientFor()` shows through and
  // every product image lives on the same branded gradient surface.
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundType=solid&backgroundColor=transparent&fontFamily=Inter&fontWeight=700&chars=2`;
}



/** Deterministic accent gradient per product name for visual variety. */
export function gradientFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${h2} 75% 40%))`;
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
