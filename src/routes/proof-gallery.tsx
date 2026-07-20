import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listPublicProofs } from "@/lib/proof-gallery.functions";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { SITE_URL } from "@/lib/site-config";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Proof = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  image_url: string;
};

export const Route = createFileRoute("/proof-gallery")({
  head: () => ({
    meta: [
      { title: "Proof Gallery — Digital Platform" },
      { name: "description", content: "Real screenshots of customer deliveries. Genuine sources. Reliable service." },
      { property: "og:title", content: "Proof Gallery — Digital Platform" },
      { property: "og:description", content: "Real screenshots of customer deliveries and orders." },
      { property: "og:url", content: `${SITE_URL}/proof-gallery` },
    ],
  }),
  component: ProofGalleryPage,
});

const proofsQuery = (fn: () => Promise<Proof[]>) =>
  queryOptions({
    queryKey: ["public", "proofs"],
    queryFn: fn,
    staleTime: 30_000,
  });

function ProofGalleryPage() {
  const fn = useServerFn(listPublicProofs) as unknown as () => Promise<Proof[]>;
  const { data, isLoading, error } = useQuery(proofsQuery(fn));
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", stop);
    document.addEventListener("dragstart", stop);
    // Discourage screenshots: blur proof images briefly when the tab/window
    // loses focus. Cannot fully prevent screenshots, but reduces value.
    const root = document.documentElement;
    const onHide = () => root.classList.add("proofs-blur");
    const onShow = () => root.classList.remove("proofs-blur");
    const onVis = () => (document.hidden ? onHide() : onShow());
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("contextmenu", stop);
      document.removeEventListener("dragstart", stop);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("focus", onShow);
      document.removeEventListener("visibilitychange", onVis);
      root.classList.remove("proofs-blur");
    };
  }, []);

  // Grid arrow-key navigation between cards.
  function onGridKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (!data) return;
    const target = document.activeElement as HTMLElement | null;
    if (!target) return;
    const currentIndex = cardRefs.current.findIndex((r) => r === target);
    if (currentIndex < 0) return;

    // Compute columns from first two cards' offsetTop.
    const cols = (() => {
      const first = cardRefs.current[0];
      const refs = cardRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (!first) return 1;
      let n = 0;
      for (const r of refs) {
        if (r.offsetTop === first.offsetTop) n++;
        else break;
      }
      return Math.max(1, n);
    })();

    let next = currentIndex;
    switch (e.key) {
      case "ArrowRight": next = Math.min(data.length - 1, currentIndex + 1); break;
      case "ArrowLeft":  next = Math.max(0, currentIndex - 1); break;
      case "ArrowDown":  next = Math.min(data.length - 1, currentIndex + cols); break;
      case "ArrowUp":    next = Math.max(0, currentIndex - cols); break;
      case "Home":       next = 0; break;
      case "End":        next = data.length - 1; break;
      default: return;
    }
    e.preventDefault();
    cardRefs.current[next]?.focus();
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Proof Gallery"
        title="Genuine deliveries, receipts and setup screenshots"
        lede="Real proofs from real orders. Reliable service, verifiable."
      />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20 select-none">
        {isLoading && <ProofSkeletonGrid />}
        {error && (
          <div role="alert" className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Couldn&apos;t load the gallery right now. Please try again.
          </div>
        )}
        {data && data.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            Proofs are being uploaded — check back shortly.
          </div>
        )}
        {data && data.length > 0 && (
          <ul
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            onKeyDown={onGridKeyDown}
            aria-label="Proof gallery. Use arrow keys to navigate, Enter to open."
          >
            {data.map((p, i) => (
              <li key={p.id} style={{ animation: `fade-in 0.4s ease-out both`, animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                <ProofCard
                  ref={(el) => { cardRefs.current[i] = el; }}
                  proof={p}
                  onOpen={() => setLightboxIdx(i)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {lightboxIdx !== null && data && (
        <Lightbox
          items={data}
          index={lightboxIdx}
          onClose={() => {
            const idx = lightboxIdx;
            setLightboxIdx(null);
            // Restore focus back to the originating card.
            requestAnimationFrame(() => cardRefs.current[idx]?.focus());
          }}
          onIndex={setLightboxIdx}
        />
      )}
    </PageShell>
  );
}

type CardProps = {
  proof: Proof;
  onOpen: () => void;
};

const ProofCard = forwardRef<HTMLButtonElement, CardProps>(function ProofCard(
  { proof, onOpen },
  ref
) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      ref={ref}
      onClick={onOpen}
      aria-label={`Open ${proof.title}`}
      className="group block w-full text-left rounded-lg overflow-hidden border border-border bg-card transition-all duration-300 hover:border-amber/50 hover:shadow-[0_8px_28px_-12px_rgba(255,183,77,0.35)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-background">
        {!loaded && !failed && (
          <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-card animate-pulse" aria-hidden />
        )}
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Image unavailable
          </div>
        ) : (
          <img
            src={proof.image_url}
            alt={proof.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover pointer-events-none transition-all duration-500 ease-out ${
              loaded ? "opacity-100 scale-100 group-hover:scale-[1.04]" : "opacity-0 scale-105"
            }`}
            style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as any}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{proof.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{proof.description}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {formatDate(proof.created_at)}
        </p>
      </div>
    </button>
  );
});


function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: Proof[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const p = items[index];
  const titleId = useId();
  const descId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const goNext = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex]);
  const goPrev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex]);

  // Mount transition.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Reset loading state on image change.
  useEffect(() => { setImgLoaded(false); }, [index]);

  // Preload adjacent images for snappy navigation.
  useEffect(() => {
    const next = items[(index + 1) % items.length];
    const prev = items[(index - 1 + items.length) % items.length];
    [next, prev].forEach((it) => {
      if (!it) return;
      const img = new Image();
      img.src = it.image_url;
    });
  }, [index, items]);

  // Keyboard: Esc, arrows, Home/End + focus trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); return; }
      if (e.key === "ArrowLeft")  { e.preventDefault(); goPrev(); return; }
      if (e.key === "Home") { e.preventDefault(); onIndex(0); return; }
      if (e.key === "End")  { e.preventDefault(); onIndex(items.length - 1); return; }
      if (e.key === "Tab") {
        // Simple focus trap across dialog buttons.
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Initial focus.
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [goNext, goPrev, onClose, onIndex, items.length]);

  // Swipe support.
  const [touchX, setTouchX] = useState<number | null>(null);
  function onTouchStart(e: React.TouchEvent) { setTouchX(e.touches[0].clientX); }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { if (dx < 0) goNext(); else goPrev(); }
    setTouchX(null);
  }

  if (!p) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col transition-opacity duration-200 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        ref={closeBtnRef}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-3 right-3 z-10 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber transition"
        aria-label="Close (Esc)"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber transition"
        aria-label="Previous image (Left arrow)"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber transition"
        aria-label="Next image (Right arrow)"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            <Loader2 className="h-8 w-8 text-white/70 animate-spin" />
          </div>
        )}
        <img
          key={p.image_url}
          src={p.image_url}
          alt={p.title}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onLoad={() => setImgLoaded(true)}
          onClick={(e) => e.stopPropagation()}
          className={`max-h-full max-w-full object-contain rounded-md transition-all duration-300 ease-out ${
            imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
          style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as any}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-white/10 text-4xl sm:text-6xl font-display rotate-[-20deg] tracking-widest select-none">
            DIGITAL PLATFORM
          </span>
        </div>
      </div>
      <div
        className="bg-black/60 text-white p-4 sm:p-5 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-lg sm:text-xl">{p.title}</h2>
        <p id={descId} className="mt-1 text-sm text-white/70">{p.description}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/50">
          {formatDateTime(p.created_at)} · {index + 1} / {items.length}
        </p>
        <p className="sr-only">
          Use left and right arrow keys to navigate. Press Escape to close.
        </p>
      </div>
    </div>
  );
}

function ProofSkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading proofs">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="aspect-[4/5] bg-gradient-to-br from-card via-background to-card animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 bg-background animate-pulse rounded" />
            <div className="h-2 w-full bg-background animate-pulse rounded" />
            <div className="h-2 w-1/3 bg-background animate-pulse rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch { return ""; }
}
function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}
