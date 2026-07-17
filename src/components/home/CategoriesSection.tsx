import { Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/ui-primitives";
import { Reveal } from "@/components/reveal";
import { CATEGORIES } from "./data";

/**
 * Home-page section listing the site's product categories.
 *
 * Each row is a link to `/products` and reveals with a staggered delay as
 * the list scrolls into view (capped so late items don't lag noticeably).
 */
export function CategoriesSection() {

  return (
    <section aria-labelledby="cat-heading" className="cv-auto border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow>Our services</Eyebrow>
            <h2 id="cat-heading" className="mt-4 font-display text-3xl sm:text-4xl">
              Twelve worlds, one shelf.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-sm">
              A wide range of digital products across categories — catalogue updated regularly with new
              products based on availability.
            </p>
          </Reveal>
          <div className="lg:col-span-8">
            <ul className="divide-y divide-border border-y border-border">
              {CATEGORIES.map((c, i) => (
                <Reveal as="li" key={c} delay={Math.min(i * 40, 320)} y={8}>
                  <Link
                    to="/products"
                    className="group flex items-center justify-between gap-6 py-5 transition-all duration-300 hover:pl-3 hover:bg-amber/5"
                  >
                    <div className="flex min-w-0 items-center gap-6">
                      <span className="w-8 shrink-0 font-display text-lg text-muted-foreground transition-colors group-hover:text-amber">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate font-display text-xl sm:text-2xl">{c}</span>
                    </div>
                    <span
                      aria-hidden
                      className="shrink-0 text-amber opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                    >
                      →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
