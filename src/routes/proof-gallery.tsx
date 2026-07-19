import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listPublicProofs } from "@/lib/proof-gallery.functions";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { SITE_URL } from "@/lib/site-config";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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

  useEffect(() => {
    // Discourage right-click / drag on this page only.
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", stop);
    document.addEventListener("dragstart", stop);
    return () => {
      document.removeEventListener("contextmenu", stop);
      document.removeEventListener("dragstart", stop);
    };
  }, []);

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
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Couldn&apos;t load the gallery right now. Please try again.
          </div>
        )}
        {data && data.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            Proofs are being uploaded — check back shortly.
          </div>
        )}
        {data && data.length > 0 && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {data.map((p, i) => (
              <li key={p.id}>
                <button
                  onClick={() => setLightboxIdx(i)}
                  className="group block w-full text-left rounded-lg overflow-hidden border border-border bg-card hover:border-amber/40 transition"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-background">
                    <img
                      src={p.image_url}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none"
                      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as any}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDate(p.created_at)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {lightboxIdx !== null && data && (
        <Lightbox
          items={data}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onIndex={setLightboxIdx}
        />
      )}
    </PageShell>
  );
}

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, items.length, onClose, onIndex]);

  // Swipe support
  const [touchX, setTouchX] = useState<number | null>(null);
  function onTouchStart(e: React.TouchEvent) { setTouchX(e.touches[0].clientX); }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) onIndex((index + 1) % items.length);
      else onIndex((index - 1 + items.length) % items.length);
    }
    setTouchX(null);
  }

  if (!p) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        aria-label="Previous"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
        aria-label="Next"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <img
          src={p.image_url}
          alt={p.title}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain rounded-md"
          style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as any}
        />
        {/* Watermark */}
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
        <h2 className="font-display text-lg sm:text-xl">{p.title}</h2>
        <p className="mt-1 text-sm text-white/70">{p.description}</p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/50">
          {formatDateTime(p.created_at)} · {index + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}

function ProofSkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="aspect-[4/5] bg-background animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 bg-background animate-pulse rounded" />
            <div className="h-2 w-full bg-background animate-pulse rounded" />
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
