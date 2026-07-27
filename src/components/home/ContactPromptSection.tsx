import { CONTACT } from "@/components/site-chrome";
import { CtaLink, CtaRouterLink, Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";

const INTENTS = ["Suggestion", "Feedback", "Collaboration"] as const;

export function ContactPromptSection() {
  return (
    <section aria-labelledby="contact-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 lg:py-14">
        <Reveal>
          <Eyebrow>Get in touch</Eyebrow>
          <h2 id="contact-heading" className="mt-4 font-display text-3xl sm:text-4xl">
            Suggestions, feedback <em className="italic text-headline">&amp; collabs.</em>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Ideas for products to add, feedback on your experience, or a partnership pitch — we read every message.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {INTENTS.map((t, i) => (
              <a
                key={t}
                href={`mailto:${CONTACT.EMAIL}?subject=%5B${t}%5D`}
                style={{ transitionDelay: `${i * 60}ms` }}
                className="inline-flex items-center min-h-11 rounded-full border border-border px-5 text-sm transition-all duration-300 hover:bg-card hover:border-amber/40 hover:-translate-y-0.5"
              >
                {t}
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <FinalCta />
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <div className="mt-10 rounded-sm border border-border bg-hero p-6 sm:p-8 lg:p-10">
      <Eyebrow>Ready when you are</Eyebrow>
      <h3 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl max-w-2xl">
        Ready to upgrade your <em className="italic text-headline">digital experience?</em>
      </h3>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Explore our collection of premium AI tools, software, subscriptions and digital products.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
        <CtaRouterLink to="/products" size="md">Browse products</CtaRouterLink>
        <CtaLink href={`${CONTACT.WA_URL}?text=${encodeURIComponent("Hi Digital Platform! I'd like to upgrade my digital experience — tell me more about your products.")}`} target="_blank" rel="noreferrer" variant="outline" size="md">
          WhatsApp us
        </CtaLink>
      </div>
    </div>
  );
}
