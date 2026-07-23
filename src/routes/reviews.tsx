import { createFileRoute, Link } from "@tanstack/react-router";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID, SITE_URL } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { Star } from "lucide-react";

const TITLE = "Customer Reviews — Digital Platform";
const DESC =
  "Real feedback from customers using Digital Platform for premium digital subscriptions, AI tools and software licenses.";

type Review = {
  name: string;
  location: string;
  rating: number;
  product: string;
  body: string;
  date: string;
};

const REVIEWS: Review[] = [
  {
    name: "Arjun M.",
    location: "Bengaluru",
    rating: 5,
    product: "Netflix Premium (12 months)",
    body: "Delivery was almost instant on WhatsApp. Working perfectly for months now — support answered every question quickly.",
    date: "March 2026",
  },
  {
    name: "Priya S.",
    location: "Mumbai",
    rating: 5,
    product: "Adobe Creative Cloud",
    body: "Genuine license at less than half the retail price. Onboarding instructions were clear and everything activated first try.",
    date: "February 2026",
  },
  {
    name: "Rahul K.",
    location: "Hyderabad",
    rating: 5,
    product: "ChatGPT Plus",
    body: "Was skeptical at first but the team walked me through the setup. Renewal was smooth and they honored the warranty.",
    date: "January 2026",
  },
  {
    name: "Sneha T.",
    location: "Pune",
    rating: 4,
    product: "Spotify Premium Family",
    body: "Great price, fast delivery. Small hiccup with region setup but resolved within the same day.",
    date: "December 2025",
  },
  {
    name: "Vikram R.",
    location: "Delhi",
    rating: 5,
    product: "Windows 11 Pro Key",
    body: "Activated instantly. This is the third product I've bought here — trust is earned and Digital Platform earned mine.",
    date: "November 2025",
  },
  {
    name: "Ananya D.",
    location: "Chennai",
    rating: 5,
    product: "Canva Pro (1 year)",
    body: "Legit account, no surprises, no shady sharing. Perfect for my freelance design work. Highly recommend.",
    date: "October 2025",
  },
];

const AVG = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

export const Route = createFileRoute("/reviews")({
  head: () =>
    buildRouteHead({
      path: "/reviews",
      title: TITLE,
      description: DESC,
      imageAlt: "Digital Platform — customer reviews",
      extraJsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          url: `${SITE_URL}/reviews`,
          name: TITLE,
          description: DESC,
          publisher: { "@id": ORG_ID },
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": ORG_ID,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: AVG,
            reviewCount: REVIEWS.length,
            bestRating: "5",
            worstRating: "1",
          },
          review: REVIEWS.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: "5",
            },
            reviewBody: r.body,
            itemReviewed: { "@type": "Product", name: r.product },
          })),
        },
      ],
    }),
  component: Reviews,
});

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < n ? "fill-amber text-amber" : "text-muted-foreground/30"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function Reviews() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Customer Reviews"
        title="Trusted by thousands,"
        titleAccent="rated by real people."
        lede={`Average rating ${AVG} / 5 across verified purchases. Here's what customers say about ordering premium digital products with us on WhatsApp.`}
      />

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {REVIEWS.length} reviews
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="font-display text-5xl leading-none text-headline">{AVG}</div>
                <div>
                  <Stars n={5} />
                  <div className="mt-1 text-xs text-muted-foreground">out of 5</div>
                </div>
              </div>
            </div>
            <a
              href={`${CONTACT.WA_URL}?text=${encodeURIComponent(
                "Hi Digital Platform! I'd like to share a review of my recent purchase.",
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-card"
            >
              Leave a review →
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <article
                key={`${r.name}-${r.date}`}
                className="flex flex-col rounded-2xl border border-border bg-card/40 p-6 transition hover:border-amber/40 hover:bg-card/60"
              >
                <Stars n={r.rating} />
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">&ldquo;{r.body}&rdquo;</p>
                <div className="mt-6 border-t border-border pt-4">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.location} · {r.date}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.14em] text-amber/80">{r.product}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Your turn</div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            Ready to order? <em className="text-headline">Ping us on WhatsApp.</em>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="rounded-full bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-foreground"
            >
              Browse catalogue →
            </Link>
            <a
              href={CONTACT.WA_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em]"
            >
              Contact us →
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
