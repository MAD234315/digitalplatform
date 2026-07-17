import type { ReactNode } from "react";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Standard page frame: fixed header + main landmark + footer.
 *
 * Every top-level route repeats the same three wrappers around its content.
 * Centralising them here guarantees the skip-link target (`#main`) stays in
 * sync with `SiteNav` and removes ~4 lines of boilerplate from each route.
 *
 * Each of the three slots is wrapped in its own `ErrorBoundary` so a runtime
 * failure in, say, the theme toggle or the footer's date logic can't blank
 * the whole page — the surrounding sections keep rendering, and the route's
 * own `errorComponent` still catches anything a section rethrows.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ErrorBoundary boundary="shell:nav" fallback={null}>
        <SiteNav />
      </ErrorBoundary>
      <main id="main">
        <ErrorBoundary boundary="shell:main">{children}</ErrorBoundary>
      </main>
      <ErrorBoundary boundary="shell:footer" fallback={null}>
        <SiteFooter />
      </ErrorBoundary>
    </div>
  );
}
