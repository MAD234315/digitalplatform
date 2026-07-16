/**
 * Shared IntersectionObserver singleton for Reveal components.
 *
 * Motivation: the home page mounts 20+ Reveals. Each own observer wastes
 * memory and CPU. This module hands every Reveal one observer instance
 * (per unique threshold/rootMargin option key) plus a Map of element →
 * callback.
 */

type Callback = (isIntersecting: boolean) => void;

const OPTIONS: IntersectionObserverInit = {
  threshold: 0.12,
  rootMargin: "0px 0px -40px 0px",
};

let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, Callback>();

function ensureObserver(): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const cb = callbacks.get(e.target);
      if (cb) cb(e.isIntersecting);
    }
  }, OPTIONS);
  return observer;
}

export function observeReveal(el: Element, cb: Callback): () => void {
  const io = ensureObserver();
  if (!io) return () => {};
  callbacks.set(el, cb);
  io.observe(el);
  return () => {
    callbacks.delete(el);
    io.unobserve(el);
  };
}
