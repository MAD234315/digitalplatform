import { Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/ui-primitives";
import { CATEGORIES } from "./data";

export function CategoriesSection() {
  return (
    <section aria-labelledby="cat-heading" className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Our services</Eyebrow>
            <h2 id="cat-heading" className="mt-4 font-display text-4xl sm:text-5xl">
              Twelve worlds, one shelf.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-sm">
              A wide range of digital products across categories — catalogue updated regularly with new
              products based on availability.
            </p>
          </div>
          <div className="lg:col-span-8">
            <ul className="divide-y divide-border border-y border-border">
              {CATEGORIES.map((c, i) => (
                <li key={c}>
                  <Link
                    to="/products"
                    className="group flex items-center justify-between gap-6 py-5 transition-all hover:pl-3"
                  >
                    <div className="flex min-w-0 items-center gap-6">
                      <span className="w-8 shrink-0 font-display text-lg text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate font-display text-xl sm:text-2xl">{c}</span>
                    </div>
                    <span aria-hidden className="shrink-0 text-amber opacity-0 group-hover:opacity-100 transition">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
