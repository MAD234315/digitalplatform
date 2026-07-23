import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID, SITE_URL } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { Star } from "lucide-react";
import { getSheetReviews, type SheetReview } from "@/lib/sheet-reviews.functions";

const TITLE = "Customer Reviews — Digital Platform";
const DESC =
  "Real feedback from customers using Digital Platform for premium digital subscriptions, AI tools and software licenses.";

const FALLBACK_REVIEWS: SheetReview[] = [];


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
  const fetchReviews = useServerFn(getSheetReviews);
  const { data } = useQuery({
    queryKey: ["sheet-reviews"],
    queryFn: () => fetchReviews(),
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const reviews = data?.reviews ?? [];
  const hasReviews = reviews.length > 0;
  const avg = hasReviews
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <PageShell>
      <PageHero
        eyebrow="Customer Reviews"
        title="Trusted by thousands,"
        titleAccent="rated by real people."
        lede={
          hasReviews
            ? `Average rating ${avg} / 5 across verified purchases. Here's what customers say about ordering premium digital products with us.`
            : `Here's what customers say about ordering premium digital products with us.`
        }
      />

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-20 lg:py-28">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {reviews.length} reviews
              </div>
              {hasReviews ? (
                <div className="mt-3 flex items-center gap-4">
                  <div className="font-display text-5xl leading-none text-headline">{avg}</div>
                  <div>
                    <Stars n={5} />
                    <div className="mt-1 text-xs text-muted-foreground">out of 5</div>
                  </div>
                </div>
              ) : null}
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfQQ8ECl5BwzqyRdBZisxJ9nBsZVjrBipSdWMwxGny8DCns5Q/viewform?usp=header"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-card"
            >
              Leave a review →
            </a>
          </div>

          {hasReviews ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <article
                  key={r.id}
                  className="flex flex-col rounded-2xl border border-border bg-card/40 p-6 transition hover:border-amber/40 hover:bg-card/60"
                >
                  <Stars n={r.rating} />
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">&ldquo;{r.body}&rdquo;</p>
                  <div className="mt-6 border-t border-border pt-4">
                    <div className="text-sm font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[r.location, r.date].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {r.tenure ? (
                        <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber">
                          {r.tenure} customer
                        </span>
                      ) : null}
                      {r.product ? (
                        <span className="text-xs uppercase tracking-[0.14em] text-amber/80">{r.product}</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
              <div className="text-sm text-muted-foreground">
                No reviews yet. Be the first to share your experience on WhatsApp.
              </div>
            </div>
          )}
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
