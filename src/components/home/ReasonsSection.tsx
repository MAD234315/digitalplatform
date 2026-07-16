import { AccentTile, Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { REASONS, type Reason } from "./data";

export function ReasonsSection() {
  return (
    <section aria-labelledby="why-heading" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <Reveal className="max-w-3xl">
          <Eyebrow>Why choose us</Eyebrow>
          <h2 id="why-heading" className="mt-4 font-display text-4xl sm:text-5xl">
            Six reasons the return <em className="italic text-headline">customers come back.</em>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r, i) => (
            <Reveal key={r.n} delay={Math.min(i * 70, 350)}>
              <TiltCard className="h-full">
                <ReasonCard reason={r} />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReasonCard({ reason }: { reason: Reason }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-sm border border-border bg-card/40 p-6 hover-glow hover:border-amber/40 hover:bg-card/70">
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--mx,50%) var(--my,0%), color-mix(in oklab, var(--amber) 18%, transparent), transparent 55%)",
        }}
      />
      <AccentTile className="relative transition-transform duration-300 group-hover:scale-110">{reason.n}</AccentTile>
      <h3 className="relative mt-5 font-display text-2xl">{reason.title}</h3>
      <p className="relative mt-3 text-sm text-muted-foreground leading-relaxed">{reason.body}</p>
    </article>
  );
}
