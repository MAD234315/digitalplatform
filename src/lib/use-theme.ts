import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "dp-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* localStorage blocked — fall through */
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

/**
 * Client-side theme toggle. Reads once on mount (SSR-safe) then mirrors
 * changes to <html class="light"> plus localStorage so the choice persists.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  // Read stored preference AFTER hydration to avoid SSR mismatch.
  useEffect(() => {
    const initial = readInitial();
    setTheme(initial);
    apply(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    apply(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme, hydrated]);

  return {
    theme,
    hydrated,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    setTheme,
  };
}
