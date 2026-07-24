import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { listPublishedProofs, type ProofRecord } from "@/lib/admin.functions";
import { SITE_URL } from "@/lib/site-config";

const proofsQuery = queryOptions({
  queryKey: ["published-proofs"],
  queryFn: () => listPublishedProofs(),
  staleTime: 30_000,
});

export const Route = createFileRoute("/proof-gallery")({
  loader: ({ context }) => context.queryClient.ensureQueryData(proofsQuery),
  head: () => ({
    meta: [
      { title: "Proof Gallery — Digital Platform" },
      {
        name: "description",
        content: "Real proofs of delivery and customer trust from Digital Platform.",
      },
      { property: "og:title", content: "Proof Gallery — Digital Platform" },
      {
        property: "og:description",
        content: "Real proofs of delivery and customer trust from Digital Platform.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/proof-gallery` }],
  }),
  component: ProofGalleryPage,
});

function ProofGalleryPage() {
  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="Trust & transparency"
        title="Proof Gallery"
        lede="Verified screenshots of orders delivered, customer chats and delivery confirmations."
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pb-12 sm:pb-16 proof-protect">
        <Suspense fallback={<GallerySkeleton />}>
          <Gallery />
        </Suspense>
      </section>
      <ProtectStyles />
    </PageShell>
  );
}

/** Global overrides for the gallery: disable selection, drag & context. */
function ProtectStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .proof-protect, .proof-protect * {
          -webkit-user-select: none; user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        .proof-protect img { -webkit-user-drag: none; user-drag: none; pointer-events: auto; }
        .proof-blur img, .proof-blur .proof-lightbox-img { filter: blur(18px) brightness(0.4); transition: filter .2s ease; }
        .proof-wm::after {
          content: attr(data-wm);
          position: absolute; inset: 0; display: grid; place-items: center;
          font-size: 14px; letter-spacing: .35em; text-transform: uppercase;
          color: rgba(255,255,255,.18); pointer-events: none; transform: rotate(-24deg);
          text-shadow: 0 1px 2px rgba(0,0,0,.4);
        }
        @keyframes lb-in { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        .lb-anim { animation: lb-in .22s ease-out; }
        `,
      }}
    />
  );
}

function GallerySkeleton() {
  return (
    <div className="grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-border bg-card/40" />
      ))}
    </div>
  );
}

function Gallery() {
  const { data } = useSuspenseQuery(proofsQuery);
  const proofs: ProofRecord[] = data ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [blur, setBlur] = useState(false);

  // Flatten every image across every proof — swipe steps through them all.
  const slides = useMemo(
    () =>
      proofs.flatMap((p) =>
        (p.images.length ? p.images : [{ path: "", url: "" }]).map((img, i) => ({
          proof: p,
          image: img,
          proofImageIndex: i,
          proofImageCount: p.images.length,
        })),
      ),
    [proofs],
  );

  // Blur on tab hidden / window blur to discourage casual screenshotting.
  useEffect(() => {
    const onVis = () => setBlur(document.visibilityState === "hidden");
    const onBlur = () => setBlur(true);
    const onFocus = () => setBlur(false);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const stopContext = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  if (proofs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No proofs published yet. Check back soon.
      </div>
    );
  }

  return (
    <>
      <div
        onContextMenu={stopContext}
        className={`grid gap-3 grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 ${
          blur ? "proof-blur" : ""
        }`}
      >
        {proofs.map((p) => {
          const flatIdx = slides.findIndex((s) => s.proof.id === p.id);
          return (
            <ProofCard
              key={p.id}
              proof={p}
              onOpen={() => setOpenIdx(flatIdx >= 0 ? flatIdx : 0)}
            />
          );
        })}
      </div>
      {openIdx !== null && (
        <Lightbox
          slides={slides}
          index={openIdx}
          blurred={blur}
          onIndex={setOpenIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}

function ProofCard({ proof, onOpen }: { proof: ProofRecord; onOpen: () => void }) {
  const cover = proof.images[0];
  const d = new Date(proof.createdAt);
  const [loaded, setLoaded] = useState(false);
  return (
    <article className="group overflow-hidden rounded-2xl border border-amber/20 bg-card/70 shadow-sm transition-colors hover:border-amber/60 hover:shadow-gold">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-muted proof-wm"
        data-wm="Digital Platform"
        aria-label={`Open ${proof.title}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
        {cover ? (
          <img
            src={cover.url}
            alt={proof.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">No image</div>
        )}
        {proof.images.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur">
            +{proof.images.length - 1}
          </span>
        )}
      </button>
      <div className="p-3 sm:p-4">
        <h2 className="line-clamp-1 font-display text-sm sm:text-base">{proof.title}</h2>
        {proof.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{proof.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{d.toLocaleDateString()}</span>
          <span>{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </article>
  );
}

type Slide = {
  proof: ProofRecord;
  image: { path: string; url: string };
  proofImageIndex: number;
  proofImageCount: number;
};

function Lightbox({
  slides,
  index,
  blurred,
  onIndex,
  onClose,
}: {
  slides: Slide[];
  index: number;
  blurred: boolean;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const next = useCallback(() => onIndex((index + 1) % slides.length), [index, slides.length, onIndex]);
  const prev = useCallback(
    () => onIndex((index - 1 + slides.length) % slides.length),
    [index, slides.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [next, prev, onClose]);

  // Swipe support
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  const s = slides[index];
  if (!s) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] grid place-items-center bg-black/95 p-4 proof-protect ${
        blurred ? "proof-blur" : ""
      }`}
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10"
      >
        <X className="h-5 w-5" />
      </button>
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
            className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10 sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
            className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 text-white hover:bg-white/10 sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div
        key={index}
        className="lb-anim flex max-h-[92vh] w-full max-w-5xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative proof-wm" data-wm="Digital Platform">
          <img
            src={s.image.url}
            alt={s.proof.title}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="proof-lightbox-img max-h-[72vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
        <div className="max-w-2xl text-center text-white">
          <h3 className="font-display text-lg sm:text-xl">{s.proof.title}</h3>
          {s.proof.description && (
            <p className="mt-1 text-sm text-white/70">{s.proof.description}</p>
          )}
          <p className="mt-2 text-[11px] uppercase tracking-wider text-white/50">
            {new Date(s.proof.createdAt).toLocaleString()} · {index + 1} / {slides.length}
            {s.proofImageCount > 1 && (
              <> · image {s.proofImageIndex + 1}/{s.proofImageCount}</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
