/**
 * FAQ content and taxonomy for the /faq route.
 *
 * `FAQS` is the flat list rendered on the page; `CATEGORIES` drives the
 * filter tab bar (with "All" pinned first). Both are also consumed by the
 * FAQPage JSON-LD block in `src/routes/faq.tsx` so structured data stays in
 * sync with the rendered content.
 */
export type Category =

  | "General"
  | "Orders & Delivery"
  | "Products"
  | "Payment"
  | "Warranty & Support"
  | "Account & Usage"
  | "Website"
  | "Business"
  | "Security"
  | "Contact";

export interface QA {
  q: string;
  a: string;
  cat: Category;
}

export const FAQS: QA[] = [
  { cat: "General", q: "What is Digital Platform?", a: "Digital Platform is a marketplace offering premium digital products, AI tools, software subscriptions, streaming services, developer tools, and productivity solutions at competitive prices." },
  { cat: "General", q: "Since when have you been operating?", a: "We have been serving customers since 2020, providing reliable digital products and customer support." },
  { cat: "General", q: "How many products do you offer?", a: "Our catalogue includes 200+ premium digital products across multiple categories and is updated regularly." },
  { cat: "General", q: "Why aren't prices displayed for some products?", a: "Some product prices change based on stock availability and demand pricing. For those, you'll see \"Contact for today's price\" — DM us for the live rate." },

  { cat: "Orders & Delivery", q: "How do I place an order?", a: "Pick your product and message us on WhatsApp (or any other contact method). We'll guide you through the ordering process end to end." },
  { cat: "Orders & Delivery", q: "How long does delivery take?", a: "Delivery time depends on the product. Most digital products are delivered as quickly as possible after payment confirmation — usually within minutes." },
  { cat: "Orders & Delivery", q: "How will I receive my product?", a: "Depending on the product, you'll receive login credentials, an activation key, a license, or a gift card code — delivered directly on WhatsApp or email." },
  { cat: "Orders & Delivery", q: "Which payment methods do you accept?", a: "We accept secure online payments — UPI and cards through trusted payment providers." },
  { cat: "Orders & Delivery", q: "When should I contact support after payment?", a: "Message us right after completing payment. Share your payment screenshot or transaction reference so we can verify and process your order promptly." },

  { cat: "Products", q: "Are all products always available?", a: "No. Stock changes daily. Some products may become temporarily unavailable and return later." },
  { cat: "Products", q: "How often is the product catalogue updated?", a: "The catalogue is updated regularly with new products, stock changes, and availability — synced live from our internal sheet." },
  { cat: "Products", q: "What types of products do you offer?", a: "AI tools, streaming services, design software, developer tools, Microsoft products, productivity software, educational platforms, gift cards, and cloud services." },

  { cat: "Warranty & Support", q: "Do products include warranty?", a: "Yes — warranty details are displayed on each product card, wherever applicable." },
  { cat: "Warranty & Support", q: "What should I do if I have an issue?", a: "Contact our support team with your order details and we'll assist you as quickly as possible." },
  { cat: "Warranty & Support", q: "Can I get help before purchasing?", a: "Absolutely. If you're unsure which product or plan is right for you, message us and we'll help you choose." },

  { cat: "Account & Usage", q: "Can I use the product on multiple devices?", a: "Device support varies by product. Check the product card for supported devices and usage limits." },
  { cat: "Account & Usage", q: "Can product plans or availability change?", a: "Yes. Plans, availability, and pricing may change over time depending on stock and demand." },

  { cat: "Security", q: "Is my payment secure?", a: "Yes. We use secure payment methods and trusted providers to help protect every transaction." },
  { cat: "Security", q: "Is my personal information safe?", a: "We respect your privacy and only use the information required to process your order and provide support." },

  { cat: "Contact", q: "How can I contact you?", a: "Reach us on WhatsApp, Instagram, or email. Our support team responds as soon as possible, every day between 10 AM and 10 PM IST." },
];

export const CATEGORIES: readonly ("All" | Category)[] = [
  "All",
  "General",
  "Orders & Delivery",
  "Products",
  "Warranty & Support",
  "Account & Usage",
  "Security",
  "Contact",
] as const;
