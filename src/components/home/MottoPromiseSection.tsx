import { AccentTile, Eyebrow } from "@/components/ui-primitives";
import { PROMISES } from "./data";

export function MottoPromiseSection() {
  return (
    <section aria-labelledby="promise-heading" className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32 grid lg:grid-cols-12 gap-10 lg:gap-12">
        <div className="lg:col-span-7">
          <Eyebrow>Our motto</Eyebrow>
          <h2 id="promise-heading" className="mt-4 font-display text-4xl sm:text-5xl leading-tight">
            Premium digital solutions.
            <br />
            <em className="italic text-headline">Genuine sources.</em>
            <br />
            Trusted service.
          </h2>
          <p className="mt-6 text-muted-foreground max-w-md">
            Making premium digital tools affordable for everyone — one honest transaction at a time.
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
            <Eyebrow>Customer promise</Eyebrow>
            <h3 className="mt-3 font-display text-2xl">We are committed to:</h3>
            <ul className="mt-6 space-y-3 text-sm">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <AccentTile size="sm">✓</AccentTile>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
