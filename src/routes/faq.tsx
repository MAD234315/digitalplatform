import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";
import { OG_IMAGE, ORG_ID, SITE_URL } from "@/lib/site-config";

const URL = SITE_URL + "/faq";
const TITLE = "FAQ — Digital Platform | Orders, Delivery, Warranty & Support";
const DESC = "Answers to the most common questions about our digital products, subscriptions, delivery process, warranty, and support at Digital Platform.";

type Category =
  | "General"
  | "Orders & Delivery"
  | "Products"
  | "Warranty & Support"
  | "Account & Usage"
  | "Security"
  | "Contact";

interface QA {
  q: string;
  a: string;
  cat: Category;
}

const FAQS: QA[] = [
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

const CATEGORIES: readonly ("All" | Category)[] = [
  "All",
  "General",
  "Orders & Delivery",
  "Products",
  "Warranty & Support",
  "Account & Usage",
  "Security",
  "Contact",
] as const;

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Digital Platform — frequently asked questions" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          publisher: { "@id": ORG_ID },
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
            { "@type": "ListItem", position: 2, name: "FAQ", item: URL },
          ],
        }),
      },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (active !== "All" && f.cat !== active) return false;
      if (needle && !(f.q + " " + f.a).toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [active, q]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    m.set("All", FAQS.length);
    for (const f of FAQS) m.set(f.cat, (m.get(f.cat) ?? 0) + 1);
    return m;
  }, []);

  const waLink = `${CONTACT.WA_URL}?text=${encodeURIComponent("Hi, I have a question about your products.")}`;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />

      <main id="main">
        {/* Hero */}
        <section className="relative bg-hero">
          <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-40 pb-16 lg:pt-48 lg:pb-24">
            <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Frequently asked questions</div>
            <h1 className="mt-6 font-display text-6xl lg:text-8xl leading-[0.98]">
              Everything you need
              <br />
              <em className="text-headline">to know before purchasing.</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Answers to the most common questions about our digital products, subscriptions, delivery,
              warranty, and support. Can&apos;t find what you&apos;re looking for? Message us — we usually reply within minutes.
            </p>
          </div>
        </section>

        {/* Sticky search + tabs */}
        <div className="sticky top-16 sm:top-20 z-30 border-y border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="tablist"
              aria-label="Filter FAQs by category"
              className="scroll-slim flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            >
              {CATEGORIES.map((name) => {
                const isActive = active === name;
                return (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(name)}
                    className={`whitespace-nowrap rounded-full border px-4 min-h-9 text-xs font-medium uppercase tracking-[0.14em] transition ${
                      isActive
                        ? "border-transparent shadow-soft"
                        : "border-border bg-card hover:bg-muted hover:border-foreground/20"
                    }`}
                    style={isActive ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                  >
                    {name} <span className="opacity-60">· {counts.get(name) ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full lg:w-72 lg:shrink-0">
              <label htmlFor="faq-search" className="sr-only">Search FAQs</label>
              <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="faq-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search FAQs…"
                className="w-full rounded-full border border-border bg-card pl-11 pr-4 min-h-10 text-sm outline-none transition focus:border-foreground/40"
              />
            </div>
          </div>
        </div>

        {/* Accordion list */}
        <section className="mx-auto max-w-5xl px-6 lg:px-10 py-14">
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              No questions match your search. Try a different keyword or category.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((f, i) => (
                <li key={`${f.cat}-${i}`}>
                  <details className="group rounded-2xl border border-border bg-card/60 transition hover:border-foreground/20">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{f.cat}</div>
                        <div className="mt-1 font-display text-lg leading-snug">{f.q}</div>
                      </div>
                      <span
                        aria-hidden
                        className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition group-open:rotate-45 group-open:text-foreground group-open:border-foreground/40"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 pb-5 -mt-1 text-sm leading-relaxed text-muted-foreground animate-rise">
                      {f.a}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 lg:py-28 text-center">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Still have questions?</div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">
              Can&apos;t find <em className="text-headline">the answer</em> you&apos;re looking for?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              Our support team is a message away — every day, 10 AM to 10 PM IST.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={waLink} target="_blank" rel="noreferrer" className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: "var(--whatsapp)" }}>
                💬 Chat on WhatsApp
              </a>
              <a href={`mailto:${CONTACT.EMAIL}`} className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em]">
                📞 Email support
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky WhatsApp floating button */}
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: "var(--whatsapp)" }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M20.5 3.5A11 11 0 0 0 3 17l-1 5 5.2-1.3A11 11 0 1 0 20.5 3.5Zm-8.5 18a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21.5Zm5.2-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.2.2-.3.2-.6 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.3s.9 2.7 1 2.9c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.3-.1-.1-.2-.2-.5-.3Z" />
        </svg>
        <span className="hidden sm:inline">Need help? Chat</span>
      </a>

      <SiteFooter />
    </div>
  );
}
