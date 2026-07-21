import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Digital Platform Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // Supabase parses the recovery hash and emits PASSWORD_RECOVERY / SIGNED_IN.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (password.length < 1) return setErr("Password is required.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Password updated. Redirecting to admin…");
      setTimeout(() => nav({ to: "/admin" }), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-5 pt-32 pb-24">
        <div className="rounded-2xl border border-amber/30 bg-card/70 p-8 shadow-gold backdrop-blur">
          <h1 className="font-display text-3xl">Reset password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {ready
              ? "Choose a new password for your account."
              : "Waiting for a valid recovery link… open this page from the email link."}
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                New password
              </span>
              <input
                type="password"
                required
                minLength={1}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready}
                className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Confirm password
              </span>
              <input
                type="password"
                required
                minLength={1}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready}
                className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber disabled:opacity-60"
              />
            </label>
            {err && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {err}
              </p>
            )}
            {msg && (
              <p className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm">
                {msg}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !ready}
              className="h-12 w-full rounded-full bg-amber font-medium text-amber-foreground shadow-gold disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
