import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState, Link } from "@tanstack/react-router";
import { getSiteStatus } from "@/lib/proof-gallery.functions";
import { getMyAdminStatus } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { WrenchIcon } from "lucide-react";

/**
 * Gates the customer site when admins set status = offline.
 * Admin routes (/admin/*) always bypass.
 * Signed-in admins bypass and continue browsing.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const statusFn = useServerFn(getSiteStatus);
  const adminFn = useServerFn(getMyAdminStatus);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const statusQ = useQuery({
    queryKey: ["site-status"],
    queryFn: () => statusFn() as Promise<{ status: "online" | "offline" }>,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const adminQ = useQuery({
    queryKey: ["me", "is-admin"],
    queryFn: () => adminFn() as Promise<{ isAdmin: boolean }>,
    enabled: hasSession,
    staleTime: 60_000,
  });

  const isAdminRoute = pathname.startsWith("/admin");
  const offline = statusQ.data?.status === "offline";
  const isAdmin = !!adminQ.data?.isAdmin;

  if (offline && !isAdminRoute && !isAdmin) return <MaintenancePage />;
  return <>{children}</>;
}

function MaintenancePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto h-16 w-16 rounded-full border border-amber/40 bg-amber/10 flex items-center justify-center">
          <WrenchIcon className="h-7 w-7 text-amber" />
        </div>
        <div className="mt-6 text-[11px] uppercase tracking-[0.28em] text-amber">Scheduled maintenance</div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">We&apos;ll be back shortly</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The store is currently offline for updates. Please check back in a little while — thanks for your patience.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber animate-pulse" /> Live status
          </span>
          <span aria-hidden>·</span>
          <Link to="/admin/login" className="hover:text-foreground underline-offset-4 hover:underline">
            Admin sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
