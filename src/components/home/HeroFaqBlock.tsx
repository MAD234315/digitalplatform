import { CtaLink, CtaRouterLink } from "@/components/ui-primitives";
import { CONTACT } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";

const FAQS = [
  {
    q: "Have a doubt before you order?",
    a: "Ask CREATOR AI — it instantly answers product, plan, validity and availability questions using our live catalogue.",
    cta: { to: "/chat", label: "Ask CREATOR AI", external: false },
  },
  {
    q: "Ready to buy or need a custom plan?",
    a: "Tap below to connect directly with our Admin on WhatsApp for pricing, payment and personalised recommendations.",
    cta: {
      href: `${CONTACT.WA_URL}?text=${encodeURIComponent("Hi! I found your website and I'd like to talk to the Admin about a product/plan. Can you help me?")}`,
      label: "Connect to Admin",
      external: true,
    },
  },
] as const;

/** Compact FAQ strip placed directly under the hero section. */
export function HeroFaqBlock() {
  return (
    <section aria-labelledby="hero-faq-heading" className="cv-auto border-y border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-md">
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Quick help</span>
              <h2 id="hero-faq-heading" className="mt-2 font-display text-2xl sm:text-3xl">
                Not sure yet? <em className="italic text-headline">We’ve got you.</em>
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8 flex-1 lg:max-w-2xl">
              {FAQS.map(({ q, a, cta }) => (
                <div
                  key={q}
                  className="rounded-sm border border-border bg-background p-5 sm:p-6 transition-colors hover:border-amber/40"
                >
                  <h3 className="font-display text-lg leading-snug">{q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
                  <div className="mt-4">
                    {cta.external ? (
                      <CtaLink
                        href={cta.href}
                        target="_blank"
                        rel="noreferrer"
                        size="md"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {cta.label}
                      </CtaLink>
                    ) : (
                      <CtaRouterLink
                        to={cta.to}
                        size="md"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {cta.label}
                      </CtaRouterLink>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
