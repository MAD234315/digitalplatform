import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { claimFirstAdmin, getAdminBootstrapStatus, getMyRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/setup")({
  head: () => ({
    meta: [
      { title: "Admin Setup — Claim First Admin" },
      { name: "description", content: "One-time setup to claim the first admin role for this site." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSetupPage,
});

type Phase = "loading" | "unauth" | "already-admin" | "ready" | "working" | "success" | "taken" | "error";

function AdminSetupPage() {
  const nav = useNavigate();
  const claimFn = useServerFn(claimFirstAdmin);
  const bootstrapFn = useServerFn(getAdminBootstrapStatus);
  const roleFn = useServerFn(getMyRole);
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const setup = await bootstrapFn();
        if (!alive) return;
        if (setup.adminExists) {
          nav({ to: "/admin/login", replace: true });
          return;
        }
      } catch {
        if (!alive) return;
        setMessage("Could not verify admin setup status. Setup stays locked until the backend confirms zero admins.");
        setPhase("error");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;
      if (error || !data.user) {
        setPhase("unauth");
        return;
      }
      setEmail(data.user.email ?? null);
      try {
        const r = await roleFn();
        if (!alive) return;
        setPhase(r.isAdmin ? "already-admin" : "ready");
      } catch {
        if (alive) setPhase("ready");
      }
    })();
    return () => {
      alive = false;
    };
  }, [bootstrapFn, roleFn, nav]);

  async function handleClaim() {
    setPhase("working");
    setMessage(null);
    try {
      const r = await claimFn();
      if (r.claimed) setPhase("success");
      else setPhase("taken");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Checking admin setup status…</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-xl px-5 pt-32 pb-20">
        <div className="rounded-3xl border border-amber/40 bg-gradient-to-b from-black/60 to-black/30 p-8 shadow-gold backdrop-blur sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber/50 bg-amber/10 text-amber">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-center font-display text-3xl">Admin setup</h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
            Claim the first Super Admin role for this site. Available only until an admin exists.
          </p>

          {phase === "unauth" && (
            <div className="mt-8 rounded-xl border border-border p-5 text-center">
              <p className="text-sm text-muted-foreground">You need to sign in first.</p>
              <button
                onClick={() => nav({ to: "/admin/login" })}
                className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground shadow-gold"
              >
                Go to Admin Login
              </button>
            </div>
          )}

          {phase === "already-admin" && (
            <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
              <p className="mt-2 text-sm">You already have admin access.</p>
              <button
                onClick={() => nav({ to: "/admin" })}
                className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground shadow-gold"
              >
                Open admin console
              </button>
            </div>
          )}

          {(phase === "ready" || phase === "working") && (
            <div className="mt-8 rounded-xl border border-amber/30 bg-amber/5 p-5">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="text-foreground">{email ?? "—"}</span>. Claiming will grant your
                account the Super Admin role. This only works if no admin exists yet.
              </p>
              <button
                onClick={handleClaim}
                disabled={phase === "working"}
                className="mt-5 w-full rounded-full bg-amber px-5 py-3 text-sm font-medium text-amber-foreground shadow-gold disabled:opacity-60"
              >
                {phase === "working" ? "Claiming…" : "Claim first admin"}
              </button>
            </div>
          )}

          {phase === "success" && (
            <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
              <p className="mt-2 text-sm">You are now the Super Admin.</p>
              <button
                onClick={() => nav({ to: "/admin" })}
                className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground shadow-gold"
              >
                Open admin console
              </button>
            </div>
          )}

          {phase === "taken" && (
            <div className="mt-8 rounded-xl border border-amber/30 bg-amber/5 p-5 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-amber" />
              <p className="mt-2 text-sm">
                An admin already exists. Ask an existing admin to grant you access.
              </p>
              <Link
                to="/admin/login"
                className="mt-4 inline-block rounded-full border border-border px-5 py-2 text-sm hover:border-amber"
              >
                Go to Admin Login
              </Link>
            </div>
          )}

          {phase === "error" && (
            <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-red-400" />
              <p className="mt-2 text-sm">{message ?? "Could not claim admin."}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground shadow-gold"
              >
                Check again
              </button>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
