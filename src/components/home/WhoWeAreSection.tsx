import { Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";


export function WhoWeAreSection() {
  return (
    <section aria-labelledby="who-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>Who we are</Eyebrow>
            <div
              aria-hidden
              className="mt-8 inline-flex h-16 w-16 items-center justify-center rounded-md font-display text-3xl"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              D
            </div>
          </Reveal>
          <Reveal className="lg:col-span-8" delay={120}>
            <h2 id="who-heading" className="font-display text-3xl sm:text-4xl">
              A trusted marketplace for <em className="italic text-headline">premium digital tools.</em>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Digital Platform (𝙋𝙍𝙊 𝙎𝙌𝙐𝘼𝘿) is a trusted marketplace for premium digital products and AI tools.
              Since 2020, we&apos;ve helped thousands of customers access high-quality subscriptions,
              productivity software, creative tools and digital services — at affordable prices.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our mission is simple: make premium digital services more accessible while delivering
              reliable customer support and a smooth buying experience.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
