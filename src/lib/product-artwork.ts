/**
 * Deterministic per-product artwork: which branded backdrop a product sits on
 * and which gold emblem + wordmark it carries on top of that backdrop.
 *
 * Pure and framework-free (no React, no asset imports) so it can be unit tested
 * and reused by catalogue cards, product details pages and share links.
 */

/** Backdrop artwork keys — one per themed section of the catalogue. */
export type ArtworkKey =
  | "entertainment"
  | "gift-cards"
  | "editing"
  | "ai-productivity"
  | "new-offers"
  | "developer"
  | "ai-credits"
  | "music"
  | "mini-packs"
  | "ai-new";

/** Number of gold emblems the artwork rotates between. */
export const EMBLEM_COUNT = 8;

const EXACT_CATEGORY_KEYS: Record<string, ArtworkKey> = {
  "ENTERTAINMENT TOOLS": "entertainment",
  "GIFT CARD OFFERS": "gift-cards",
  "EDITING TOOLS": "editing",
  "AI PRODUCTIVITY TOOLS": "ai-productivity",
  "NEW OFFERS": "new-offers",
  "DEVELOPER TOOLS": "developer",
  "AI CREDITS VOUCHERS": "ai-credits",
  "MUSIC PACKS": "music",
  "MINI PACKS": "mini-packs",
  "AI NEW TOOLS": "ai-new",
};

/** Fallbacks so sections added to the sheet later still land on artwork. */
const KEYWORD_KEYS: [RegExp, ArtworkKey][] = [
  [/MUSIC|AUDIO|SONG/i, "music"],
  [/GIFT|VOUCHER CARD/i, "gift-cards"],
  [/EDIT|DESIGN|VIDEO|STOCK|FOOTAGE|PHOTO/i, "editing"],
  [/DEVELOP|CODE|DEVOPS/i, "developer"],
  [/CREDIT|TOKEN|VOUCHER/i, "ai-credits"],
  [/MINI|TRIAL/i, "mini-packs"],
  [/OFFER|SALE|DEAL/i, "new-offers"],
  [/ENTERTAIN|STREAM|OTT/i, "entertainment"],
  [/AI/i, "ai-new"],
];

/** Backdrop artwork for a section, or `null` when nothing matches yet. */
export function artworkKeyForCategory(category: string): ArtworkKey | null {
  const clean = (category || "").trim().toUpperCase();
  if (!clean) return null;
  const exact = EXACT_CATEGORY_KEYS[clean];
  if (exact) return exact;
  for (const [pattern, key] of KEYWORD_KEYS) if (pattern.test(clean)) return key;
  return null;
}

/** Words that describe a plan or a validity, never the product itself. */
const STOP_WORDS = new Set([
  "PLAN","PLANS","PACK","PACKS","MONTH","MONTHS","MONTHLY","YEAR","YEARS","ANNUAL",
  "DAY","DAYS","WEEK","WEEKS","LIFETIME","SUBSCRIPTION","SUSCRIPTION","RENEWAL",
  "GIFT","GIFTS","CARD","CARDS","WITH","FOR","THE","AND","OF","IN","AT","PER",
  "OFFERS","OFFER","DEAL","DEALS","SALE","SALES","CODE","CODES","KEY","KEYS",
  "ACCOUNT","ACCOUNTS","SEAT","SEATS","USER","USERS","DEVICE","DEVICES",
  "UNLIMITED","UNLIMTED","YEARLY","WARRANTY","WARRANTIED",
  // Plan tiers never belong in a wordmark: "Netflix Premium" reads as "Netflix".
  "PREMIUM","STANDARD","BASIC","PRO","PLUS","BUSINESS","ELITE","GOLD","MAX","MIN",
  "CORE","STARTER","ENTERPRISE","CREATOR","TEAM","TEAMS","ULTRA","FAMILY",
  "INDIVIDUAL","PERSONAL","STUDENT","SINGLE","DOUBLE","SUSCRIPTION",
]);

/** Words that only carry a price or a quantity — never shown on artwork. */
const PRICING_TOKEN = /^[₹$€£]/;

function isWordy(token: string): boolean {
  if (!/[A-Za-z]/.test(token)) return false;
  if (/^[0-9]/.test(token)) return false;
  if (PRICING_TOKEN.test(token)) return false;
  if (token.length < 2) return false;
  return !STOP_WORDS.has(token.toUpperCase());
}

/**
 * Short brand wordmark for the artwork, e.g. "Netflix Premium 1 Month" ->
 * "NETFLIX". Keeps no digits, currency symbols or price fragments.
 */
export function brandMark(name: string): string {
  const stripped = (name || "").replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
  const words = stripped
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .filter(isWordy)
    .map((w) => w.toUpperCase());
  const mark = words.slice(0, 2).join(" ").trim();
  if (!mark) return (name || "").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  return mark.length > 18 ? mark.slice(0, 18).trim() : mark;
}

/** Stable 0..EMBLEM_COUNT-1 index so a product always keeps the same emblem. */
export function emblemIndexFor(name: string): number {
  let h = 7;
  const clean = (name || "").trim().toUpperCase();
  for (let i = 0; i < clean.length; i++) h = (h * 31 + clean.charCodeAt(i)) % 100003;
  return h % EMBLEM_COUNT;
}

export interface ProductArtworkSpec {
  /** Backdrop artwork, or `null` for the plain placeholder artwork. */
  key: ArtworkKey | null;
  /** Gold wordmark shown on the artwork. */
  mark: string;
  /** Emblem index into the shared emblem set. */
  emblem: number;
}

/** The full artwork recipe for a product. Same product always gets the same art. */
export function artworkFor(product: { name: string; category?: string }): ProductArtworkSpec {
  return {
    key: artworkKeyForCategory(product.category ?? ""),
    mark: brandMark(product.name),
    emblem: emblemIndexFor(product.name),
  };
}
