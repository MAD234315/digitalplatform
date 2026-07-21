import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Digital Platform Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/admin" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        setMsg(
          "Account created. If email confirmation is enabled, check your inbox — otherwise sign in below.",
        );
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
    : mode === "signup" ? "Create an admin account."
    : "Enter your email to receive a reset link.";

  const submitLabel =
    mode === "signin" ? "Sign in"
    : mode === "signup" ? "Create account"
    : "Send reset link";

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-5 pt-32 pb-24">
        <div className="rounded-2xl border border-amber/30 bg-card/70 p-8 shadow-gold backdrop-blur">
          <h1 className="font-display text-3xl">Admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">{title}</p>
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
                className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
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
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
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
              disabled={busy}
              className="h-12 w-full rounded-full bg-amber font-medium text-amber-foreground shadow-gold disabled:opacity-60"
            >
              {busy ? "Please wait…" : submitLabel}
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
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}
                  className="text-muted-foreground hover:text-amber"
                >
                  Need an account? Sign up
                </button>
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

