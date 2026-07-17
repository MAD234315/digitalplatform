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
  { cat: "Orders & Delivery", q: "How will I receive my product?", a: "Depending on the product, you'll receive login credentials, an activation, a license, or a gift card code — delivered directly on WhatsApp or email." },
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

  { cat: "Products", q: "Are all products genuine?", a: "We strive to provide genuine licenses, legitimate gift cards, and reliable digital products sourced through trusted and benefit programs." },
  { cat: "Products", q: "Do you add new products regularly?", a: "Yes. We frequently add new products, AI tools, subscriptions, and software based on availability and customer demand." },
  { cat: "Products", q: "Why do some products become unavailable?", a: "Some products are available in limited quantities or depend on demand stock, so availability may change." },
  { cat: "Products", q: "Can I request a product that's not listed?", a: "Yes. If you can't find a product on our website, submit a product request or contact us directly. We'll check its availability." },
  { cat: "Products", q: "How often are prices updated?", a: "Prices may change daily depending on stock availability and market conditions." },

  { cat: "Orders & Delivery", q: "Can I order multiple products at once?", a: "Yes. You can purchase multiple products in a single order." },
  { cat: "Orders & Delivery", q: "Will I receive order confirmation?", a: "Yes. Once your payment is verified, we'll confirm your order and begin processing it." },
  { cat: "Orders & Delivery", q: "Can I cancel my order?", a: "If your order has not yet been processed, please contact us as soon as possible. Cancellation depends on the product and its processing stage." },
  { cat: "Orders & Delivery", q: "What information do I need to place an order?", a: "Typically, we'll ask for the information required for the specific product, such as an email address or number when applicable." },
  { cat: "Orders & Delivery", q: "Are products delivered instantly?", a: "Delivery time depends on the product. Some are delivered quickly after payment verification, while others may take longer." },
  { cat: "Orders & Delivery", q: "Will I receive delivery updates?", a: "Yes. We'll keep you informed about your order status." },
  { cat: "Orders & Delivery", q: "How do I know when my product has been delivered?", a: "We'll notify you once your order has been completed and provide the required access details." },

  { cat: "Payment", q: "Why is payment verification required?", a: "Payment verification helps ensure secure transactions and accurate order processing." },
  { cat: "Payment", q: "What if I accidentally pay the wrong amount?", a: "Contact our support team with your payment details. We'll help resolve the issue." },
  { cat: "Payment", q: "Do you provide invoices?", a: "If available for the product or service, we can provide payment confirmation or an invoice upon request." },

  { cat: "Warranty & Support", q: "What should I do if my product isn't working?", a: "Contact our support team with your order details. We'll review the issue and assist you according to the applicable warranty." },
  { cat: "Warranty & Support", q: "How do I claim warranty support?", a: "Share your order details along with a description of the issue, and we'll guide you through the support process." },
  { cat: "Warranty & Support", q: "Is customer support available after purchase?", a: "Yes. We provide post-purchase support for eligible products." },
  { cat: "Warranty & Support", q: "How can I contact support quickly?", a: "The fastest way is through WhatsApp. You can also reach us through our other listed contact methods." },

  { cat: "Account & Usage", q: "Can I change account details after delivery?", a: "Please review the product description or contact us before purchasing." },
  { cat: "Account & Usage", q: "Are products tied to my personal account?", a: "Some products are linked to your own account, while others may require a different activation method. Product details will explain this." },
  { cat: "Account & Usage", q: "Is my product compatible across multiple devices?", a: "Device compatibility depends on the specific product and plan. Refer to the product details." },

  { cat: "Website", q: "How can I search for a product?", a: "Use the search bar or browse products by category to quickly find what you need." },
  { cat: "Website", q: "How do I know if a product is in stock?", a: "Each product displays its current availability status, which is updated regularly." },

  { cat: "Business", q: "Do you offer services for businesses or teams?", a: "Yes. If you need products for a team or business, contact us to discuss suitable options." },
  { cat: "Business", q: "Can I purchase products in bulk?", a: "Bulk purchases may be available for certain products. Please contact us for more information." },
  { cat: "Business", q: "Do you accept partnership or collaboration requests?", a: "Yes. Feel free to reach out if you're interested in working with us." },

  { cat: "Security", q: "Is my personal information protected?", a: "Yes. We handle customer information responsibly and use it only for order processing and support." },
  { cat: "Security", q: "Do you share my information with others?", a: "No. We do not share your personal information except where necessary to complete your order." },
];

export const CATEGORIES: readonly ("All" | Category)[] = [
  "All",
  "General",
  "Orders & Delivery",
  "Products",
  "Payment",
  "Warranty & Support",
  "Account & Usage",
  "Website",
  "Business",
  "Security",
  "Contact",
] as const;
