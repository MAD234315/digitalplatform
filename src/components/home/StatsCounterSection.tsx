import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/reveal";

function useCountUp(target: number, durationMs = 1800, start = false) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);

  return value;
}

function Stat({
  target,
  suffix = "",
  label,
  sublabel,
  inView,
  format,
}: {
  target: number;
  suffix?: string;
  label: string;
  sublabel?: string;
  inView: boolean;
  format?: (n: number) => string;
}) {
  const n = useCountUp(target, 1800, inView);
  const display = format ? format(n) : n.toLocaleString();
  return (
    <div className="text-center">
      <div
        className="font-display text-4xl sm:text-6xl lg:text-7xl leading-none tracking-tight"
        style={{ color: "var(--amber)" }}
      >
        {display}
        <span>{suffix}</span>
      </div>
      <div className="mt-3 text-base sm:text-lg text-foreground font-medium">{label}</div>
      {sublabel ? (
        <div className="mt-1 text-sm text-muted-foreground">{sublabel}</div>
      ) : null}
    </div>
  );
}

export function StatsCounterSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  const yearsSince2020 = Math.max(0, new Date().getFullYear() - 2020);

  return (
    <section aria-labelledby="stats-heading" className="cv-auto border-t border-border">
      <div
        ref={ref}
        className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24"
      >
        <h2 id="stats-heading" className="sr-only">
          Our numbers
        </h2>
        <Reveal>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 items-start">
            <Stat
              target={15}
              suffix="K+"
              label="Customers served"
              sublabel="Trusted worldwide"
              inView={inView}
            />
            <Stat
              target={yearsSince2020}
              suffix="+ yrs"
              label="Since 2020"
              sublabel="Consistent, reliable, honest"
              inView={inView}
              format={(n) => String(n)}
            />
          </div>
        </Reveal>
        <Reveal>
          <p className="mt-10 sm:mt-12 text-center text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Trusted by customers across the{" "}
            <span className="text-foreground font-medium">
              USA, UK, Canada, UAE, Kuwait, Malaysia, Singapore, Australia, Ireland&nbsp;
            </span>and many more.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
