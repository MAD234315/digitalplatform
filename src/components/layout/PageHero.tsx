import type { ReactNode } from "react";

/**
 * Editorial hero used at the top of content pages (About, Contact, FAQ, …).
 *
 * Renders a consistent eyebrow / display headline / lede stack on the
 * `bg-hero` surface. Pass the emphasized fragment of the headline via
 * `titleAccent` — it's rendered inside <em class="text-headline"> so the
 * accent colour and italic treatment stay uniform across pages.
 *
 * `size="wide"` widens the container to `max-w-7xl` for the products page;
 * default `narrow` matches the max-w-5xl editorial pages.
 * `compact` reduces padding and type sizes for denser pages.
 */
export function PageHero({
  eyebrow,
  title,
  titleAccent,
  lede,
  size = "narrow",
  aside,
  compact,
}: {
  eyebrow: string;
  title: ReactNode;
  titleAccent?: ReactNode;
  lede?: ReactNode;
  size?: "narrow" | "wide";
  aside?: ReactNode;
  compact?: boolean;
}) {
  const wrap = compact
    ? size === "wide"
      ? "mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-6 sm:pb-8"
      : "mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 pt-24 pb-6 sm:pt-28 sm:pb-8 lg:pt-32 lg:pb-10"
    : size === "wide"
      ? "mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 pt-36 sm:pt-40 pb-10 sm:pb-12"
      : "mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 pt-36 pb-12 sm:pt-44 sm:pb-14 lg:pt-52 lg:pb-20";

  return (
    <section className="relative bg-hero">
      <div className={wrap}>
        {aside ? (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <HeroCopy eyebrow={eyebrow} title={title} titleAccent={titleAccent} lede={lede} compact={compact} />
            </div>
            <div className="lg:col-span-4">{aside}</div>
          </div>
        ) : (
          <HeroCopy eyebrow={eyebrow} title={title} titleAccent={titleAccent} lede={lede} compact={compact} />
        )}
      </div>
    </section>
  );
}

function HeroCopy({
  eyebrow,
  title,
  titleAccent,
  lede,
  compact,
}: {
  eyebrow: string;
  title: ReactNode;
  titleAccent?: ReactNode;
  lede?: ReactNode;
  compact?: boolean;
}) {
  return (
    <>
      <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground whitespace-pre-wrap">{eyebrow}</div>
      <h1 className={`mt-4 font-display text-balance leading-[1.02] sm:leading-[0.98] ${compact ? "text-3xl sm:text-4xl lg:text-5xl" : "text-4xl sm:text-6xl lg:text-7xl"}`}>
        {title}
        {titleAccent && (
          <>
            <br />
            <em className="text-headline">{titleAccent}</em>
          </>
        )}
      </h1>
      {lede && (
        <p className={`max-w-2xl text-pretty text-muted-foreground leading-relaxed ${compact ? "mt-4 text-sm sm:text-base" : "mt-6 sm:mt-8 text-base sm:text-lg"}`}>{lede}</p>
      )}
    </>
  );
}
