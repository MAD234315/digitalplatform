/**
 * Presentation helpers shared by product cards, tiles and recently-viewed
 * chips. Kept pure and framework-free so any component can import them.
 */

/**
 * Deterministic anime-style thumbnail per product name.
 * Rotates across a few DiceBear anime-leaning styles so the grid looks varied
 * while remaining stable across reloads (same product → same image).
 */
export function animeImageFor(name: string): string {
  // Single "big-smile" style — every product gets a smiling anime avatar,
  // deterministic per name so the same product always renders the same face.
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/big-smile/svg?seed=${seed}&radius=20&backgroundType=gradientLinear`;
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
