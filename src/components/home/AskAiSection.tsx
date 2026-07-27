import { CtaRouterLink, Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";

const POINTS = [
  "Ask about any product — plans, validity, activation & delivery.",
  "Get instant answers from our live catalogue, 24/7.",
  "Still need a human? CREATOR AI hands you over to our Admin on WhatsApp.",
] as const;

/** Home-page callout introducing the CREATOR AI assistant. */
export function AskAiSection() {
  return (
    <section aria-labelledby="ask-ai-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24">
        <Reveal>
          <div className="rounded-sm border border-amber/25 bg-card p-8 sm:p-10 lg:p-12 shadow-[0_0_60px_-30px_hsl(var(--amber)/0.6)]">
            <Eyebrow>Ask AI</Eyebrow>
            <h2 id="ask-ai-heading" className="mt-4 font-display text-3xl sm:text-4xl max-w-2xl">
              Doubts? Ask <em className="italic text-headline">CREATOR AI.</em>
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              CREATOR AI is our in-house assistant. It clears your doubts about our products in seconds — and
              when you're ready to order, it connects you straight to our Admin on WhatsApp.
            </p>
            <ul className="mt-6 grid gap-3 max-w-2xl">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-muted-foreground">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CtaRouterLink to="/chat" size="md">Ask CREATOR AI</CtaRouterLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
