import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

type Captcha = { a: number; b: number; op: "+" | "-"; answer: number };
function makeCaptcha(): Captcha {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const op: "+" | "-" = Math.random() > 0.5 ? "+" : "-";
  const [x, y] = op === "-" && b > a ? [b, a] : [a, b];
  return { a: x, b: y, op, answer: op === "+" ? x + y : x - y };
}

type Attempt = { email: string; at: number };
function readAttempts(key: string): Attempt[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const now = Date.now();
    return (JSON.parse(raw) as Attempt[]).filter((a) => now - a.at < 60 * 60 * 1000);
  } catch {
    return [];
  }
}
function writeAttempts(key: string, list: Attempt[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
}


function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<{ code: string; title: string; message: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [resendEmail, setResendEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendErr, setResendErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Simple math captcha to block automated abuse.
  const [captcha, setCaptcha] = useState(() => makeCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  // Track send attempts to enforce a client-side rate limit per email.
  const RESEND_COOLDOWN_S = 60;
  const MAX_PER_HOUR = 3;
  const RL_KEY = "rp_resend_attempts_v1";

  useEffect(() => {
    // Supabase surfaces recovery-link errors (expired/invalid) via the URL hash.
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const errCode = params.get("error_code") || params.get("error");
      const desc = (params.get("error_description") || "").replace(/\+/g, " ");
      if (errCode) {
        let title = "This recovery link isn't valid";
        let message = desc || "The link couldn't be verified. Request a fresh one below.";
        if (/expired|otp_expired/i.test(errCode) || /expired/i.test(desc)) {
          title = "Your reset link has expired";
          message = "Reset links are valid for 60 minutes. Request a new one to continue.";
        } else if (/access_denied/i.test(errCode)) {
          title = "This link can't be used";
          message = "It may have already been used or was opened on a different device. Request a fresh one.";
        } else if (/invalid/i.test(errCode) || /invalid/i.test(desc)) {
          title = "This reset link is invalid";
          message = "The link is malformed or has been revoked. Request a new one below.";
        }
        setLinkError({ code: errCode, title, message });
      }
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setLinkError(null);
      }
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      nav({ to: "/admin" });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, nav]);

  async function onResend(e: React.FormEvent) {
    e.preventDefault();
    setResendErr(null);
    setResendMsg(null);
    const email = resendEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setResendErr("Enter a valid email address.");
    }
    if (Number(captchaAnswer) !== captcha.answer) {
      setCaptcha(makeCaptcha());
      setCaptchaAnswer("");
      return setResendErr("Captcha answer is incorrect. Try the new one.");
    }
    const attempts = readAttempts(RL_KEY);
    const forEmail = attempts.filter((a) => a.email === email);
    if (forEmail.length >= MAX_PER_HOUR) {
      const nextAt = Math.min(...forEmail.map((a) => a.at)) + 60 * 60 * 1000;
      const mins = Math.max(1, Math.ceil((nextAt - Date.now()) / 60000));
      return setResendErr(
        `Too many requests for this email. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
      );
    }
    setResendBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      writeAttempts(RL_KEY, [...attempts, { email, at: Date.now() }]);
      setResendMsg("If an account exists for that email, a new reset link has been sent.");
      setCooldown(RESEND_COOLDOWN_S);
      setCaptcha(makeCaptcha());
      setCaptchaAnswer("");
    } catch (e) {
      setResendErr(e instanceof Error ? e.message : String(e));
      setCaptcha(makeCaptcha());
      setCaptchaAnswer("");
    } finally {
      setResendBusy(false);
    }
  }



  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 1) return setErr("Password is required.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <PageShell>
        <section className="mx-auto max-w-md px-5 pt-32 pb-24">
          <div className="rounded-2xl border border-amber/40 bg-card/70 p-8 text-center shadow-gold backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber/50 bg-amber/10 shadow-gold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-amber"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl">Password updated</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your password has been changed successfully. You can now sign in with your new
              password.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Redirecting to admin in {countdown}s
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/admin"
                className="h-12 flex-1 inline-flex items-center justify-center rounded-full bg-amber font-medium text-amber-foreground shadow-gold"
              >
                Go to admin
              </Link>
              <Link
                to="/auth"
                className="h-12 flex-1 inline-flex items-center justify-center rounded-full border border-border bg-background font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    );
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
            <button
              type="submit"
              disabled={busy || !ready}
              className="h-12 w-full rounded-full bg-amber font-medium text-amber-foreground shadow-gold disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>

          {!ready && (
            <div className="mt-8 border-t border-border pt-6">
              {linkError && (
                <p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {linkError}
                </p>
              )}
              <h2 className="text-sm font-semibold">Link expired or missing?</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your email and we'll send a fresh reset link.
              </p>
              {cooldown > 0 && (
                <div
                  role="timer"
                  aria-live="polite"
                  className="mt-4 flex items-center justify-between rounded-lg border border-amber/40 bg-amber/10 px-4 py-3"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Next resend available in
                    </p>
                    <p className="mt-0.5 font-display text-2xl tabular-nums text-amber">
                      {String(Math.floor(cooldown / 60)).padStart(2, "0")}:
                      {String(cooldown % 60).padStart(2, "0")}
                    </p>
                  </div>
                  <div
                    className="relative h-10 w-10"
                    aria-hidden="true"
                    style={{
                      background: `conic-gradient(hsl(var(--amber)) ${(cooldown / RESEND_COOLDOWN_S) * 360}deg, hsl(var(--border)) 0deg)`,
                      borderRadius: "9999px",
                    }}
                  >
                    <div className="absolute inset-1 rounded-full bg-card" />
                  </div>
                </div>
              )}
              <form onSubmit={onResend} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
                />
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Verify you're human — what is {captcha.a} {captcha.op} {captcha.b}?
                  </span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="-?[0-9]*"
                      required
                      autoComplete="off"
                      placeholder="Answer"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCaptcha(makeCaptcha());
                        setCaptchaAnswer("");
                      }}
                      className="h-12 shrink-0 rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground"
                      aria-label="Refresh captcha"
                    >
                      ↻
                    </button>
                  </div>
                </label>
                {resendErr && (
                  <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {resendErr}
                  </p>
                )}
                {resendMsg && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/15">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-emerald-200">Reset link sent</p>
                        <p className="mt-0.5 text-xs text-emerald-100/80">{resendMsg}</p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <li>• Check your inbox for <span className="text-foreground">{resendEmail.trim().toLowerCase()}</span></li>
                          <li>• Look in Spam or Promotions if you don't see it in 1–2 minutes</li>
                          <li>• The link expires in 60 minutes — open it on this device</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resendBusy || cooldown > 0}
                  className="h-12 w-full rounded-full border border-amber/60 bg-background font-medium text-amber disabled:opacity-60"
                >
                  {resendBusy
                    ? "Sending…"
                    : cooldown > 0
                      ? `Resend link (${cooldown}s)`
                      : "Resend reset link"}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

