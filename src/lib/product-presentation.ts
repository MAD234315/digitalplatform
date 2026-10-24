import type { SheetProduct } from "@/lib/sheet-products.functions";

/** Keep source data untouched; omit pricing-bearing sentences in public product views. */
export function withoutPricing(text: string | undefined): string {
  return (text ?? "")
    .split(/\r?\n|(?<=[.!?])\s+/)
    .filter((line) => !/(?:[₹$€£¥]|\b(?:INR|USD|EUR|GBP|Rs\.?|rupees?|price|pricing|cost|MRP|discount(?:ed)?|cashback|payment|payable)\b|\b\d[\d,.]*\s*(?:\/\-|%\s*off)|\b(?:pay|only|for)\s+\d[\d,.]*)/i.test(line))
    .join("\n")
    .trim();
}

/** URLs use catalogue identity, never a row position that changes when the sheet is sorted. */
export function productSlug(p: Pick<SheetProduct, "name" | "category" | "plan" | "validity" | "type">): string {
  const identity = JSON.stringify([p.category, p.name, p.plan, p.validity, p.type]);
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i++) hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619);
  const name = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
  return `${name}-${(hash >>> 0).toString(36)}`;
}

export function pricingEnquiryUrl(baseUrl: string, name: string): string {
  return `${baseUrl}?text=${encodeURIComponent(`Hello! I'm interested in ${name}. Please share the price and details.`)}`;
}

export function productTone(name: string): string {
  if (/chatgpt|openai/i.test(name)) return "teal";
  if (/netflix|youtube|adobe|apple music/i.test(name)) return "red";
  if (/spotify/i.test(name)) return "green";
  if (/microsoft|telegram|prime/i.test(name)) return "blue";
  const tones = ["teal", "red", "green", "blue", "violet", "rose"];
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return tones[sum % tones.length];
}