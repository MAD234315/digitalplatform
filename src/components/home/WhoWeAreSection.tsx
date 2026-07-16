import { Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";

export function WhoWeAreSection() {
  return (
    <section aria-labelledby="who-heading" className="cv-auto border-t border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>Who we are</Eyebrow>
            <div
              aria-hidden
              className="mt-8 inline-flex h-16 w-16 items-center justify-center rounded-md font-display text-3xl transition-transform duration-500 hover:rotate-6 hover:scale-105"
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
              Digital Platform is a trusted marketplace for premium digital products and AI tools.
              Since 2020, we&apos;ve helped thousands of customers access high-quality subscriptions,
              productivity software, creative tools and digital services — at affordable prices.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our mission is simple: make premium digital services more accessible while delivering
              reliable customer support and a smooth buying experience.
            </p>

            <div className="mt-10 rounded-sm border border-border bg-card/60 p-6 sm:p-8 transition-colors duration-300 hover:border-amber/30">
              <Eyebrow>Our mission</Eyebrow>
              <p className="mt-3 font-display text-2xl sm:text-3xl leading-snug">
                Help creators, students, professionals, developers and businesses access the digital tools
                they need — without paying unnecessary prices.
              </p>
              <Link
                to="/products"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber hover:brightness-110"
              >
                Browse the catalogue{" "}
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
