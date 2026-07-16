/**
 * Product-card badges: availability pill and generic tone-coded pill.
 *
 * Tones map to a fixed palette so a "hot" badge always reads orange, a
 * "loot" always reads accent, etc. — irrespective of the current theme.
 */
import type { ReactNode } from "react";

import type { Availability } from "@/lib/sheet-products.functions";

export type BadgeTone = "available" | "limited" | "out" | "hot" | "new" | "loot";

const badgeToneStyle: Record<BadgeTone, { bg: string; fg: string }> = {
  available: { bg: "var(--whatsapp)", fg: "#fff" },
  limited: { bg: "#f4b740", fg: "#3a2500" },
  out: { bg: "#c8321f", fg: "#fff" },
  hot: { bg: "#ff5a1f", fg: "#fff" },
  new: { bg: "#1f6feb", fg: "#fff" },
  loot: { bg: "var(--accent)", fg: "#fff" },
};

/** Generic tone-coded pill. Use `AvailabilityBadge` for stock states. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {

  const s = badgeToneStyle[tone];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-soft backdrop-blur-sm"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

/** Colour-coded stock indicator: available / limited / out. */
export function AvailabilityBadge({ availability }: { availability: Availability }) {

  if (availability === "out") return <Badge tone="out">🔴 Out of Stock</Badge>;
  if (availability === "limited") return <Badge tone="limited">🟡 Limited Stock</Badge>;
  return <Badge tone="available">🟢 Available Now</Badge>;
}
