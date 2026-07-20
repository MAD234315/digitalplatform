import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  postLoginCheck,
  claimSuperAdmin,
  checkLoginLockout,
  recordLoginAttempt,
} from "@/lib/admins.functions";
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

const REASON_MSG: Record<string, string> = {
  pending: "Your admin request is still awaiting approval by a Super Admin.",
  rejected: "Your admin request was rejected. Contact a Super Admin for details.",
  suspended: "Your account has been suspended. Contact a Super Admin.",
  no_role: "This account does not have admin access.",
  no_profile: "No admin profile is linked to this account. Please request access.",
};

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const online = useOnline();
  const check = useServerFn(postLoginCheck);
  const claimSuper = useServerFn(claimSuperAdmin);
  const lockout = useServerFn(checkLoginLockout);
  const record = useServerFn(recordLoginAttempt);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        try {
          const s = await check();
          if (s.ok) { navigate({ to: "/admin" }); return; }
        } catch { /* ignore */ }
      }
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate, check]);

  async function attemptLogin() {
    setBusy(true);
    setLastError(null);
    try {
      // Lockout pre-check
      try {
        const lk = await lockout({ data: { email } });
        if (lk.locked) throw Object.assign(new Error("Too many failed attempts. Try again in 15 minutes."), { permanent: true });
      } catch (e) { if ((e as any)?.permanent) throw e; }

      await retry(
        async () => {
          const { error: signInErr } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            20000,
            "Sign in",
          );
          if (signInErr) {
            try { await record({ data: { email, success: false } }); } catch { /* ignore */ }
            const err = new Error(signInErr.message === "Invalid login credentials" ? "Invalid email or password." : signInErr.message);
            (err as any).permanent = true;
            throw err;
          }
          // Try to claim super admin (only succeeds if none exists yet)
          try { await withTimeout(claimSuper(), 15000, "Bootstrap"); } catch { /* ignore */ }

          const s = await withTimeout(check(), 15000, "Verify admin");
          if (!s.ok) {
            await supabase.auth.signOut();
            const msg = REASON_MSG[s.reason] ?? "Access denied.";
            const err = new Error(msg);
            (err as any).permanent = true;
            throw err;
          }
          try { await record({ data: { email, success: true } }); } catch { /* ignore */ }
        },
        { attempts: 3, onAttempt: (n) => setAttempt(n) },
      );
      toast.success("Welcome back.");
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setLastError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
      setAttempt(0);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!online) {
      toast.error("You're offline. Connect to the internet and try again.");
      return;
    }
    await attemptLogin();
  }

  if (checking) return <div className="min-h-dvh bg-background" />;

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-5 inline-flex min-h-10 items-center text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <div className="rounded-lg border border-border bg-card p-5 sm:p-8 shadow-lg">
          <h1 className="font-display text-2xl text-foreground">Admin Sign In</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Restricted area. Access is granted by the Super Admin only.
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-sm border border-border bg-background px-3 text-base sm:text-sm text-foreground outline-none focus:border-amber"
              />
            </label>
            {!online && (
              <div className="rounded-sm border border-destructive/40 bg-destructive/10 text-destructive text-xs px-3 py-2 flex items-center gap-2">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>You're offline. Sign-in will resume when you're back.</span>
              </div>
            )}
            <button
              type="submit"
              disabled={busy || !online}
              className="w-full min-h-12 rounded-sm font-semibold uppercase tracking-[0.14em] text-sm disabled:opacity-60"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              {busy
                ? attempt > 1 ? `Retrying (attempt ${attempt}/3)…` : "Please wait…"
                : "Sign in"}
            </button>
            {lastError && !busy && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/5 text-destructive text-xs px-3 py-2 space-y-2">
                <div className="break-words">{lastError}</div>
                {isTransient(new Error(lastError)) && (
                  <button
                    type="button"
                    onClick={attemptLogin}
                    className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold uppercase tracking-wider"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </button>
                )}
              </div>
            )}
          </form>

          <Link
            to="/admin/request"
            className="mt-4 min-h-11 flex items-center justify-center text-xs text-muted-foreground hover:text-amber"
          >
            Need access? Request Admin Access →
          </Link>
        </div>
      </div>
    </div>
  );
}
