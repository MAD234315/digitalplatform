import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";

const SITE = "https://digitalplatform13.lovable.app";
const URL = SITE + "/about";
const TITLE = "About Digital Platform — Our Story & Promise";
const DESC = "A small team, a big shelf. Digital Platform is a trusted marketplace for premium digital subscriptions, AI tools and software licenses — serving customers since 2020.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: URL,
          name: TITLE,
          description: DESC,
          publisher: { "@id": SITE + "/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
            { "@type": "ListItem", position: 2, name: "About", item: URL },
          ],
        }),
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <main id="main">
      <section className="relative bg-hero">

        <SiteNav />
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-40 pb-20 lg:pt-48 lg:pb-28">
          <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">About us</div>
          <h1 className="mt-6 font-display text-6xl lg:text-8xl leading-[0.98]">
            A small team,
            <br />
            <em className="text-headline">a big shelf.</em>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Digital Platform is a trusted marketplace for premium digital products and AI tools.
            Since 2020, we&apos;ve helped thousands of customers access high-quality subscriptions,
            productivity software, creative tools and digital services at affordable prices.
          </p>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Mission</div>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-display text-4xl sm:text-5xl">
              Make premium <em className="text-headline">accessible.</em>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Help creators, students, professionals, developers and businesses access the digital tools
              they need — without paying unnecessary prices. We believe premium software should be accessible,
              affordable, and supported by excellent customer service.
            </p>
            <blockquote className="mt-10 border-l-2 border-amber pl-6 font-display text-2xl leading-snug">
              &ldquo;Premium digital solutions. Genuine sources. Trusted service.&rdquo;
              <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground not-italic">— Our motto</div>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-24 lg:py-32 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ready when you are.</div>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">
            Browse the live catalogue <em className="text-headline">or say hello</em>
            <br />— we usually reply within minutes.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/products" className="rounded-full bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-foreground">
              Browse products →
            </Link>
            <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em]">
              Contact us →
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
