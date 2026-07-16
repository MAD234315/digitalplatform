export type Stat = { value: string; label: string };
export type Reason = { n: string; title: string; body: string };

export const STATS: Stat[] = [
  { value: "200+", label: "Curated Assets" },
  { value: "Daily", label: "Catalogue Refresh" },
  { value: "5\u00a0yrs+", label: "Trusted Service" },
  { value: "24/7", label: "Human Support" },
];

export const CATEGORIES: string[] = [
  "AI Productivity Tools", "Creative & Design Software", "Streaming Subscriptions", "Microsoft & Office",
  "Educational Platforms", "Developer Tools", "Cloud Services", "Professional Software",
  "Gift Cards", "Productivity Apps", "Business Tools", "Premium Memberships",
];

export const REASONS: Reason[] = [
  { n: "01", title: "Trusted Since 2020", body: "Half a decade of quietly serving thousands of creators, students and businesses with real support." },
  { n: "02", title: "200+ Premium Products", body: "One of the largest curated catalogues of subscriptions, AI tools and licensed software in India." },
  { n: "03", title: "Updated Daily", body: "Stock, plans and pricing move every day. What you see is what's actually available today." },
  { n: "04", title: "Reliable Support", body: "Human answers before and after every purchase — no ticket queues, no bots, no runaround." },
  { n: "05", title: "Genuine Sources", body: "We focus on legitimate licenses and authentic gift card channels. Illegal items are off-limits." },
  { n: "06", title: "Affordable Pricing", body: "Real discounts on premium software so paying full retail becomes the last resort, not the default." },
];

export const PROMISES: string[] = [
  "High-quality digital services",
  "Secure and smooth transactions",
  "Fast delivery whenever applicable",
  "Responsive customer support",
  "Transparent communication",
  "Regularly updated product catalogue",
];
