import { AccentTile, Eyebrow } from "@/components/ui-primitives";
import { REASONS, type Reason } from "./data";

export function ReasonsSection() {
  return (
    <section aria-labelledby="why-heading" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <div className="max-w-3xl">
          <Eyebrow>Why choose us</Eyebrow>
          <h2 id="why-heading" className="mt-4 font-display text-4xl sm:text-5xl">
            Six reasons the return <em className="italic text-headline">customers come back.</em>
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <ReasonCard key={r.n} reason={r} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReasonCard({ reason }: { reason: Reason }) {
  return (
    <article className="group rounded-sm border border-border bg-card/40 p-6 transition-colors hover:border-amber/30">
      <AccentTile>{reason.n}</AccentTile>
      <h3 className="mt-5 font-display text-2xl">{reason.title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{reason.body}</p>
    </article>
  );
}
