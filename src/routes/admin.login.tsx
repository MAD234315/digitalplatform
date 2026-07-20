import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { claimAdmin, getMyAdminStatus } from "@/lib/admin.functions";
import { toast } from "sonner";
import { useOnline, withTimeout, retry, isTransient } from "@/lib/network";
import { WifiOff, RefreshCw } from "lucide-react";


export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const online = useOnline();
  const claim = useServerFn(claimAdmin);
  const status = useServerFn(getMyAdminStatus);


  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        try {
          const s = await status();
          if (s.isAdmin) {
            navigate({ to: "/admin" });
            return;
          }
        } catch { /* ignore */ }
      }
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate, status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. Signing in…");
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;

      // Try to bootstrap admin (only works if no admins exist yet).
      try { await claim(); } catch { /* ignore */ }

      const s = await status();
      if (!s.isAdmin) {
        await supabase.auth.signOut();
        throw new Error("This account is not an admin.");
      }
      toast.success("Welcome, admin.");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-5 inline-flex min-h-10 items-center text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <div className="rounded-lg border border-border bg-card p-5 sm:p-8 shadow-lg">
          <h1 className="font-display text-2xl text-foreground">Admin {mode === "signup" ? "Signup" : "Login"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            The first account created here automatically becomes admin.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="off"
                spellCheck={false}
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-sm border border-border bg-background px-3 text-base sm:text-sm text-foreground outline-none focus:border-amber"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-sm border border-border bg-background px-3 text-base sm:text-sm text-foreground outline-none focus:border-amber"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-12 rounded-sm font-semibold uppercase tracking-[0.14em] text-sm disabled:opacity-60"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              {busy ? "Please wait…" : mode === "signup" ? "Create admin" : "Sign in"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 min-h-11 text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === "signin" ? "Need to create the first admin? Sign up →" : "Have an account? Sign in →"}
          </button>
        </div>
      </div>
    </div>
  );
}
