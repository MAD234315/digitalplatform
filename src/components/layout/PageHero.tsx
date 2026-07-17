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
 */
export function PageHero({
  eyebrow,
  title,
  titleAccent,
  lede,
  size = "narrow",
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  titleAccent?: ReactNode;
  lede?: ReactNode;
  size?: "narrow" | "wide";
  aside?: ReactNode;
}) {
  const wrap =
    size === "wide"
      ? "mx-auto max-w-7xl px-6 lg:px-10 pt-32 sm:pt-36 pb-12 sm:pb-14"
      : "mx-auto max-w-5xl px-6 lg:px-10 pt-32 pb-14 sm:pt-40 sm:pb-16 lg:pt-48 lg:pb-24";

  return (
    <section className="relative bg-hero">
      <div className={wrap}>
        {aside ? (
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <HeroCopy eyebrow={eyebrow} title={title} titleAccent={titleAccent} lede={lede} />
            </div>
            <div className="lg:col-span-4">{aside}</div>
          </div>
        ) : (
          <HeroCopy eyebrow={eyebrow} title={title} titleAccent={titleAccent} lede={lede} />
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
}: {
  eyebrow: string;
  title: ReactNode;
  titleAccent?: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <>
      <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</div>
      <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98]">
        {title}
        {titleAccent && (
          <>
            <br />
            <em className="text-headline">{titleAccent}</em>
          </>
        )}
      </h1>
      {lede && (
        <p className="mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">{lede}</p>
      )}
    </>
  );
}
