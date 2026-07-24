import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { CONTACT } from "@/components/site-chrome";
import { ORG_ID, SITE_URL } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { buildRouteHead } from "@/lib/seo";
import { Star, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
  pendingComponent: ReviewsSkeleton,
  pendingMs: 0,
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

function buildPageList(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfQQ8ECl5BwzqyRdBZisxJ9nBsZVjrBipSdWMwxGny8DCns5Q/viewform";
const FORM_EMBED_URL = `${FORM_URL}?embedded=true`;

function LeaveReviewButton() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const qc = useQueryClient();

  const refreshReviews = async () => {
    // Bypass server 60s cache + refetch client query
    await qc.fetchQuery({
      queryKey: ["sheet-reviews"],
      queryFn: () => getSheetReviews({ data: { force: true } }),
    });
  };

  // Lock background scroll while the review modal is open so the page
  // behind stays fixed in place (no jump on mobile, no shift on desktop).
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // On close, refresh so a just-submitted review can appear
      void refreshReviews();
    }
  };


  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(false);
          setLoadCount(0);
          setOpen(true);
          // Force a fresh, cache-busted fetch so the newly submitted review
          // appears at the top the moment the modal closes.
          void refreshReviews();
        }}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/40 transition hover:brightness-110 hover:shadow-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        ★ Leave a review
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[98vw] sm:w-[95vw] max-w-none sm:max-w-5xl h-[95dvh] sm:h-[92dvh] max-h-[95dvh] p-0 gap-0 overflow-hidden flex flex-col rounded-lg overscroll-contain">
          <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 sm:pb-4 border-b border-border shrink-0 text-left">
            <DialogTitle className="font-display text-lg sm:text-2xl pr-8">Share your experience</DialogTitle>
            <DialogDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
              <span>Takes under a minute. Your feedback helps other customers.</span>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary hover:underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </DialogDescription>
          </DialogHeader>
          {/*
            Single source of scroll: the iframe itself renders the Google Form
            and handles its own scrolling. The wrapper is overflow-hidden and
            uses overscroll-contain so scroll gestures never bubble to the
            background page.
          */}
          <div className="relative flex-1 min-h-0 bg-background overflow-hidden overscroll-contain touch-pan-y">
            {!loaded ? (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : null}
            <iframe
              src={FORM_EMBED_URL}
              title="Leave a review"
              loading="lazy"
              scrolling="auto"
              className="block h-full w-full border-0"
              style={{ display: "block", width: "100%", height: "100%" }}
              onLoad={() => {
                setLoaded(true);
                setLoadCount((c) => {
                  const next = c + 1;
                  if (next >= 2) void refreshReviews();
                  return next;
                });
              }}
            />
          </div>


        </DialogContent>
      </Dialog>
    </>
  );
}

