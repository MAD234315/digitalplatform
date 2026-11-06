import { describe, expect, it } from "bun:test";
import {
  artworkFor,
  artworkKeyForCategory,
  artworkKeyForProduct,
  brandMark,
  emblemIndexFor,
  EMBLEM_COUNT,
  pictureKeyForIdentity,
} from "@/lib/product-artwork";
import { ARTWORK_CATALOGUE } from "@/lib/product-artwork-catalogue";

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
  it("uses software artwork for Windows 10 even in the entertainment section", () => {
    expect(artworkKeyForProduct({ name: "Windows10 Pro", category: "ENTERTAINMENT TOOLS" })).toBe("software");
  });
  it("uses software artwork for Microsoft Office even in the entertainment section", () => {
    expect(artworkKeyForProduct({ name: "Microsoft Office 2021", category: "ENTERTAINMENT TOOLS" })).toBe("software");
  });
  it("assigns a different picture to every one of the 248 current catalogue cards", () => {
    const keys = Object.entries(ARTWORK_CATALOGUE).flatMap(([slug, rows]) => rows.map((id) => pictureKeyForIdentity(slug, id)));
    expect(keys).toHaveLength(248);
    expect(keys).not.toContain(null);
    expect(new Set(keys).size).toBe(248);
  });

  it("keeps normal product artwork unchanged when spreadsheet row positions change", () => {
    expect(pictureKeyForIdentity("sonyliv-1j1pjuj", "p-2")).toBe("sonyliv-1j1pjuj");
    expect(pictureKeyForIdentity("sonyliv-1j1pjuj", "p-999")).toBe("sonyliv-1j1pjuj");
    expect(pictureKeyForIdentity("sonyliv-km3lr3", "p-3")).not.toBe(pictureKeyForIdentity("sonyliv-1j1pjuj", "p-2"));
  });

  it("uses a placeholder for products without a generated picture", () => {
    expect(pictureKeyForIdentity("new-unknown-product", "p-249")).toBeNull();
  });
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
    const cases: [string, string][] = [
      ["LAKME SALOON 1500/- Gift Card", "LAKME SALOON"],
      ["GOOGLE AI PRO (GEMINI Ai + 5TB......)", "GOOGLE AI"],
      ["PDF2GO(480 credits)", "PDF2GO"],
      ["Confluent Cloud(500 Dollars Credit)", "CONFLUENT CLOUD"],
      ["₹99 Trial Pack", "TRIAL"],
    ];
    for (const [name, mark] of cases) {
      expect(brandMark(name)).toBe(mark);
      expect(mark).not.toMatch(/[₹$€£]/);
      expect(mark).not.toMatch(/\b(1500|480|500|99|5TB|DOLLARS|CREDIT|RUPEES)\b/);
    }
  });

  it("shows a short readable brand wordmark", () => {
    expect(brandMark("Netflix Premium 1 Month")).toBe("NETFLIX");
    expect(brandMark("CHATGPT PLUS")).toBe("CHATGPT");
    expect(brandMark("Twitter ( X )")).toBe("TWITTER");
    expect(brandMark("BOLT.NEW")).toBe("BOLT NEW");
    expect(brandMark("Windows10 Pro")).toBe("WINDOWS 10");
    expect(brandMark("Infosys Certificates")).toBe("INFOSYS CERTIFICATES");
    expect(brandMark("PDF2GO")).toBe("PDF2GO");
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
