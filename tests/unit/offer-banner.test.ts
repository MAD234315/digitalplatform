import { describe, expect, it } from "bun:test";
import { offerBannerSchema, validateBannerFile } from "../../src/lib/offer-banner";

const draft = { enabled: false, mediaType: "image", mediaPath: null, headline: null, subline: null, ctaText: null, ctaLink: null };

describe("Offer banner settings", () => {
  it("retains disabled drafts and requires media for a live banner", () => {
    expect(offerBannerSchema.safeParse(draft).success).toBe(true);
    expect(offerBannerSchema.safeParse({ ...draft, enabled: true }).success).toBe(false);
    expect(offerBannerSchema.safeParse({ ...draft, enabled: true, mediaPath: "offers/photo.jpg" }).success).toBe(true);
  });
  it("allows local and HTTPS CTA links but refuses executable or protocol-relative links", () => {
    for (const ctaLink of ["/products", "https://wa.me/919652191369"]) expect(offerBannerSchema.safeParse({ ...draft, ctaLink }).success).toBe(true);
    for (const ctaLink of ["javascript:alert(1)", "//example.com", "/\\example.com", "http://example.com"]) expect(offerBannerSchema.safeParse({ ...draft, ctaLink }).success).toBe(false);
  });
  it("accepts photos and videos and rejects unsupported and oversized files", () => {
    expect(validateBannerFile({ type: "image/jpeg", size: 1024 })).toBe("image");
    expect(validateBannerFile({ type: "video/mp4", size: 1024 })).toBe("video");
    expect(() => validateBannerFile({ type: "image/svg+xml", size: 1024 })).toThrow();
    expect(() => validateBannerFile({ type: "video/mp4", size: 51 * 1024 * 1024 })).toThrow();
  });
});