import { useCallback, useEffect, useState } from "react";

const KEY = "dp:reduce-motion";
const ATTR = "data-reduce-motion";

type Preference = "system" | "on" | "off";

function readPref(): Preference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(KEY);
  if (raw === "on" || raw === "off") return raw;
  return "system";
}

/**
 * `data-reduce-motion="true"` on <html> forces reduced motion regardless of OS
 * preference; `"false"` overrides the OS preference the other way (respect
 * user's explicit choice). Absence = follow `prefers-reduced-motion`.
 */
function applyToDom(pref: Preference) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (pref === "on") el.setAttribute(ATTR, "true");
  else if (pref === "off") el.setAttribute(ATTR, "false");
  else el.removeAttribute(ATTR);
}

export function useReducedMotion() {
  const [pref, setPref] = useState<Preference>("system");
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    const initial = readPref();
    setPref(initial);
    applyToDom(initial);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setPreference = useCallback((next: Preference) => {
    setPref(next);
    if (next === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, next);
    applyToDom(next);
  }, []);

  const effective = pref === "system" ? systemReduced : pref === "on";

  return { preference: pref, effective, setPreference };
}
