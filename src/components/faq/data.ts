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
  | "Contact"
  | "Global Customers";

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
  { cat: "Products", q: "How often are prices updated?", a: "Our prices and plans change based on demand and availability." },

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

  { cat: "Global Customers", q: "Can customers from outside India purchase products from your website?", a: "Yes. Customers from countries outside India may be able to purchase eligible products and plans from our website.\n\nHowever, availability can vary by country or region. International customers should provide their country information before making any payment so that we can check whether the selected product or plan is suitable for their location." },
  { cat: "Global Customers", q: "Why do international customers need to provide their country?", a: "Some digital products, subscriptions and plans are subject to country-specific or regional restrictions.\n\nDepending on the product, availability may be affected by:\n• Country or region\n• Service-provider restrictions\n• Activation requirements\n• Supported countries\n• Regional availability\n• Features available in a particular country\n• Pricing or plan variations\n• Account or subscription eligibility\n\nProviding your country in advance allows us to check the plan before payment." },
  { cat: "Global Customers", q: "Do all plans work in every country?", a: "No. Not every plan is guaranteed to work in every country.\n\nA plan that is available or working in India may have different availability or restrictions in another country.\n\nTherefore, international customers should always provide their country before purchasing." },
  { cat: "Global Customers", q: "I am from another country. What information should I provide?", a: "Before making payment, please provide:\n• Your country name\n• Product or plan name\n• Required duration, if applicable\n\nYou may also provide your email address or WhatsApp number if required for verification or further assistance." },
  { cat: "Global Customers", q: "When should I provide my country?", a: "Please provide your country before making the payment.\n\nWe recommend checking compatibility before payment rather than paying first and asking about availability afterward." },
  { cat: "Global Customers", q: "Can I make the payment first and tell you my country later?", a: "We strongly recommend not doing this.\n\nInternational plans may have country or regional restrictions. If a plan is activated before its compatibility is confirmed, resolving an incompatibility may not be possible.\n\nPlease provide your country and confirm availability before payment and activation." },
  { cat: "Global Customers", q: "What happens after I provide my country?", a: "We will check whether the selected plan is suitable for your country, based on the availability and restrictions applicable to that product.\n\nYou may receive one of the following outcomes:\n• Available — The selected plan is suitable for your country and you can proceed with the purchase.\n• Verification Required — Additional checking may be required before confirming availability.\n• Not Available — The selected plan may not be suitable or available in your country.\n• Alternative Available — We may suggest another plan or product that is more suitable for your country, if an alternative is available." },
  { cat: "Global Customers", q: "What if my selected plan is not available in my country?", a: "If the selected plan is not suitable for your country, we may suggest a suitable alternative, whenever one is available.\n\nThe alternative may have different:\n• Duration\n• Features\n• Availability\n• Pricing\n• Activation method\n• Terms\n\nYou can review the alternative before deciding whether to purchase it." },
  { cat: "Global Customers", q: "Will the alternative plan have the same price?", a: "Not necessarily.\n\nDifferent plans or country-specific versions may have different pricing, features or durations.\n\nWe will provide the applicable details of the alternative before you make the payment." },
  { cat: "Global Customers", q: "What if I accidentally provide the wrong country?", a: "Please contact us before making payment or activation so that the information can be corrected.\n\nProviding accurate country information is important because the selected plan may depend on the customer's actual location or region." },
  { cat: "Global Customers", q: "Can I change my country after purchasing a plan?", a: "It depends on the product and its service-provider restrictions.\n\nChanging the country after payment or activation does not necessarily mean that the plan will become compatible with the new country.\n\nTherefore, please provide your correct country before purchasing." },
  { cat: "Global Customers", q: "What happens if the plan works in India but does not work in my country?", a: "Country-specific availability may mean that a plan available in India is not available or fully supported elsewhere.\n\nIf you are an international customer, please inform us of your country before payment so that we can check the applicable availability." },
  { cat: "Global Customers", q: "Is country compatibility guaranteed after activation?", a: "Compatibility depends on the product/service provider and the applicable country or regional restrictions.\n\nWe can check the available information before payment, but customers should understand that third-party services may have their own policies, restrictions or changes." },
  { cat: "Global Customers", q: "What if the service provider changes its country restrictions later?", a: "Third-party services may change their policies, supported countries, features or regional restrictions from time to time.\n\nSuch changes may be outside our control.\n\nWe recommend reviewing the applicable product information and contacting us if you have any concerns." },
  { cat: "Global Customers", q: "Can international customers use the same payment process as Indian customers?", a: "Payment availability may depend on the payment method and the customer's location.\n\nPlease contact us if you are outside India and are unsure about the available payment method." },
  { cat: "Global Customers", q: "Do international customers have different plans?", a: "Some products may have different plans, versions or availability depending on the country or region.\n\nIf the standard plan is not suitable for your country, we may check whether another available option exists." },
  { cat: "Global Customers", q: "Can I purchase multiple plans from another country?", a: "You should provide your country before making payment, particularly if the products are subject to country or regional restrictions.\n\nFor multiple products, we may need to verify each product separately because availability can differ between products." },
  { cat: "Global Customers", q: "What if one product works in my country but another product does not?", a: "This is possible.\n\nCountry availability is product-specific. A product being available in your country does not automatically mean that every other product will have the same availability.\n\nPlease check each product before payment when you are an international customer." },
  { cat: "Global Customers", q: "Can I purchase a product for someone living in another country?", a: "If the product will be used by someone in a different country, please provide the actual country where the product/account will be used before payment.\n\nDo not provide only the purchaser's country if the service will be used in another region." },
  { cat: "Global Customers", q: "What country should I provide if I am travelling?", a: "Please provide the relevant country where the plan/account is expected to be used, and inform us that you are travelling if that affects your situation.\n\nSome services may have specific regional rules for temporary or long-term use." },
  { cat: "Global Customers", q: "What if I live in one country but use the service in another?", a: "Please inform us of both locations if relevant.\n\nFor example:\nAccount/Customer Country: India\nExpected Usage Country: United States\n\nThis allows us to better understand the situation before payment." },
  { cat: "Global Customers", q: "What if I use a VPN?", a: "Do not assume that using a VPN will make a country-restricted plan compatible with your location.\n\nCountry availability, account eligibility and service restrictions may be determined by the service provider in ways that are not dependent only on IP address.\n\nPlease provide your actual country and ask us to verify the plan before payment." },
  { cat: "Global Customers", q: "What if the website says a plan is available but you say it needs verification?", a: "Product availability can depend on the specific plan, activation method, account requirements and region.\n\nIf a product requires verification, please wait for confirmation before making payment." },
  { cat: "Global Customers", q: "Can I get a refund if the plan doesn't work in my country?", a: "Refund eligibility depends on the product, activation status, applicable terms and the circumstances of the order.\n\nIf a customer purchases or activates a plan without providing the correct country information beforehand, a refund may not be possible where the issue results from country or regional restrictions.\n\nPlease contact us before payment if you are unsure." },
  { cat: "Global Customers", q: "Why may a refund not be possible after activation?", a: "Digital products and subscriptions may be delivered, activated or linked to an account immediately.\n\nOnce activation has taken place, reversing the transaction may not be possible, particularly where the issue is caused by:\n• Country restrictions\n• Regional restrictions\n• Incorrect country information\n• Unsupported location\n• Third-party service limitations\n• Customer-side eligibility restrictions\n\nAll refund requests remain subject to the applicable Refund Policy." },
  { cat: "Global Customers", q: "What if I forgot to tell you that I am an international customer?", a: "Contact us as soon as possible before payment or activation.\n\nIf the payment has already been made, do not assume that the plan can be refunded or changed. Contact us immediately so that we can review the situation." },
  { cat: "Global Customers", q: "Can you guarantee that an international plan will always work?", a: "We can check the available compatibility information before purchase, but we cannot guarantee that a third-party service will never change its policies, restrictions or availability.\n\nThird-party service providers may modify their terms, supported countries, features or regional policies at any time." },
  { cat: "Global Customers", q: "Who is responsible for providing the correct country information?", a: "The customer is responsible for providing accurate and complete country information before payment.\n\nIncorrect or incomplete information may result in the wrong plan being recommended or purchased." },
  { cat: "Global Customers", q: "Can I contact you before purchasing?", a: "Yes. In fact, international customers are encouraged to contact us before making payment if they are unsure about a product's availability.\n\nPlease provide:\n• Country\n• Product Name\n• Plan/Duration\n\nWe can then check the available options." },
  { cat: "Global Customers", q: "What should I do if I am unsure whether a plan works in my country?", a: "Do not make the payment immediately.\n\nContact us with your:\n• Country\n• Product/Plan\n• Duration\n\nWe will check the available information and guide you toward the appropriate option." },
  { cat: "Global Customers", q: "How can I contact international customer support?", a: "If you are outside India and want to purchase a product, please contact us before making the payment.\n\nPlease send:\n• Country:\n• Product:\n• Plan/Duration:\n\nWe will check the available option for your country and, where possible, suggest a suitable alternative.\n\nImportant Reminder\nInternational customers must provide their country before making payment. Plans and services may vary by country or region. Please confirm compatibility before payment and activation. Once a plan has been activated, refunds or changes may not be possible in cases involving country or regional restrictions, subject to the applicable Refund Policy.\n\nThank you for your understanding and cooperation." },
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
  "Global Customers",
] as const;
