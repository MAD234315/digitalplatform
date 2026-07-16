import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  /** Full text to display, e.g. "200+", "5 yrs", "Daily", "24/7". Non-numeric strings pass through unchanged. */
  value: string;
  /** ms — duration of the count animation */
  duration?: number;
  className?: string;
};

/**
 * Parses a leading integer from `value` and animates from 0 → n once the
 * element scrolls into view. Preserves any suffix ("+", " yrs", "%").
 * If the value has no leading number (e.g. "Daily", "24/7"), it's rendered
 * verbatim with no animation.
 */
export function CountUp({ value, duration = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(target);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            io.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
              setN(Math.round(eased * target));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  if (target === null) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      {n}
      {suffix}
    </span>
  );
}
