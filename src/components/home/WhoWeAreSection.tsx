import { Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";


export function WhoWeAreSection() {
  return (
    <section aria-labelledby="who-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-0">
              <div className="min-w-0 lg:order-1">
                <Eyebrow>Who we are</Eyebrow>
              </div>
              <div
                aria-hidden
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md font-display text-2xl sm:h-16 sm:w-16 sm:text-3xl lg:order-2 lg:mt-8"
                style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
              >
                D
              </div>
            </div>

          </Reveal>
          <Reveal className="lg:col-span-8" delay={120}>
            <h2 id="who-heading" className="font-display text-3xl sm:text-4xl">
              A trusted marketplace for <em className="italic text-headline">premium digital tools.</em>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Digital Platform (𝙋𝙍𝙊 𝙎𝙌𝙐𝘼𝘿) is a trusted marketplace for premium digital products and AI tools.
              Since 2020, we&apos;ve helped thousands of customers access high-quality subscriptions,
              productivity software, creative tools and digital services — at affordable prices.
            </p>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
