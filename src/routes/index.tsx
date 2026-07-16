import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  component: Home,
});

const stats = [
  { value: "200+", label: "Curated Assets" },
  { value: "Daily", label: "Catalogue Refresh" },
  { value: "5 yrs", label: "Trusted Service" },
  { value: "24/7", label: "Human Support" },
];

const categories = [
  "AI Productivity Tools", "Creative & Design Software", "Streaming Subscriptions", "Microsoft & Office",
  "Educational Platforms", "Developer Tools", "Cloud Services", "Professional Software",
  "Gift Cards", "Productivity Apps", "Business Tools", "Premium Memberships",
];

const reasons = [
  { n: "01", title: "Trusted Since 2020", body: "Half a decade of quietly serving thousands of creators, students and businesses with real support." },
  { n: "02", title: "200+ Premium Products", body: "One of the largest curated catalogues of subscriptions, AI tools and licensed software in India." },
  { n: "03", title: "Updated Daily", body: "Stock, plans and pricing move every day. What you see is what's actually available today." },
  { n: "04", title: "Reliable Support", body: "Human answers before and after every purchase — no ticket queues, no bots, no runaround." },
  { n: "05", title: "Genuine Sources", body: "We focus on legitimate licenses and authentic gift card channels. Illegal items are off-limits." },
  { n: "06", title: "Affordable Pricing", body: "Real discounts on premium software so paying full retail becomes the last resort, not the default." },
];

const promises = [
  "High-quality digital services",
  "Secure and smooth transactions",
  "Fast delivery whenever applicable",
  "Responsive customer support",
  "Transparent communication",
  "Regularly updated product catalogue",
];

