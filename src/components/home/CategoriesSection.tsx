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
      className="cv-auto relative overflow-hidden border-t border-border bg-card/30"
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

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <div className="inline-flex flex-col">
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber">
                Our Services
              </span>
              <span
                aria-hidden
                className="mt-2 h-px w-16"
                style={{
                  background:
                    "linear-gradient(90deg, var(--amber), color-mix(in oklab, var(--amber) 0%, transparent))",
                }}
              />
            </div>
            <h2
              id="cat-heading"
              className="mt-5 font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight text-balance"
            >
              Twelve worlds,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--foreground) 0%, var(--foreground) 55%, var(--amber) 100%)",
                }}
              >
                one shelf.
              </span>
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground text-pretty">
              A wide range of{" "}
              <span className="font-medium text-amber/90">digital products</span>{" "}
              across categories — catalogue{" "}
              <span className="font-medium text-amber/90">updated regularly</span>{" "}
              with new products based on availability.
            </p>
          </Reveal>

          <div className="lg:col-span-8">
            <ul className="grid gap-2 sm:gap-2.5">
              {CATEGORIES.map((c, i) => {
                const Icon = ICONS[i] ?? Zap;
                return (
                  <Reveal as="li" key={c} delay={Math.min(i * 50, 400)} y={10}>
                    <Link
                      to="/products"
                      className="group relative flex min-h-14 items-center gap-4 sm:gap-5 rounded-[18px] border border-border/70 bg-gradient-to-br from-card/60 to-card/20 px-4 sm:px-5 py-4 sm:py-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber/50 hover:from-card/80 hover:to-card/40 hover:shadow-[0_10px_40px_-15px_color-mix(in_oklab,var(--amber)_35%,transparent)]"
                    >
                      {/* Premium numbering */}
                      <span className="w-9 shrink-0 font-display text-base sm:text-lg tabular-nums text-muted-foreground/70 transition-colors duration-300 group-hover:text-amber">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      {/* Icon tile */}
                      <span
                        aria-hidden
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber/25 bg-amber/5 text-amber transition-all duration-300 group-hover:border-amber/60 group-hover:bg-amber/10 group-hover:shadow-[0_0_20px_-6px_var(--amber)]"
                      >
                        <Icon size={18} strokeWidth={1.6} />
                      </span>

                      {/* Title */}
                      <span className="min-w-0 flex-1 truncate font-display text-lg sm:text-xl tracking-tight transition-colors duration-300 group-hover:text-amber">
                        {c}
                      </span>

                      {/* Arrow */}
                      <span
                        aria-hidden
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-amber"
                      >
                        <ArrowRight size={18} strokeWidth={1.8} />
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