function ReviewsSkeleton() {
  return (
    <PageShell>
      {/* Hero skeleton */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="mb-5 h-4 w-32 animate-pulse rounded-full bg-muted/50" />
            <div className="mb-4 h-10 sm:h-12 w-3/4 animate-pulse rounded-lg bg-muted/50" />
            <div className="mb-3 h-4 w-full animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted/30" />
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-12 sm:py-20 lg:py-28">
          {/* Header skeleton */}
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
              <div className="flex items-center gap-4">
                <div className="h-14 w-20 animate-pulse rounded-lg bg-muted/50" />
                <div className="space-y-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 w-4 rounded bg-muted/50" />
                    ))}
                  </div>
                  <div className="h-2.5 w-16 animate-pulse rounded bg-muted/30" />
                </div>
              </div>
            </div>
            <div className="h-11 w-40 animate-pulse rounded-full bg-muted/50" />
          </div>

          {/* "Latest reviews" badge skeleton */}
          <div className="mb-6 h-7 w-56 animate-pulse rounded-full bg-muted/50" />

          {/* Skeleton card grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 sm:gap-y-10 lg:gap-x-10 lg:gap-y-14">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card/40 p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border" />
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="h-4 w-4 rounded bg-muted/50" />
                    ))}
                  </div>
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted/50" />
                </div>

                <div className="mb-6 flex-1 space-y-3">
                  <div className="h-5 sm:h-6 w-full animate-pulse rounded bg-muted/50" />
                  <div className="h-5 sm:h-6 w-5/6 animate-pulse rounded bg-muted/50" />
                  <div className="h-5 sm:h-6 w-4/6 animate-pulse rounded bg-muted/30" />
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted/50" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted/50" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-muted/30" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted/50" />
                </div>

                <div className="space-y-4 border-t border-border/80 pt-5">
                  <div className="space-y-2">
                    <div className="h-2 w-20 animate-pulse rounded bg-muted/50" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 animate-pulse rounded bg-muted/50" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-2 w-20 animate-pulse rounded bg-muted/50" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted/30" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="h-3 w-48 animate-pulse rounded bg-muted/50" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 animate-pulse rounded-full bg-muted/50"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA skeleton */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 text-center">
          <div className="mx-auto mb-4 h-3 w-24 animate-pulse rounded bg-muted/50" />
          <div className="mx-auto mb-8 h-10 w-3/4 max-w-xl animate-pulse rounded-lg bg-muted/50" />
          <div className="flex flex-wrap justify-center gap-3">
            <div className="h-11 w-44 animate-pulse rounded-full bg-muted/50" />
            <div className="h-11 w-44 animate-pulse rounded-full bg-muted/50" />
          </div>
        </div>
      </section>
    </PageShell>
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

  const PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(reviews.length / PER_PAGE));
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);
  const currentPage = Math.min(page, totalPages);
  const pagedReviews = useMemo(
    () => reviews.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [reviews, currentPage],
  );
  const goTo = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


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

      <section className="border-t border-border" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="sr-only">Customer reviews</h2>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-12 sm:py-20 lg:py-28">

          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-foreground/70">
                {reviews.length} reviews
              </div>
              {hasReviews ? (
                <div
                  className="mt-3 flex items-center gap-4"
                  role="group"
                  aria-label={`Average rating ${avg} out of 5`}
                >
                  <div className="font-display text-5xl leading-none text-headline" aria-hidden>{avg}</div>
                  <div>
                    <Stars n={5} />
                    <div className="mt-1 text-xs font-medium text-foreground/70">out of 5</div>
                  </div>
                </div>
              ) : null}
            </div>
            <LeaveReviewButton />
          </div>

          {hasReviews ? (
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber/50 bg-gradient-to-r from-amber/15 via-amber/10 to-transparent px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber shadow-[0_0_20px_-4px_color-mix(in_oklab,var(--amber)_60%,transparent)]"
              role="note"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
              </span>
              Latest reviews shown first
            </div>


          ) : null}

          {hasReviews ? (
            <ul
              className="grid gap-6 sm:gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14 list-none p-0"
              aria-label={`Customer reviews, page ${currentPage} of ${totalPages}`}
            >

              {pagedReviews.map((r) => (
                <li key={r.id} className="contents">
                <article
                  aria-label={`Review by ${r.name}${r.location ? `, ${r.location}` : ""}, rated ${r.rating} out of 5${r.product ? `, for ${r.product}` : ""}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-gradient-to-br from-card/95 via-card/80 to-card/60 p-6 shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--background)_85%,transparent)] ring-1 ring-border/80 backdrop-blur-xl transition hover:border-amber/50 hover:ring-amber/40 hover:shadow-[0_25px_60px_-15px_color-mix(in_oklab,var(--amber)_35%,transparent)] focus-within:border-amber/50 focus-within:ring-amber/40 focus-within:shadow-[0_25px_60px_-15px_color-mix(in_oklab,var(--amber)_35%,transparent)]"
                >
                  {/* Top accent line */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent" aria-hidden />
                  {/* Decorative amber glow */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber/10 blur-3xl transition-all duration-700 group-hover:bg-amber/25" aria-hidden />

                  <div className="relative flex flex-1 flex-col">
                    {/* Header: Rating + Date */}
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <Stars n={r.rating} />
                      {r.formattedDate ? (
                        <span
                          className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-foreground/70"
                          aria-label={`Reviewed on ${r.formattedDate}`}
                        >
                          {r.formattedDate}
                        </span>
                      ) : null}
                    </div>

                    {/* Main Quote */}
                    <blockquote
                      className="font-quote mb-6 flex-1 text-xl sm:text-2xl leading-snug sm:leading-tight italic text-foreground"
                      aria-label="Review quote"
                    >
                      &ldquo;{r.body}&rdquo;
                    </blockquote>

                    {/* Reviewer Identity */}
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber/30 bg-gradient-to-br from-muted via-card/80 to-card text-xs font-semibold text-foreground shadow-sm shadow-amber/10"
                        role="img"
                        aria-label={`Avatar for ${r.name}`}
                      >
                        <span aria-hidden>{initials(r.name)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          <span className="sr-only">Reviewer: </span>
                          {r.name}
                        </p>
                        {r.location ? (
                          <p className="truncate text-xs font-medium text-foreground/70">
                            <span className="sr-only">Location: </span>
                            {r.location}
                          </p>
                        ) : null}
                      </div>
                      {r.tenure ? (
                        <span
                          className="shrink-0 rounded-full border border-amber/30 bg-amber/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-tighter text-amber shadow-[0_0_12px_-4px_color-mix(in_oklab,var(--amber)_60%,transparent)]"
                          aria-label={`Customer for ${r.tenure}`}
                        >
                          {r.tenure} customer
                        </span>
                      ) : null}
                    </div>

                    {/* Footer Details: Liked Most / Purchased */}
                    <dl className="space-y-4 border-t border-border/80 pt-5">
                      {r.liked ? (
                        <div className="flex flex-col">
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                            Liked Most
                          </dt>
                          <dd className="text-sm font-medium text-foreground">{r.liked}</dd>
                        </div>
                      ) : null}
                      {r.product ? (
                        <div className="flex items-start gap-2">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted/70 border border-amber/30 shadow-sm shadow-amber/10"
                            aria-hidden
                          >
                            <span className="text-[10px] text-amber">★</span>
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                              Purchased
                            </dt>
                            <dd className="text-sm font-semibold text-foreground transition group-hover:text-amber">
                              {r.product}
                            </dd>
                          </div>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </article>
                </li>
              ))}
            </ul>
          ) : null}


          {hasReviews && totalPages > 1 ? (
            <nav
              aria-label="Reviews pagination"
              className="mt-12 flex flex-col items-center gap-4"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/70">
                Page {currentPage} of {totalPages} · Showing{" "}
                {(currentPage - 1) * PER_PAGE + 1}–
                {Math.min(currentPage * PER_PAGE, reviews.length)} of {reviews.length}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-border bg-card/40 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-amber/50 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card/40"
                  aria-label={`Go to previous page (page ${Math.max(1, currentPage - 1)} of ${totalPages})`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                {buildPageList(currentPage, totalPages).map((item, i) =>
                  item === "…" ? (
                    <span
                      key={`gap-${i}`}
                      className="px-1 text-xs text-muted-foreground select-none"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goTo(item)}
                      aria-current={item === currentPage ? "page" : undefined}
                      aria-label={
                        item === currentPage
                          ? `Current page, page ${item} of ${totalPages}`
                          : `Go to page ${item} of ${totalPages}`
                      }
                      className={
                        item === currentPage
                          ? "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-amber/60 bg-gradient-to-br from-amber/25 to-amber/10 px-3 text-sm font-bold text-amber shadow-[0_0_18px_-6px_color-mix(in_oklab,var(--amber)_70%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-border bg-card/40 px-3 text-sm font-semibold text-foreground/80 transition hover:border-amber/40 hover:bg-card/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      }
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => goTo(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-border bg-card/40 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-amber/50 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card/40"
                  aria-label={`Go to next page (page ${Math.min(totalPages, currentPage + 1)} of ${totalPages})`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>

              </div>
            </nav>
          ) : null}

          {!hasReviews ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
              <div className="text-sm text-muted-foreground">
                No reviews yet. Be the first to share your experience on WhatsApp.
              </div>
            </div>
          ) : null}
        </div>
      </section>


      <section className="border-t border-border bg-card/30" aria-labelledby="reviews-cta-heading">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Your turn</div>
          <h2 id="reviews-cta-heading" className="mt-4 font-display text-3xl sm:text-4xl">
            Ready to order? <em className="text-headline">Ping us on WhatsApp.</em>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3" role="group" aria-label="Next steps">
            <Link
              to="/products"
              aria-label="Browse the product catalogue"
              className="rounded-full bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse catalogue →
            </Link>
            <a
              href={CONTACT.WA_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Contact us on WhatsApp (opens in a new tab)"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground transition hover:border-amber/50 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Contact us →
            </a>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
