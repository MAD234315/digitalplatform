import { CtaRouterLink, LiveBadge } from "@/components/ui-primitives";
import { CountUp } from "@/components/count-up";
import { STATS } from "./data";

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
      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-24 lg:pb-32 text-center">
        <div className="animate-rise">
          <LiveBadge>Trusted digital marketplace · Since 2020</LiveBadge>
        </div>

        <h1
          id="hero-heading"
          className="animate-rise delay-1 mt-8 font-display text-balance text-[44px] leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Premium digital products
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          &amp; AI tools,
          <br />
          <em className="italic text-headline">at prices that make sense.</em>
        </h1>

        <p className="animate-rise delay-2 mx-auto mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Access 200+ premium subscriptions, AI tools, software licenses, gift cards and productivity
          solutions — all in one place. Catalogue refreshed daily, prices kept honest, support that
          actually replies.
        </p>

        <div className="animate-rise delay-3 mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <CtaRouterLink to="/products">Enter the Marketplace</CtaRouterLink>
          <CtaRouterLink to="/contact" variant="outline">Institutional Access</CtaRouterLink>
        </div>

        <div className="animate-rise delay-4">
          <StatsRail />
        </div>

      </div>
    </section>
  );
}

function StatsRail() {
  return (
    <dl className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-sm border border-border bg-border overflow-hidden max-w-4xl mx-auto">
      {STATS.map((s) => (
        <div key={s.label} className="group bg-background/60 p-5 sm:p-6 text-left transition-colors duration-300 hover:bg-background/90">
          <dt className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">{s.label}</dt>
          <dd className="mt-2 font-display text-3xl sm:text-4xl text-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-amber">
            <CountUp value={s.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
