import { Link } from "@tanstack/react-router";
import {
  Bot,
  Palette,
  Clapperboard,
  FileText,
  GraduationCap,
  Code2,
  Cloud,
  Briefcase,
  Gift,
  Zap,
  Building2,
  Crown,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { CATEGORIES } from "./data";

/**
 * Home-page section listing the site's product categories.
 *
 * Premium luxury redesign: gold-outlined icon tiles, glass rows with hover
 * lift + gold border glow, staggered reveal. Content and links unchanged.
 */

const ICONS: LucideIcon[] = [
  Bot,           // AI Productivity Tools
  Palette,       // Creative & Design Software
  Clapperboard,  // Streaming Subscriptions
  FileText,      // Workplace Solutions
  GraduationCap, // Educational Platforms
  Code2,         // Developer Tools
  Cloud,         // Cloud Services
  Briefcase,     // Professional Software
  Gift,          // Gift Cards
  Zap,           // Productivity Apps
  Building2,     // Business Tools
  Crown,         // Premium Memberships
];

export function CategoriesSection() {
  return (
    <section
      aria-labelledby="cat-heading"
      className="cv-auto relative isolate scroll-mt-24 overflow-hidden border-t border-border bg-card/30"
    >
      {/* Subtle gold ambient lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 40% at 85% 10%, color-mix(in oklab, var(--amber) 10%, transparent), transparent 70%), radial-gradient(50% 40% at 10% 90%, color-mix(in oklab, var(--amber) 6%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-4">
            <div className="inline-flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber">
                Our Services
              </span>
              <span
                aria-hidden
                className="mt-2 h-px w-12"
                style={{
                  background:
                    "linear-gradient(90deg, var(--amber), color-mix(in oklab, var(--amber) 0%, transparent))",
                }}
              />
            </div>
            <h2
              id="cat-heading"
              className="mt-4 font-display text-3xl sm:text-4xl leading-[1.1] tracking-tight"
            >
              Twelve worlds,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage:
                    "linear-gradient(135deg, var(--foreground) 0%, var(--foreground) 55%, var(--amber) 100%)",
                }}
              >
                one shelf.
              </span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A wide range of{" "}
              <span className="font-medium text-amber/90">digital products</span>{" "}
              across categories — catalogue{" "}
              <span className="font-medium text-amber/90">updated regularly</span>{" "}
              with new products based on availability.
            </p>
          </Reveal>

          <div className="lg:col-span-8">
            <ul className="grid gap-1.5 sm:gap-2">
              {CATEGORIES.map((c, i) => {
                const Icon = ICONS[i] ?? Zap;
                return (
                  <Reveal as="li" key={c} delay={Math.min(i * 50, 400)} y={10}>
                    <Link
                      to="/products"
                      className="group relative flex min-h-[3.25rem] items-center gap-4 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card/60 to-card/20 px-4 py-3.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber/50 hover:from-card/80 hover:to-card/40 hover:shadow-[0_10px_40px_-15px_color-mix(in_oklab,var(--amber)_35%,transparent)]"
                    >
                      {/* Premium numbering */}
                      <span className="w-8 shrink-0 font-display text-sm tabular-nums leading-none text-muted-foreground/70 transition-colors duration-300 group-hover:text-amber">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      {/* Icon tile */}
                      <span
                        aria-hidden
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber/25 bg-amber/5 text-amber transition-all duration-300 group-hover:border-amber/60 group-hover:bg-amber/10"
                      >
                        <Icon size={15} strokeWidth={1.6} />
                      </span>

                      {/* Title */}
                      <span className="min-w-0 flex-1 truncate font-display text-base leading-none tracking-tight transition-colors duration-300 group-hover:text-amber sm:text-lg">
                        {c}
                      </span>

                      {/* Arrow */}
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-amber"
                      >
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
