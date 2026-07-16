import type { ReactNode } from "react";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

/**
 * Standard page frame: fixed header + main landmark + footer.
 *
 * Every top-level route repeats the same three wrappers around its content.
 * Centralising them here guarantees the skip-link target (`#main`) stays in
 * sync with `SiteNav` and removes ~4 lines of boilerplate from each route.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
