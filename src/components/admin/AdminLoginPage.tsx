import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogIn, UserPlus, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle2, Loader2, ArrowLeft, LifeBuoy } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { getAdminBootstrapStatus, getMyRole } from "@/lib/admin.functions";

type AuthMode = "signin" | "signup" | "forgot";

function humanizeError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("rate") && m.includes("limit")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("over_email_send_rate_limit")) return "Too many emails sent. Please wait before requesting another.";
  if (m.includes("user already registered")) return "An account with this email already exists — try signing in instead.";
  if (m.includes("password") && m.includes("short")) return "Password is too short. Use at least 6 characters.";
  if (m.includes("network")) return "Network error. Check your connection and try again.";
  return raw;
}

export function AdminLoginPage() {
  const nav = useNavigate();
  const bootstrapFn = useServerFn(getAdminBootstrapStatus);
  const roleFn = useServerFn(getMyRole);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const [successCard, setSuccessCard] = useState<{ title: string; body: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (checking) return;
    if (mode === "signin" || mode === "forgot") emailRef.current?.focus();
    else passwordRef.current?.focus();
  }, [mode, checking]);

  function handleModeChange(next: AuthMode) {
    setMode(next);
    setErr(null);
    setSuccessCard(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setSuccessCard(null);
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
        setSuccessCard({
          title: "Account created",
          body: `Check ${email} for a confirmation email, then sign in to continue setup.`,
        });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setSuccessCard({
          title: "Reset link sent",
          body: `If an account exists for ${email}, a password reset link is on its way. Check your inbox and spam folder.`,
        });
      }
    } catch (e) {
      setErr(humanizeError(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  const modeMeta = {
    signin: { Icon: LogIn, title: "Sign in", subtitle: "Sign in to the admin console.", cta: "Sign in", busy: "Signing in…" },
    signup: { Icon: UserPlus, title: "Create admin", subtitle: "Create the first Super Admin account.", cta: "Create account", busy: "Creating account…" },
    forgot: { Icon: KeyRound, title: "Reset password", subtitle: "We'll email you a reset link.", cta: "Send reset link", busy: "Sending reset link…" },
  }[mode];

  const { Icon: ModeIcon, title, subtitle, cta, busy: busyLabel } = modeMeta;

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-5 pt-32 pb-24">
        <div className="rounded-2xl border border-amber/30 bg-card/70 p-8 shadow-gold backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber/40 bg-amber/10 text-amber">
              <ModeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{checking ? "Checking admin status…" : subtitle}</p>
            </div>
          </div>

          {!checking && !adminExists && mode !== "signup" && (
            <div className="mt-6 rounded-xl border border-amber/40 bg-amber/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <div className="flex-1">
                  <p className="font-medium">No admin exists yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create the first Super Admin account to unlock the admin console.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleModeChange("signup")}
                    className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-amber px-4 text-sm font-medium text-amber-foreground shadow-gold"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create first admin account
                  </button>
                </div>
              </div>
            </div>
          )}

          {successCard && (
            <div
              role="status"
              aria-live="polite"
              className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-100">{successCard.title}</p>
                  <p className="mt-1 text-sm text-emerald-200/90">{successCard.body}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</span>
              <input
                ref={emailRef}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={checking || busy}
                className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber disabled:opacity-60"
              />
            </label>
            {mode !== "forgot" && (
              <label className="block">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Password</span>
                <div className="relative mt-1">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={1}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                    onKeyDown={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                    disabled={checking || busy}
                    className="h-12 w-full rounded-lg border border-border bg-background px-3 pr-11 text-sm outline-none focus:border-amber disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-amber"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsOn && (
                  <span className="mt-1 block text-xs text-amber">Caps Lock is on.</span>
                )}
              </label>
            )}

            <div aria-live="polite">
              {err && (
                <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {err}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || checking}
              aria-label={busy ? busyLabel : cta}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber font-medium text-amber-foreground shadow-gold disabled:opacity-60"
            >
              {(busy || checking) && <Loader2 className="h-4 w-4 animate-spin" />}
              {checking ? "Please wait…" : busy ? busyLabel : cta}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={() => handleModeChange("forgot")}
                  className="text-muted-foreground hover:text-amber"
                >
                  Forgot password?
                </button>
                {!adminExists && (
                  <button
                    type="button"
                    onClick={() => handleModeChange("signup")}
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
                onClick={() => handleModeChange("signin")}
                className="text-muted-foreground hover:text-amber"
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => handleModeChange("signin")}
                className="text-muted-foreground hover:text-amber"
              >
                Back to sign in
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <Link to="/" className="inline-flex items-center gap-1.5 hover:text-amber">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </Link>
            <a
              href="mailto:Productcreator11@zohomail.in"
              className="inline-flex items-center gap-1.5 hover:text-amber"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              Need help?
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
