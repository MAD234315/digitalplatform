import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getSiteStatus } from "@/lib/admin.functions";

/**
 * Paths that must stay reachable while Maintenance Mode is ON — the admin
 * console and everything needed to sign into it.
 */
const ALWAYS_ALLOWED = ["/admin", "/auth", "/reset-password", "/setup"];

/** Pages that remain reachable during maintenance so they can render their own
 *  contextual maintenance notice instead of the generic full-page gate. */
const CONTEXTUAL_MAINTENANCE_PAGES = ["/products"];

function isAllowed(pathname: string) {
  return ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isContextualMaintenancePage(pathname: string) {
  return CONTEXTUAL_MAINTENANCE_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Site-wide Maintenance Mode gate.
 *
 * Reads the persisted `site_online` flag (Admin → Website Settings) and, when
 * the site is offline, replaces every customer-facing route with a minimal
 * maintenance page. Fails open: while loading or on error, the normal site
 * renders, so a transient backend blip never blanks the website.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const statusFn = useServerFn(getSiteStatus);
  const allowed = isAllowed(pathname);

  const { data } = useQuery({
    queryKey: ["site-status"],
    queryFn: () => statusFn(),
    enabled: !allowed,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  if (allowed || data?.online !== false) return <>{children}</>;
  return <MaintenancePage />;
}

function MaintenancePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-amber">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
          </span>
          Maintenance
        </span>

        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Website Currently Under Maintenance
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          We&rsquo;re currently working on the website to make things better.
          Please come back later. Thank you for your patience!
        </p>

        <div className="mt-8 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber/50 to-transparent" />

        <p className="mt-6 text-xs text-muted-foreground">
          Digital Platform &middot;{" "}
          <a
            href="https://wa.me/919652191369"
            className="text-amber underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Message us on WhatsApp
          </a>
        </p>

        <Link
          to="/admin"
          className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          Admin access
        </Link>
      </div>
    </div>
  );
}
