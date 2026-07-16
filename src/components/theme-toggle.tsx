import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

/**
 * Nav-mounted dark/light toggle. Renders a stable icon during SSR to avoid
 * hydration flicker, then swaps to the active theme's icon after mount.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, hydrated, toggle } = useTheme();
  const isLight = hydrated && theme === "light";
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/60 text-foreground transition hover:bg-muted hover:border-foreground/30 ${className}`}
    >
      {isLight ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
