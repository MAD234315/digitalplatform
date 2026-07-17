import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. */
  max?: number;
  /** Optional inline style passthrough. */
  style?: CSSProperties;
};

/**
 * Subtle 3D tilt that follows the cursor. Pointer-driven with rAF, GPU-only
 * transforms, and full reset on leave. Skipped when the user prefers reduced
 * motion or the device is coarse-pointer (touch), where hover-tilt makes no
 * sense and would fight scroll gestures.
 *
 * Perf notes:
 *  - `isEnabled` is evaluated once on mount (media queries don't change often)
 *    instead of on every pointermove.
 *  - When disabled, no pointer listeners are attached — the card renders as a
 *    plain div, so touch scrolling and reduced-motion users pay nothing.
 *  - `will-change: transform` is only set while the pointer is actually over
 *    the card, so we don't promote N cards to compositor layers at rest.
 */
export function TiltCard({ children, className = "", max = 6, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(hover: none)");
    const compute = () => setEnabled(!reduce.matches && !coarse.matches);
    compute();
    reduce.addEventListener("change", compute);
    coarse.addEventListener("change", compute);
    return () => {
      reduce.removeEventListener("change", compute);
      coarse.removeEventListener("change", compute);
    };
  }, []);

  if (!enabled) {
    // No listeners, no willChange, no rAF — cheapest possible fallback.
    return (
      <div ref={ref} className={`block h-full w-full min-w-0 ${className}`} style={style}>
        {children}
      </div>
    );
  }



  const onEnter = () => {
    const el = ref.current;
    if (el) el.style.willChange = "transform";
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translate3d(0,-2px,0)`;
    });
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)";
    el.style.willChange = "";
  };

  return (
    <div
      ref={ref}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={`block h-full w-full min-w-0 ${className}`}
      style={{
        transition: "transform 350ms cubic-bezier(0.2,0.7,0.2,1)",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
