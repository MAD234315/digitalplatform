import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { getAdminBootstrapStatus, getMyRole } from "@/lib/admin.functions";

type AuthMode = "signin" | "signup" | "forgot";

export function AdminLoginPage() {
  const nav = useNavigate();
  const bootstrapFn = useServerFn(getAdminBootstrapStatus);
  const roleFn = useServerFn(getMyRole);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setChecking(true);
      setErr(null);
      try {
        const [setup, userResult] = await Promise.all([
          bootstrapFn(),
          supabase.auth.getUser(),
        ]);
        if (!alive) return;
        setAdminExists(setup.adminExists);
        if (setup.adminExists && mode === "signup") setMode("signin");

        if (userResult.data.user) {
          try {
            const role = await roleFn();
            if (alive && role.isAdmin) nav({ to: "/admin", replace: true });
          } catch {
            // Stay on the login page for expired or non-admin sessions.
          }
        }
      } catch {
        if (!alive) return;
        setAdminExists(true);
        setErr("Could not verify setup status. Setup remains locked until the backend confirms zero admins.");
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bootstrapFn, roleFn, nav, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const setup = await bootstrapFn();
        nav({ to: setup.adminExists ? "/admin" : "/admin/setup", replace: true });
      } else if (mode === "signup") {
        const setup = await bootstrapFn();
        if (setup.adminExists) {
          setAdminExists(true);
          throw new Error("Account setup is disabled because an admin already exists.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin/setup" },
        });
        if (error) throw error;
        if (data.session) {
          const latestSetup = await bootstrapFn();
          nav({ to: latestSetup.adminExists ? "/admin/login" : "/admin/setup", replace: true });
          return;
        }
        setMsg("Account created. Check your inbox if email confirmation is required, then sign in to continue setup.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setMsg("If an account exists for that email, a password reset link has been sent.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signin" ? "Sign in to manage the site."
    : mode === "signup" ? "Create the first admin account."
    : "Enter your email to receive a reset link.";

  const submitLabel =
    mode === "signin" ? "Sign in"
    : mode === "signup" ? "Create account"
    : "Send reset link";

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-5 pt-32 pb-24">
        <div className="rounded-2xl border border-amber/30 bg-card/70 p-8 shadow-gold backdrop-blur">
          <h1 className="font-display text-3xl">Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {checking ? "Checking admin status…" : title}
          </p>

          {!checking && !adminExists && (
            <div className="mt-5 rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm">
              No admin exists yet. Create or sign in to an account, then continue the one-time setup.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={checking}
                className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber disabled:opacity-60"
              />
            </label>
            {mode !== "forgot" && (
              <label className="block">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Password
                </span>
                <input
                  type="password"
                  required
                  minLength={1}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={checking}
                  className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber disabled:opacity-60"
                />
              </label>
            )}
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
              disabled={busy || checking}
              className="h-12 w-full rounded-full bg-amber font-medium text-amber-foreground shadow-gold disabled:opacity-60"
            >
              {busy || checking ? "Please wait…" : submitLabel}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setErr(null); setMsg(null); }}
                  className="text-muted-foreground hover:text-amber"
                >
                  Forgot password?
                </button>
                {!adminExists && (
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}
                    className="text-muted-foreground hover:text-amber"
                  >
                    Need an account? Create first admin account
                  </button>
                )}
              </>
            )}
            {mode === "signup" && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}
                className="text-muted-foreground hover:text-amber"
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}
                className="text-muted-foreground hover:text-amber"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}