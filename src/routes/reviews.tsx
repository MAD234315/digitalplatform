import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID, SITE_URL } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { Star, Quote, Heart, ShoppingBag, MapPin, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { getSheetReviews } from "@/lib/sheet-reviews.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const TITLE = "Customer Reviews — Digital Platform";
const DESC =
  "Real feedback from customers using Digital Platform for premium digital subscriptions, AI tools and software licenses.";

const reviewsQueryOptions = queryOptions({
  queryKey: ["sheet-reviews"],
  queryFn: () => getSheetReviews(),
  staleTime: 60_000,
});


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
  loader: ({ context }) => context.queryClient.ensureQueryData(reviewsQueryOptions),
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

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfQQ8ECl5BwzqyRdBZisxJ9nBsZVjrBipSdWMwxGny8DCns5Q/viewform";
const FORM_EMBED_URL = `${FORM_URL}?embedded=true`;

function LeaveReviewButton() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(false);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/40 transition hover:brightness-110 hover:shadow-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        ★ Leave a review
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="font-display text-2xl">Share your experience</DialogTitle>
            <DialogDescription className="flex items-center justify-between gap-3">
              <span>Takes under a minute. Your feedback helps other customers.</span>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[70vh] bg-background">
            {!loaded ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : null}
            <iframe
              src={FORM_EMBED_URL}
              title="Leave a review"
              className="h-full w-full"
              onLoad={() => setLoaded(true)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Reviews() {
  const { data } = useQuery({
    ...reviewsQueryOptions,
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
            ? `Average rating ${avg} / 5 across verified purchases. Here's what customers say about ordering premium digital services with us.`
            : `Here's what customers say about ordering premium digital services with us.`
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
            <LeaveReviewButton />
          </div>

          {hasReviews ? (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]" />
              Latest reviews shown first
            </div>
          ) : null}

          {hasReviews ? (
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-12">
              {reviews.map((r) => {
                const initials = r.name
                  ?.split(" ")
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "?";
                return (
                  <article
                    key={r.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-amber/40 hover:bg-card/60 hover:shadow-[0_8px_30px_-12px_rgba(212,175,55,0.25)]"
                  >
                    {/* Header: identity + rating */}
                    <header className="flex items-start justify-between gap-3 border-b border-border/60 bg-card/40 px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber/30 bg-amber/10 text-xs font-semibold uppercase tracking-wider text-amber">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{r.name}</div>
                          {r.tenure ? (
                            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-amber/90">
                              {r.tenure} customer
                            </div>
                          ) : (
                            <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              Verified buyer
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Stars n={r.rating} />
                        <span className="text-[10px] tabular-nums text-muted-foreground">{r.rating}.0 / 5</span>
                      </div>
                    </header>

                    {/* Meta: location + date between header and review */}
                    {(r.location || r.date) ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
                        {r.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-amber/70" strokeWidth={2} />
                            {r.location}
                          </span>
                        ) : null}
                        {r.location && r.date ? (
                          <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
                        ) : null}
                        {r.date ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-amber/70" strokeWidth={2} />
                            {r.date}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Body: quote */}
                    <div className="relative flex-1 px-5 py-5">
                      <Quote
                        className="absolute left-4 top-4 h-5 w-5 text-amber/20"
                        aria-hidden
                        strokeWidth={2}
                      />
                      <p className="relative pl-6 text-sm leading-relaxed text-foreground/90">
                        {r.body}
                      </p>
                    </div>

                    {/* Highlights: liked + purchased */}
                    {(r.liked || r.product) ? (
                      <div className="space-y-2 border-t border-border/60 bg-card/30 px-5 py-4">
                        {r.liked ? (
                          <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                            <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" strokeWidth={2} />
                            <div className="min-w-0">
                              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                Liked most
                              </div>
                              <div className="mt-0.5 text-foreground/90">{r.liked}</div>
                            </div>
                          </div>
                        ) : null}
                        {r.product ? (
                          <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                            <ShoppingBag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" strokeWidth={2} />
                            <div className="min-w-0">
                              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                Purchased
                              </div>
                              <div className="mt-0.5 text-foreground/90">{r.product}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
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
