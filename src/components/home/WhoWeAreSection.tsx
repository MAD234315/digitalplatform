import { Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";
import { Link } from "@tanstack/react-router";


export function WhoWeAreSection() {
  return (
    <section aria-labelledby="who-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-10 sm:py-12 lg:py-14">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-0">
              <div className="min-w-0">
                <Eyebrow>Who we are</Eyebrow>
              </div>
              <div
                aria-hidden
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md font-display text-2xl sm:h-16 sm:w-16 sm:text-3xl lg:mt-8"
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
            <p className="mt-4 text-[10px] text-muted-foreground/80 leading-relaxed italic whitespace-pre-wrap">
              {"'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            Add a Global Customers section with a clear one-line headline and a logo grid or carousel of customer brands."}
            </p>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
