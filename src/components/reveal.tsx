import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { observeReveal } from "@/lib/reveal-observer";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  y?: number;
  once?: boolean;
};

/**
 * Scroll-triggered reveal. SSR-safe: renders visible on the server,
 * hides briefly on mount, then fades/rises in when it enters the viewport.
 * Respects prefers-reduced-motion via the global @media rule.
 *
 * All Reveals share a single IntersectionObserver via `reveal-observer.ts`,
 * so mounting 20+ of them on the home page costs one observer, not 20+.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  y = 14,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setReady(true);
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const unobserve = observeReveal(el, (isIntersecting) => {
      if (cancelled) return;
      if (isIntersecting) {
        setInView(true);
        if (once) unobserve();
      } else if (!once) {
        setInView(false);
      }
    });
    return () => {
      cancelled = true;
      unobserve();
    };
  }, [once]);


  const hidden = ready && !inView;
  const settled = ready && inView && once; // reached final state, won't animate again
  // Always include transitionDelay in both branches. React warns when a
  // longhand (transitionDelay) is added/removed while the `transition`
  // shorthand stays set — keeping the key present in every render avoids
  // the "Removing transitionDelay" style mutation warning.
  const style = hidden
    ? { opacity: 0, transform: `translate3d(0, ${y}px, 0)`, transitionDelay: "0ms" }
    : { opacity: 1, transform: "translate3d(0, 0, 0)", transitionDelay: `${delay}ms` };


  return (
    <Tag
      ref={ref as never}
      style={{
        transition:
          "opacity 700ms cubic-bezier(0.2, 0.7, 0.2, 1), transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1)",
        // Drop willChange once the element has finished revealing so we
        // don't hold a compositor layer per Reveal for the rest of the
        // page's lifetime (long FAQ / product grids can host dozens).
        willChange: settled ? undefined : "opacity, transform",
        ...style,
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

