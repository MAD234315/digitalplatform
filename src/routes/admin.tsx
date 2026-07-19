import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminStatus } from "@/lib/admin.functions";
import { LayoutDashboard, Image, Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Digital Platform" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");
  const status = useServerFn(getMyAdminStatus);

  useEffect(() => {
    if (pathname === "/admin/login") { setState("ok"); return; }
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (mounted) navigate({ to: "/admin/login" });
        return;
      }
      try {
        const s = await status();
        if (!mounted) return;
        if (s.isAdmin) setState("ok");
        else { setState("denied"); navigate({ to: "/admin/login" }); }
      } catch {
        if (mounted) navigate({ to: "/admin/login" });
      }
    })();
    return () => { mounted = false; };
  }, [pathname, navigate, status]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  if (pathname === "/admin/login") return <Outlet />;
  if (state !== "ok") return <div className="min-h-dvh bg-background" />;

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/proofs", label: "Proof Gallery", icon: Image, exact: false },
    { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
  ] as const;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="font-display text-lg text-foreground">
              Admin<span className="text-amber">.</span>
            </Link>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Digital Platform
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-2"
            >
              View site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-xs text-foreground hover:bg-card"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="lg:sticky lg:top-20 lg:self-start">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {links.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <li key={to} className="shrink-0">
                  <Link
                    to={to}
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm whitespace-nowrap transition ${
                      active
                        ? "bg-amber/15 text-amber border border-amber/30"
                        : "text-muted-foreground hover:bg-card hover:text-foreground border border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
