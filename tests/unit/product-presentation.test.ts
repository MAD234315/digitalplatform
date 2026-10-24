import { describe, expect, it } from "bun:test";
import { pricingEnquiryUrl, productSlug, withoutPricing } from "../../src/lib/product-presentation";

describe("WhatsApp-only product pricing", () => {
  it("omits prices and discounts while preserving non-pricing details", () => {
    expect(withoutPricing("Personal account\nPrice: ₹1,499\nValidity: 1 Month\n20% off\nUSD 12\nWarranty included")).toBe("Personal account\nValidity: 1 Month\nWarranty included");
  });
  it("preserves the exact selected name in the requested WhatsApp message", () => {
    const url = new URL(pricingEnquiryUrl("https://wa.me/919652191369", "ChatGPT Plus"));
    expect(url.pathname).toBe("/919652191369");
    expect(url.searchParams.get("text")).toBe("Hello! I'm interested in ChatGPT Plus. Please share the price and details.");
  });
  it("uses identity instead of spreadsheet position for direct URLs", () => {
    const p = { name: "ChatGPT Plus", category: "AI", plan: "Personal", validity: "1 Month", type: "Account" };
    expect(productSlug({ ...p, id: "p-0" } as typeof p)).toBe(productSlug({ ...p, id: "p-99" } as typeof p));
    expect(productSlug(p)).not.toBe(productSlug({ ...p, plan: "Team" }));
  });
});
