import { createFileRoute, Link } from "@tanstack/react-router";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID, SITE_URL } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";

const TITLE = "About Digital Platform — Our Story & Promise";
const DESC =
  "Digital Platform is a trusted marketplace for premium digital subscriptions, AI tools and software licenses — serving customers since 2020.";

export const Route = createFileRoute("/about")({
  head: () =>
    buildRouteHead({
      path: "/about",
      title: TITLE,
      description: DESC,
      imageAlt: "Digital Platform — about us",
      extraJsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${SITE_URL}/about`,
          name: TITLE,
          description: DESC,
          publisher: { "@id": ORG_ID },
        },
      ],
    }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="About us"
        title="One Person,"
        titleAccent="Countless possibilities"
        lede="Digital Platform is independently built and managed by a single creator. Since 2020, I've helped thousands of customers access premium digital subscriptions, AI tools, productivity software, creative tools, and digital services at affordable prices. Every product, update, and customer interaction is handled with care to ensure quality and reliability."
      />

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Mission</div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-display text-2xl sm:text-3xl">
              Make premium <em className="text-headline">accessible.</em>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Help normal people, creators, students, professionals, developers and businesses access
              the digital tools they need — without paying unnecessary prices. We believe premium software
              should be accessible, affordable, and supported by excellent customer service.
            </p>
            <blockquote className="mt-6 border-l-2 border-amber pl-5 font-display text-xl leading-snug">
              &ldquo; Genuine sources. Reliable service.&rdquo;
              <div className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground not-italic">— OUR MOTTO</div>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-12 sm:py-16 lg:py-20 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ready when you are.</div>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl">
            Browse the live catalogue <em className="text-headline">or say hello</em>
            <br />— we usually reply at earliest.
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/products" className="rounded-full bg-amber px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-foreground">
              Browse products →
            </Link>
            <a href={`${CONTACT.WA_URL}?text=${encodeURIComponent("Hi Digital Platform! I found you via your website and I'd like to say hello.")}`} target="_blank" rel="noreferrer" className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em]">
              Contact us →
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