function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />

      <main id="main">
        {/* HERO */}
        <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-hero">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-[520px] blur-[120px] opacity-60"
            style={{
              background:
                "radial-gradient(600px 320px at 50% 50%, oklch(0.80 0.14 82 / 0.22), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-24 lg:pb-32 text-center">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: "var(--amber)" }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--amber)" }}
                />
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] font-medium text-amber">
                Trusted digital marketplace · Since 2020
              </span>
            </div>

            <h1
              id="hero-heading"
              className="animate-rise mt-8 font-display text-balance text-[44px] leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Premium digital products
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              &amp; AI tools,
              <br />
              <em className="italic text-headline">at prices that make sense.</em>
            </h1>

            <p className="animate-rise mx-auto mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Access 200+ premium subscriptions, AI tools, software licenses, gift cards and productivity
              solutions — all in one place. Catalogue refreshed daily, prices kept honest, support that
              actually replies.
            </p>

            <div className="animate-rise mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center min-h-12 rounded-sm px-7 text-sm font-semibold uppercase tracking-[0.14em] shadow-gold transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
                style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
              >
                Enter the Marketplace
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center min-h-12 rounded-sm border border-border bg-transparent px-7 text-sm font-semibold uppercase tracking-[0.14em] text-foreground hover:bg-card transition"
              >
                Institutional Access
              </Link>
            </div>

            {/* STATS */}
            <dl className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-sm border border-border bg-border overflow-hidden max-w-4xl mx-auto">
              {stats.map((s) => (
                <div key={s.label} className="bg-background/60 p-5 sm:p-6 text-left">
                  <dt className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">{s.label}</dt>
                  <dd className="mt-2 font-display text-3xl sm:text-4xl text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* WHO WE ARE */}
        <section aria-labelledby="who-heading" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
              <div className="lg:col-span-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Who we are</div>
                <div
                  aria-hidden
                  className="mt-8 inline-flex h-16 w-16 items-center justify-center rounded-md font-display text-3xl"
                  style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
                >
                  D
                </div>
              </div>
              <div className="lg:col-span-8">
                <h2 id="who-heading" className="font-display text-4xl sm:text-5xl">
                  A trusted marketplace for <em className="italic text-headline">premium digital tools.</em>
                </h2>
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  Digital Platform is a trusted marketplace for premium digital products and AI tools.
                  Since 2020, we&apos;ve helped thousands of customers access high-quality subscriptions,
                  productivity software, creative tools and digital services — at affordable prices.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Our mission is simple: make premium digital services more accessible while delivering
                  reliable customer support and a smooth buying experience.
                </p>

                <div className="mt-10 rounded-sm border border-border bg-card/60 p-6 sm:p-8">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Our mission</div>
                  <p className="mt-3 font-display text-2xl sm:text-3xl leading-snug">
                    Help creators, students, professionals, developers and businesses access the digital tools
                    they need — without paying unnecessary prices.
                  </p>
                  <Link
                    to="/products"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber hover:brightness-110"
                  >
                    Browse the catalogue <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section aria-labelledby="cat-heading" className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
              <div className="lg:col-span-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Our services</div>
                <h2 id="cat-heading" className="mt-4 font-display text-4xl sm:text-5xl">Twelve worlds, one shelf.</h2>
                <p className="mt-4 text-muted-foreground max-w-sm">
                  A wide range of digital products across categories — catalogue updated regularly with new
                  products based on availability.
                </p>
              </div>
              <div className="lg:col-span-8">
                <ul className="divide-y divide-border border-y border-border">
                  {categories.map((c, i) => (
                    <li key={c}>
                      <Link
                        to="/products"
                        className="group flex items-center justify-between gap-6 py-5 transition-all hover:pl-3"
                      >
                        <div className="flex min-w-0 items-center gap-6">
                          <span className="w-8 shrink-0 font-display text-lg text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="truncate font-display text-xl sm:text-2xl">{c}</span>
                        </div>
                        <span
                          aria-hidden
                          className="shrink-0 text-amber opacity-0 group-hover:opacity-100 transition"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* REASONS */}
        <section aria-labelledby="why-heading" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Why choose us</div>
              <h2 id="why-heading" className="mt-4 font-display text-4xl sm:text-5xl">
                Six reasons the return <em className="italic text-headline">customers come back.</em>
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reasons.map((r) => (
                <article
                  key={r.n}
                  className="group rounded-sm border border-border bg-card/40 p-6 transition-colors hover:border-amber/30"
                >
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-sm font-medium"
                    style={{ backgroundColor: "color-mix(in oklab, var(--amber) 12%, transparent)", color: "var(--amber)" }}
                    aria-hidden
                  >
                    {r.n}
                  </div>
                  <h3 className="mt-5 font-display text-2xl">{r.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MOTTO + PROMISE */}
        <section aria-labelledby="promise-heading" className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32 grid lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Our motto</div>
              <h2 id="promise-heading" className="mt-4 font-display text-4xl sm:text-5xl leading-tight">
                Premium digital solutions.
                <br />
                <em className="italic text-headline">Genuine sources.</em>
                <br />
                Trusted service.
              </h2>
              <p className="mt-6 text-muted-foreground max-w-md">
                Making premium digital tools affordable for everyone — one honest transaction at a time.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Customer promise</div>
                <h3 className="mt-3 font-display text-2xl">We are committed to:</h3>
                <ul className="mt-6 space-y-3 text-sm">
                  {promises.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]"
                        style={{ backgroundColor: "color-mix(in oklab, var(--amber) 20%, transparent)", color: "var(--amber)" }}
                      >
                        ✓
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT PROMPT */}
        <section aria-labelledby="contact-heading" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Get in touch</div>
            <h2 id="contact-heading" className="mt-4 font-display text-4xl sm:text-5xl">
              Suggestions, feedback <em className="italic text-headline">&amp; collabs.</em>
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Ideas for products to add, feedback on your experience, or a partnership pitch — we read every message.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Suggestion", "Feedback", "Collaboration"].map((t) => (
                <a
                  key={t}
                  href={`mailto:${CONTACT.EMAIL}?subject=%5B${t}%5D`}
                  className="inline-flex items-center min-h-11 rounded-full border border-border px-5 text-sm hover:bg-card transition"
                >
                  {t}
                </a>
              ))}
            </div>

            <div className="mt-14 rounded-sm border border-border bg-hero p-8 sm:p-10 lg:p-14">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Ready when you are</div>
              <h3 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl max-w-2xl">
                Ready to upgrade your <em className="italic text-headline">digital experience?</em>
              </h3>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Explore our collection of premium AI tools, software, subscriptions and digital products.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center min-h-12 rounded-sm px-6 text-sm font-semibold uppercase tracking-[0.14em] shadow-gold hover:brightness-110 transition"
                  style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
                >
                  Browse products
                </Link>
                <a
                  href={CONTACT.WA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center min-h-12 rounded-sm border border-border px-6 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-card transition"
                >
                  WhatsApp us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
