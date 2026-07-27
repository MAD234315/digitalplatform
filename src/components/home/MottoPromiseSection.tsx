import { AccentTile, Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";
import { PROMISES } from "./data";

export function MottoPromiseSection() {
  return (
    <section aria-labelledby="promise-heading" className="cv-auto border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 lg:py-14 grid lg:grid-cols-12 gap-8 lg:gap-10">
        <Reveal className="lg:col-span-7">
          <Eyebrow>Our motto</Eyebrow>
          <h2 id="promise-heading" className="mt-4 font-display text-3xl sm:text-4xl leading-tight">
            Genuine sources.
            <br />
            Reliable service.
          </h2>
          <p className="mt-6 text-muted-foreground max-w-md">
            Making premium digital tools affordable for everyone — one honest transaction at a time.
          </p>
        </Reveal>
        <Reveal className="lg:col-span-5" delay={140}>
          <div className="rounded-sm border border-border bg-card p-6 sm:p-8 transition-all duration-300 hover:border-amber/40 hover:shadow-gold">
            <Eyebrow>Customer promise</Eyebrow>
            <h3 className="mt-3 font-display text-2xl">We are committed to:</h3>
            <ul className="mt-6 space-y-3 text-sm">
              {PROMISES.map((p, i) => (
                <Reveal as="li" key={p} delay={200 + i * 60} y={6} className="flex items-start gap-3">
                  <AccentTile size="sm">✓</AccentTile>
                  <span>{p}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

