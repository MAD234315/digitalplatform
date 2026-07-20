import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminStatus } from "@/lib/admin.functions";
import { LayoutDashboard, Image, Settings, LogOut, Menu, X, ExternalLink } from "lucide-react";
import { NetworkBanner } from "@/components/admin/NetworkBanner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Digital Platform" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: AdminLayout,
});

const LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/proofs", label: "Proof Gallery", icon: Image, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");
  const [drawer, setDrawer] = useState(false);
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

  // Close drawer on route change + lock body scroll while open.
  useEffect(() => { setDrawer(false); }, [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [drawer]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  if (pathname === "/admin/login") return <Outlet />;
  if (state !== "ok") return <div className="min-h-dvh bg-background" />;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 max-w-6xl px-3 sm:px-4 py-2.5 sm:py-3">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border text-foreground -ml-1"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex items-center gap-2 lg:gap-3">
            <Link to="/admin" className="font-display text-base sm:text-lg text-foreground truncate">
              Admin<span className="text-amber">.</span>
            </Link>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate">
              Digital Platform
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
            <Link
              to="/"
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground px-3 py-2 min-h-11 items-center"
            >
              View site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 sm:px-3 min-h-11 text-xs text-foreground hover:bg-card"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <nav className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <ul className="flex flex-col gap-1">
            {LINKS.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm transition ${
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
        <main className="min-w-0"><Outlet /></main>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-background border-r border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-display text-lg">
                Admin<span className="text-amber">.</span>
              </span>
              <button
                onClick={() => setDrawer(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-foreground hover:bg-card"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex-1 p-3 space-y-1 overflow-y-auto">
              {LINKS.map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? pathname === to : pathname.startsWith(to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={`flex items-center gap-3 rounded-sm px-3 min-h-12 text-sm transition ${
                        active
                          ? "bg-amber/15 text-amber border border-amber/30"
                          : "text-foreground hover:bg-card border border-transparent"
                      }`}
                    >
                      <Icon className="h-5 w-5" /> {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="p-3 border-t border-border space-y-1">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-sm px-3 min-h-11 text-sm text-muted-foreground hover:bg-card"
              >
                <ExternalLink className="h-4 w-4" /> View site
              </Link>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 rounded-sm px-3 min-h-11 text-sm text-foreground hover:bg-card"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
