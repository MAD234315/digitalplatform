import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter, WhatsAppIcon } from "@/components/site-chrome";
import heroImg from "@/assets/hero-vault.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const trustBadges = [
  { label: "Trusted Since 2020" },
  { label: "15,000+ Happy Customers" },
  { label: "Genuine Sources" },
  { label: "Instant Support" },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <SiteNav />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-36 pb-24 lg:pt-44 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary-foreground/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
              Premium Digital Marketplace
            </span>

            <h1 className="mt-6 font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Premium <em className="text-gold not-italic italic">Apps &amp; AI Tools</em>
              <br /> at affordable prices.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-primary-foreground/75">
              Genuine subscriptions for students, creators, professionals, and businesses —
              delivered instantly, supported personally.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 max-w-lg">
              {trustBadges.map((b) => (
                <li key={b.label} className="flex items-center gap-2 text-sm text-primary-foreground/85">
                  <CheckMark />
                  {b.label}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-primary shadow-lift hover:brightness-105 transition"
              >
                Explore Plans
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <a
                href="https://wa.me/919999999999"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition backdrop-blur"
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                Join WhatsApp
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-primary-foreground/60">
              <div>
                <div className="font-display text-2xl text-primary-foreground">15K+</div>
                <div>Customers served</div>
              </div>
              <div className="h-8 w-px bg-primary-foreground/15" />
              <div>
                <div className="font-display text-2xl text-primary-foreground">4.9★</div>
                <div>Average rating</div>
              </div>
              <div className="h-8 w-px bg-primary-foreground/15" />
              <div>
                <div className="font-display text-2xl text-primary-foreground">24/7</div>
                <div>Instant support</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-lift ring-1 ring-primary-foreground/10">
              <img
                src={heroImg}
                alt="Premium apps and AI tools"
                width={1408}
                height={1200}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-background/85 backdrop-blur p-4 flex items-center justify-between shadow-card">
                <div>
                  <div className="text-xs text-muted-foreground">Starting from</div>
                  <div className="font-display text-2xl text-foreground">₹49<span className="text-sm text-muted-foreground">/month</span></div>
                </div>
                <Link to="/products" className="text-xs font-semibold text-foreground underline underline-offset-4">Browse all →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section id="trust" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-8 flex flex-wrap items-center justify-between gap-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Powering subscriptions for</span>
          {["ChatGPT", "Netflix", "Canva", "Adobe", "Spotify", "YouTube", "Grammarly"].map((n) => (
            <span key={n} className="font-display text-xl text-foreground/70">{n}</span>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function CheckMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-whatsapp/20 text-whatsapp">
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
