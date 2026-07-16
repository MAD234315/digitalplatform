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

const marqueeItems = [
  "ChatGPT Plus","Canva Pro","Adobe Cloud","Netflix","Prime Video","YouTube Premium",
  "Microsoft 365","Notion Plus","Figma","Coursera Plus","LinkedIn Premium","Perplexity Pro",
  "Google AI Pro","Autodesk","Webflow","Framer","Grammarly","ElevenLabs","Apple Music","Spotify",
];

const categories = [
  "AI Productivity Tools","Creative & Design Software","Streaming Subscriptions","Microsoft & Office",
  "Educational Platforms","Developer Tools","Cloud Services","Professional Software",
  "Gift Cards","Productivity Apps","Business Tools","Premium Memberships",
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
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <SiteNav />
        <div className="mx-auto max-w-6xl px-6 lg:px-10 pt-40 pb-24 lg:pt-48 lg:pb-32 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
            Trusted digital marketplace · Since 2020
          </div>
          <h1 className="mt-8 font-display text-[54px] sm:text-7xl lg:text-8xl leading-[0.98]">
            Premium digital products
            <br />
            &amp; AI tools,
            <br />
            <em className="text-headline">at prices that make sense.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base text-muted-foreground leading-relaxed">
            Access 200+ premium subscriptions, AI tools, software licenses, gift cards and productivity
            solutions — all in one place. Catalogue refreshed daily, prices kept honest, support that
            actually replies.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center rounded-full bg-amber px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-amber-foreground shadow-soft hover:brightness-105 transition"
            >
              Enter the Marketplace
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-border bg-transparent px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-muted transition"
            >
              Institutional Access
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="border-t border-border pt-5 text-left">
                <div className="font-display text-3xl">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* WHO WE ARE */}
      <section className="mx-auto max-w-6xl px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Who we are</div>
            <div className="mt-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber font-display text-3xl text-amber-foreground">D</div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-display text-4xl sm:text-5xl">
              A trusted marketplace for <em className="text-headline">premium digital tools.</em>
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

            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Our mission</div>
              <p className="mt-3 font-display text-2xl leading-snug">
                Help creators, students, professionals, developers and businesses access the digital tools
                they need — without paying unnecessary prices.
              </p>
              <Link to="/products" className="mt-6 inline-flex items-center gap-2 text-sm text-amber hover:opacity-80">
                Browse the catalogue <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Our services</div>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl">Twelve worlds, one shelf.</h2>
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
                      className="group flex items-center justify-between py-5 gap-6 hover:pl-3 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <span className="font-display text-lg text-muted-foreground w-8">{String(i + 1).padStart(2, "0")}</span>
                        <span className="font-display text-2xl">{c}</span>
                      </div>
                      <span className="text-amber opacity-0 group-hover:opacity-100 transition">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* REASONS */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Why choose us</div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl">
              Six reasons the return <em className="text-headline">customers come back.</em>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((r) => (
              <article key={r.n} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-xl text-muted-foreground">{r.n}</div>
                <h3 className="mt-4 font-display text-2xl">{r.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MOTTO + PROMISE */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Our motto</div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl leading-tight">
              Premium digital solutions.
              <br />
              <em className="text-headline">Genuine sources.</em>
              <br />
              Trusted service.
            </h2>
            <p className="mt-6 text-muted-foreground max-w-md">
              Making premium digital tools affordable for everyone — one honest transaction at a time.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Customer promise</div>
              <h3 className="mt-3 font-display text-2xl">We are committed to:</h3>
              <ul className="mt-6 space-y-3 text-sm">
                {promises.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT PROMPT */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 lg:py-32">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Get in touch</div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            Suggestions, feedback <em className="text-headline">&amp; collabs.</em>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Ideas for products to add, feedback on your experience, or a partnership pitch — we read every message.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Suggestion", "Feedback", "Collaboration"].map((t) => (
              <a
                key={t}
                href={`mailto:${CONTACT.EMAIL}?subject=%5B${t}%5D`}
                className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm hover:bg-muted transition"
              >
                {t}
              </a>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-border bg-hero p-10 lg:p-14">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ready when you are</div>
            <h3 className="mt-4 font-display text-4xl sm:text-5xl max-w-2xl">
              Ready to upgrade your <em className="text-headline">digital experience?</em>
            </h3>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Explore our collection of premium AI tools, software, subscriptions and digital products.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="rounded-full bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-foreground">
                Browse products
              </Link>
              <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em]">
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
