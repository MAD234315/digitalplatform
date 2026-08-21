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
          className={`h-3.5 w-3.5 ${i < n ? "fill-amber text-amber" : "text-muted-foreground/30"}`}
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


function formatTenure(tenure: string): string {
  if (!tenure) return "";
  const t = tenure.trim().toLowerCase();
  const num = t.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)?/i);
  if (num) {
    const years = parseFloat(num[1]);
    if (years >= 5) return "5+ years customer";
    const suffix = years === 1 ? "year" : "years";
    return `${years} ${suffix} customer`;
  }
  if (/5\+/.test(t) || /five\+?/.test(t)) return "5+ years customer";
  return `${tenure} customer`;
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
      // Return keyboard focus to the trigger button that opened the dialog.
      // Radix normally handles this, but we run it on the next frame as a
      // guarantee — especially after an iframe form submission that may
      // have stolen focus.
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };


  return (
    <>
      <button
        ref={triggerRef}
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
        <DialogContent
          className="w-[100vw] sm:w-[95vw] max-w-none sm:max-w-5xl p-0 gap-0 overflow-hidden flex flex-col rounded-none sm:rounded-lg overscroll-contain"
          style={{
            height: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
            maxHeight: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
          }}
        >
          <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 sm:pb-4 border-b border-border shrink-0 text-left">
            <DialogTitle className="font-display text-lg sm:text-2xl pr-12">Share your experience</DialogTitle>
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-24 sm:py-32 lg:py-40">
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
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative flex flex-col overflow-hidden border border-border bg-card p-4 sm:p-5 shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border" />
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="h-3.5 w-3.5 rounded bg-muted/50" />
                    ))}
                  </div>
                  <div className="h-2.5 w-20 animate-pulse rounded bg-muted/50" />
                </div>

                <div className="mb-4 flex-1 space-y-2.5">
                  <div className="h-4 sm:h-[18px] w-full animate-pulse rounded bg-muted/50" />
                  <div className="h-4 sm:h-[18px] w-5/6 animate-pulse rounded bg-muted/50" />
                  <div className="h-4 sm:h-[18px] w-4/6 animate-pulse rounded bg-muted/30" />
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2.5">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted/50" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-muted/30" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted/50" />
                </div>

                <div className="space-y-3 border-t border-border/80 pt-3">
                  <div className="space-y-1.5">
                    <div className="h-2 w-20 animate-pulse rounded bg-muted/50" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 animate-pulse rounded bg-muted/50" />
                    <div className="min-w-0 flex-1 space-y-1.5">
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
  // Seed from the loader result so the first client render matches the
  // server-rendered HTML (no hydration mismatch in Safari/Firefox/Chrome).
  const loaderData = Route.useLoaderData();
  const { data } = useQuery({
    ...reviewsQueryOptions,
    initialData: loaderData,
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
  const listRef = useRef<HTMLUListElement>(null);
  const pendingFocusRef = useRef(false);
  const goTo = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    const changed = next !== currentPage;
    setPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // After the new page renders, move keyboard focus to the top of the
    // reviews list so screen-reader / keyboard users land on the fresh
    // content instead of a pagination button that may have shifted.
    if (changed) pendingFocusRef.current = true;
  };

  useEffect(() => {
    if (!pendingFocusRef.current) return;
    pendingFocusRef.current = false;
    const node = listRef.current;
    if (!node) return;
    // tabindex=-1 lets us programmatically focus a non-interactive element
    // without adding it to the tab order.
    node.setAttribute("tabindex", "-1");
    node.focus({ preventScroll: false });
  }, [currentPage]);



  return (
    <PageShell>
      <PageHero
        eyebrow="CUSTOMER REVIEWS"
        title="Trusted by thousands,"
        titleAccent="rated by real people."
        lede="Here's what customers say about ordering premium digital services with us."
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
              ref={listRef}
              className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 list-none p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-lg"
              aria-label={`Customer reviews, page ${currentPage} of ${totalPages}`}
            >

              {pagedReviews.map((r) => (
                <li key={r.id} className="contents">
                <article
                  aria-label={`Review by ${r.name}${r.location ? `, ${r.location}` : ""}, rated ${r.rating} out of 5${r.product ? `, for ${r.product}` : ""}`}
                  className="group relative flex flex-col overflow-hidden border border-border bg-card p-4 sm:p-5 shadow-[0_14px_36px_rgba(0,0,0,0.45)] transition-all duration-500 hover:border-amber/50 hover:shadow-[0_20px_44px_-10px_color-mix(in_oklab,var(--amber)_25%,rgba(0,0,0,0.55))] focus-within:border-amber/50"
                >
                  <div
                    className="pointer-events-none absolute top-0 right-0 h-12 w-12 bg-gradient-to-bl from-amber/10 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden
                  />

                  <div className="relative flex flex-1 flex-col">
                    {/* Header: Rating + Date */}
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Stars n={r.rating} />
                      {r.formattedDate ? (
                        <span
                          className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber"
                          aria-label={`Reviewed on ${r.formattedDate}`}
                        >
                          {r.formattedDate}
                        </span>
                      ) : null}
                    </div>

                    {/* Main Quote */}
                    <blockquote
                      className="mb-3 flex-1 text-sm leading-relaxed italic text-foreground/90"
                      aria-label="Review quote"
                    >
                      &ldquo;{r.body}&rdquo;
                    </blockquote>

                    {/* Liked Most / Purchased */}
                    {(r.liked || r.product) ? (
                      <dl className="mb-3 space-y-1.5">
                        {r.liked ? (
                          <div>
                            <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber/80">
                              Liked Most
                            </dt>
                            <dd className="mt-0.5 text-xs text-foreground/80">{r.liked}</dd>
                          </div>
                        ) : null}
                        {r.product ? (
                          <div>
                            <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber/80">
                              Purchased
                            </dt>
                            <dd className="mt-0.5 text-xs font-semibold text-foreground transition group-hover:text-amber">
                              {r.product}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}

                    {/* Author Section */}
                    <div className="flex items-center gap-2.5 border-t border-border pt-3">
                      <div
                        className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-amber to-muted p-[1px]"
                        role="img"
                        aria-label={`Avatar for ${r.name}`}
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-card">
                          <span className="text-[10px] font-bold text-amber" aria-hidden>
                            {initials(r.name)}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold tracking-tight text-foreground">
                          <span className="sr-only">Reviewer: </span>
                          {r.name}
                        </h4>
                        {r.location ? (
                          <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-amber">
                            <span className="sr-only">Location: </span>
                            {r.location}
                          </p>
                        ) : null}
                      </div>
                      {r.tenure ? (
                        <span
                          className="shrink-0 border border-amber/40 bg-amber/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber"
                          aria-label={`${formatTenure(r.tenure)}`}
                        >
                          {formatTenure(r.tenure)}
                        </span>
                      ) : null}
                    </div>
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
