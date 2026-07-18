import { Link } from "@tanstack/react-router";
import { Target } from "lucide-react";
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

            <div
              className="mission-card mt-10 rounded-sm border bg-card/60 p-6 sm:p-8"
              style={{
                borderColor: "color-mix(in oklab, var(--amber) 40%, transparent)",
                boxShadow: "0 0 0 1px color-mix(in oklab, var(--amber) 0%, transparent), 0 0 0 0 transparent",
                transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 400ms cubic-bezier(0.22, 1, 0.36, 1), border-color 400ms ease",
                willChange: "transform, box-shadow",
              }}
            >

              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="mission-badge inline-flex h-9 w-9 items-center justify-center rounded-sm border"
                  style={{
                    borderColor: "color-mix(in oklab, var(--amber) 55%, transparent)",
                    backgroundColor: "color-mix(in oklab, var(--amber) 12%, transparent)",
                    color: "var(--amber)",
                  }}
                >
                  <Target className="mission-badge-icon h-4.5 w-4.5" strokeWidth={2} />
                </span>

                <Eyebrow className="!mt-0">Our mission</Eyebrow>
              </div>
              <p className="mt-3 font-display text-2xl sm:text-3xl leading-snug">

                Help normal people, creators, students, professionals, developers and businesses access
                the digital tools they need — without paying unnecessary prices.
              </p>
              <Link
                to="/products"
                className="group mt-7 inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium border transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{
                  backgroundColor: "var(--amber)",
                  color: "var(--amber-foreground)",
                  borderColor: "color-mix(in oklab, var(--amber) 70%, transparent)",
                  boxShadow: "0 8px 24px -10px color-mix(in oklab, var(--amber) 55%, transparent)",
                }}
              >
                Browse the catalogue
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>

          </Reveal>
        </div>
      </div>
    </section>
  );
}
