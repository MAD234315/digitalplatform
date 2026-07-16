/**
 * Dark/light theme with cookie-backed persistence.
 *
 * The theme is stored in the `dp-theme` cookie so the SSR shell and the
 * pre-hydration inline script in `__root.tsx` can pick it up and set
 * `<html class="light">` before first paint — no theme flash.
 *
 * If no cookie is set, initial value falls back to the OS
 * `prefers-color-scheme` and is then written to the cookie so subsequent
 * SSR renders stay in sync.
 */
import { useEffect, useState } from "react";


export type Theme = "dark" | "light";

export const THEME_COOKIE = "dp-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Parse a `dp-theme` cookie value out of a raw Cookie header / document.cookie string. */
export function readThemeCookie(cookieHeader: string | null | undefined): Theme | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)dp-theme=(light|dark)/);
  return (match?.[1] as Theme | undefined) ?? undefined;
}

function writeCookie(theme: Theme) {
  // path=/, 1 year, SameSite=Lax so it travels with same-origin nav.
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function readInitial(): Theme {
  if (typeof document === "undefined") return "dark";
  const fromCookie = readThemeCookie(document.cookie);
  if (fromCookie) return fromCookie;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

/**
 * Client-side theme toggle. State is persisted in a cookie so SSR can render
 * the correct `<html class="light">` on first paint (see __root.tsx).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readInitial();
    setTheme(initial);
    apply(initial);
    // Ensure a cookie exists so the next SSR pass matches the client choice
    // even when it originated from the OS `prefers-color-scheme` fallback.
    writeCookie(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    apply(theme);
    writeCookie(theme);
  }, [theme, hydrated]);

  return {
    theme,
    hydrated,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    setTheme,
  };
}
