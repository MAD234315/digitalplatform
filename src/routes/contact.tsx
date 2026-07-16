import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter, CONTACT } from "@/components/site-chrome";

const SITE = "https://digitalplatform13.lovable.app";
const URL = SITE + "/contact";
const TITLE = "Contact Digital Platform — Support & Sales";
const DESC = "Reach us on WhatsApp for live pricing, stock checks and support. Typical reply within minutes, every day 10 AM – 10 PM IST.";

export const Route = createFileRoute("/contact")({
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
          "@type": "ContactPage",
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
            { "@type": "ListItem", position: 2, name: "Contact", item: URL },
          ],
        }),
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <main id="main">
      <section className="relative bg-hero">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-40 pb-20 lg:pt-48 lg:pb-28">

          <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Contact</div>
          <h1 className="mt-6 font-display text-6xl lg:text-8xl leading-[0.98]">
            Let&apos;s <em className="text-headline">talk.</em>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            The fastest way to reach us is WhatsApp — we typically reply within minutes with live pricing
            and stock updates.
          </p>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 grid gap-6 md:grid-cols-2">
          <a href={CONTACT.WA_URL} target="_blank" rel="noreferrer" className="group rounded-2xl border border-border bg-card p-8 hover:border-amber transition">
            <div className="text-xs uppercase tracking-[0.22em] text-amber">Preferred</div>
            <h2 className="mt-3 font-display text-3xl">WhatsApp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send a message with the product you&apos;re interested in.
            </p>
            <div className="mt-6 font-display text-xl">+91 96521 91369</div>
            <div className="mt-6 text-sm text-amber group-hover:translate-x-1 transition inline-flex">Open WhatsApp →</div>
          </a>
          <a href={`mailto:${CONTACT.EMAIL}`} className="group rounded-2xl border border-border bg-card p-8 hover:border-amber transition">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Email</div>
            <h2 className="mt-3 font-display text-3xl">Mail</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Suggestions, feedback, or collabs? Drop us a line.
            </p>
            <div className="mt-6 font-display text-lg break-all">{CONTACT.EMAIL}</div>
            <div className="mt-6 text-sm text-amber group-hover:translate-x-1 transition inline-flex">Send email →</div>
          </a>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-4xl">
              Contact <em className="text-headline">admin</em>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              For the fastest reply, include these details in your message:
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Your full name and email address</li>
              <li>• Product or service you&apos;re asking about</li>
              <li>• Budget or expected quantity, if any</li>
              <li>• Preferred delivery timeline</li>
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Support hours</div>
              <p className="mt-3 font-display text-2xl">Every day, 10 AM – 10 PM IST.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Messages sent outside these hours get a reply first thing next morning.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  "Live pricing on any listed product",
                  "Stock check before you order",
                  "Post-purchase support & warranty",
                  "Requests for products not in the catalogue",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <span className="text-amber">✓</span>{x}
                  </li>
                ))}
              </ul>
              <a
                href={`${CONTACT.WA_URL}?text=Hi%2C%20I%27d%20like%20live%20pricing%20on%3A`}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex rounded-full bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-foreground"
              >
                Send via WhatsApp
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
