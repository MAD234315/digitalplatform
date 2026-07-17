import { CtaRouterLink, LiveBadge } from "@/components/ui-primitives";
import { CountUp } from "@/components/count-up";
import { ErrorBoundary } from "@/components/error-boundary";
import { STATS } from "./data";

/**
 * Home page hero: kicker badge, headline, subhead, CTA pair, and the stats
 * rail at the bottom. Entry animations use `animate-rise` + staggered
 * `delay-N` utilities defined in `styles.css`.
 *
 * The animated inner tree is wrapped in an ErrorBoundary with a static,
 * motion-free fallback. If a tilt/motion/count-up effect throws (e.g. a
 * DOM API missing on an older browser, a bad ref, a bad stats value), the
 * fallback keeps the hero copy and CTAs on screen instead of blanking the
 * homepage. The route-level "home:hero" boundary is the outer safety net.
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-hero">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[520px] blur-[120px] opacity-60"
        style={{
          background:
            "radial-gradient(600px 320px at 50% 50%, oklch(0.80 0.14 82 / 0.22), transparent 70%)",
        }}
      />
      <ErrorBoundary boundary="home:hero-animations" fallback={<HeroFallback />}>
        <HeroContent />
      </ErrorBoundary>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-24 lg:pb-32 text-center">
      <div className="animate-rise">
        <LiveBadge>Trusted digital marketplace · Since 2020</LiveBadge>
      </div>

      <h1
        id="hero-heading"
        className="animate-rise delay-1 mt-8 font-display text-balance text-[38px] leading-[0.98] sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Digital products
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        &amp; AI tools,
        <br />
        <em className="italic text-headline">at prices that make sense.</em>
      </h1>

      <p className="animate-rise delay-2 mx-auto mt-6 sm:mt-8 max-w-2xl text-pretty text-base sm:text-lg text-muted-foreground leading-relaxed">
        Explore premium subscriptions, AI tools, software licenses, gift cards and productivity
        solutions — all in one place. Catalogue refreshed daily, prices kept honest, support that
        actually replies.
      </p>

      <div className="animate-rise delay-3 mt-10 flex flex-col sm:flex-row justify-center gap-3">
        <CtaRouterLink to="/products">ENTER CATALOGUE</CtaRouterLink>
        <CtaRouterLink to="/contact" variant="outline">
          CONTACT US
        </CtaRouterLink>
      </div>

      <div className="animate-rise delay-4">
        <ErrorBoundary boundary="home:hero-stats" fallback={<StatsRailStatic />}>
          <StatsRail />
        </ErrorBoundary>
      </div>
    </div>
  );
}

/**
 * Static, animation-free hero fallback. Same layout skeleton and copy as
 * the live hero — no `animate-rise`, no `CountUp`, no tilt — so a broken
 * motion effect degrades to a plain, readable hero.
 */
function HeroFallback() {
  return (
    <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-24 lg:pb-32 text-center">
      <LiveBadge>Trusted digital marketplace · Since 2020</LiveBadge>
      <h1
        id="hero-heading"
        className="mt-8 font-display text-balance text-[38px] leading-[0.98] sm:text-5xl md:text-6xl lg:text-7xl"
      >
        Digital products &amp; AI tools,{" "}
        <em className="italic text-headline">at prices that make sense.</em>
      </h1>
      <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-pretty text-base sm:text-lg text-muted-foreground leading-relaxed">
        Explore premium subscriptions, AI tools, software licenses, gift cards and productivity
        solutions — all in one place.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
        <CtaRouterLink to="/products">ENTER CATALOGUE</CtaRouterLink>
        <CtaRouterLink to="/contact" variant="outline">
          CONTACT US
        </CtaRouterLink>
      </div>
      <StatsRailStatic />
    </div>
  );
}

/**
 * Four-tile stats rail. Each `CountUp` animates from 0 → target when its
 * tile scrolls into view; string-only values ("Daily", "24/7") pass
 * through verbatim.
 */
function StatsRail() {
  return (
    <dl className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-sm border border-border bg-border overflow-hidden max-w-4xl mx-auto">
      {STATS.map((s) => (
        <div
          key={s.label}
          className="group bg-background/60 p-5 sm:p-6 text-left transition-colors duration-300 hover:bg-background/90"
        >
          <dt className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">{s.label}</dt>
          <dd className="mt-2 font-display text-3xl sm:text-4xl text-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-amber">
            <CountUp value={s.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Motion-free stats rail — final numbers only, no CountUp animation. */
function StatsRailStatic() {
  return (
    <dl className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-sm border border-border bg-border overflow-hidden max-w-4xl mx-auto">
      {STATS.map((s) => (
        <div key={s.label} className="bg-background/60 p-5 sm:p-6 text-left">
          <dt className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">{s.label}</dt>
          <dd className="mt-2 font-display text-3xl sm:text-4xl text-foreground">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
