import { describe, expect, it } from "bun:test";
import {
  artworkFor,
  artworkKeyForCategory,
  brandMark,
  emblemIndexFor,
  EMBLEM_COUNT,
} from "@/lib/product-artwork";

/** Section headings exactly as they appear in the live catalogue sheet. */
const LIVE_CATEGORIES = [
  "ENTERTAINMENT TOOLS",
  "GIFT CARD OFFERS",
  "EDITING TOOLS",
  "AI PRODUCTIVITY TOOLS",
  "NEW OFFERS",
  "DEVELOPER TOOLS",
  "AI CREDITS VOUCHERS",
  "MUSIC PACKS",
  "MINI PACKS",
  "AI NEW TOOLS",
];

describe("product artwork", () => {
  it("gives every live catalogue section its own backdrop", () => {
    for (const category of LIVE_CATEGORIES) {
      expect(artworkKeyForCategory(category)).not.toBeNull();
    }
    expect(artworkKeyForCategory("ENTERTAINMENT TOOLS")).toBe("entertainment");
    expect(artworkKeyForCategory("AI CREDITS VOUCHERS")).toBe("ai-credits");
    expect(artworkKeyForCategory("MUSIC PACKS")).toBe("music");
    expect(artworkKeyForCategory("developer tools")).toBe("developer");
  });

  it("falls back to artwork for sections added later, and a placeholder otherwise", () => {
    expect(artworkKeyForCategory("AI RESEARCH TOOLS")).toBe("ai-new");
    expect(artworkKeyForCategory("STOCK FOOTAGE")).toBe("editing");
    expect(artworkKeyForCategory("")).toBeNull();
    expect(artworkKeyForCategory("UNKNOWN SECTION")).toBeNull();
  });

  it("keeps pricing out of the artwork wordmark", () => {
    const names = [
      "LAKME SALOON 1500/- Gift Card",
      "GOOGLE AI PRO (GEMINI Ai + 5TB......)",
      "PDF2GO(480 credits)",
      "Confluent Cloud(500 Dollars Credit)",
      "₹99 Trial Pack",
    ];
    for (const name of names) {
      const mark = brandMark(name);
      expect(mark).not.toMatch(/[0-9]/);
      expect(mark).not.toMatch(/[₹$€£]/);
      expect(mark).not.toContain("CREDIT");
    }
    expect(brandMark("LAKME SALOON 1500/- Gift Card")).toBe("LAKME SALOON");
  });

  it("shows a short readable brand wordmark", () => {
    expect(brandMark("Netflix Premium 1 Month")).toBe("NETFLIX");
    expect(brandMark("CHATGPT PLUS")).toBe("CHATGPT");
    expect(brandMark("Twitter ( X )")).toBe("TWITTER");
    expect(brandMark("BOLT.NEW")).toBe("BOLT NEW");
    expect(brandMark("")).toBe("");
  });

  it("is deterministic so a product always keeps the same picture", () => {
    const product = { name: "CANVA AI PRO - BRANDKIT", category: "EDITING TOOLS" };
    expect(artworkFor(product)).toEqual(artworkFor({ ...product }));
    const first = artworkFor(product);
    expect(first.key).toBe("editing");
    expect(first.emblem).toBeGreaterThanOrEqual(0);
    expect(first.emblem).toBeLessThan(EMBLEM_COUNT);
    expect(artworkFor({ name: "Spotify Premium", category: "ENTERTAINMENT TOOLS" })).not.toEqual(first);
  });

  it("stays inside the emblem set for every product name", () => {
    for (const name of ["A", "X", "Uber One", "Adobe express", "1", "  ", "MAGIC PATTERNS"]) {
      const index = emblemIndexFor(name);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(EMBLEM_COUNT);
    }
  });
});
