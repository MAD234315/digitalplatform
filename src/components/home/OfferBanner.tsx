import { Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import type { OfferBanner } from "@/lib/admin.functions";

/**
 * Homepage offer banner.
 * Renders an image or video with optional text overlay and CTA.
 * Only rendered when the banner is enabled and media is available.
 */
export function OfferBanner({ banner }: { banner: OfferBanner }) {
  if (!banner.enabled || !banner.mediaUrl) return null;

  const hasOverlay = banner.headline || banner.subline || banner.ctaText;
  const mediaContent =
    banner.mediaType === "video" ? (
      <video
        src={banner.mediaUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        poster={undefined}
      />
    ) : (
      <img
        src={banner.mediaUrl}
        alt={banner.headline ?? "Latest offer"}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );

  const inner = (
    <div className="group relative overflow-hidden rounded-2xl border border-amber/20 bg-card/40 shadow-gold">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        {mediaContent}
        {hasOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber backdrop-blur-sm">
          <Megaphone className="h-3 w-3" />
          Latest Offer
        </span>
        {hasOverlay && (
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="max-w-2xl">
              {banner.headline && (
                <h2 className="font-display text-xl leading-tight text-white sm:text-2xl lg:text-3xl">
                  {banner.headline}
                </h2>
              )}
              {banner.subline && (
                <p className="mt-1.5 text-sm leading-relaxed text-white/80 sm:text-base">
                  {banner.subline}
                </p>
              )}
              {banner.ctaText && banner.ctaLink && (
                <span className="mt-4 inline-flex items-center rounded-full bg-amber px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-foreground shadow-gold transition group-hover:bg-amber/90">
                  {banner.ctaText} →
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (banner.ctaLink) {
    const isExternal = /^https?:\/\//i.test(banner.ctaLink);
    if (isExternal) {
      return (
        <a
          href={banner.ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={banner.headline ?? "Open latest offer"}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link to={banner.ctaLink} aria-label={banner.headline ?? "Open latest offer"}>
        {inner}
      </Link>
    );
  }

  return inner;
}
