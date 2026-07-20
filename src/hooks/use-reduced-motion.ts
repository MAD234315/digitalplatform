import { useEffect, useState } from "react";

/**
 * Returns true when the user has requested reduced motion via the OS setting.
 * Safe on SSR — defaults to false until hydration, then reflects the live
 * media query and updates if the preference changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
