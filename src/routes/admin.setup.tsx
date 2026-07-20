import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapSuperAdmin, hasSuperAdmin } from "@/lib/admins.functions";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/setup")({
  head: () => ({
    meta: [
      { title: "First-time Admin Setup" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SetupPage,
});

type FieldErrors = Partial<Record<"fullName" | "email" | "mobile" | "password" | "confirm" | "setupToken", string>>;

function SetupPage() {
  const navigate = useNavigate();
  const check = useServerFn(hasSuperAdmin);
  const bootstrap = useServerFn(bootstrapSuperAdmin);
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirm: "",
    setupToken: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await check();
        if (!mounted) return;
        if (r.exists) {
          // Setup is permanently disabled once a super admin exists.
          navigate({ to: "/admin/login", replace: true });
          return;
        }
        setAvailable(true);
      } catch {
        // If the check itself failed, allow the form to render so the user
        // can still try; the server will re-guard on submit.
        setAvailable(true);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, [check, navigate]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (form.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (form.mobile.trim().replace(/\D/g, "").length < 6) e.mobile = "Enter a valid mobile number.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      e.password = "Include at least one letter and one number.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await bootstrap({
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          password: form.password,
        },
      });
      // Auto sign-in with the credentials we just created.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (signInErr) {
        toast.success("Super Admin created. Please sign in.");
        navigate({ to: "/admin/login", replace: true });
        return;
      }
      toast.success("Welcome, Super Admin.");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Setup failed. Please try again.";
      if (/already exists/i.test(msg)) {
        toast.error("Super Admin already exists. Redirecting to sign in.");
        navigate({ to: "/admin/login", replace: true });
        return;
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!available) return <div className="min-h-dvh bg-background" />;

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-5 inline-flex min-h-10 items-center text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
        >
          ← Back to site
        </Link>
        <div className="rounded-lg border border-amber/40 bg-card p-5 sm:p-8 shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber" aria-hidden />
            <h1 className="font-display text-2xl text-foreground">Create Super Admin</h1>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This one-time setup creates the first Super Admin. It will be permanently
            disabled once the account is created.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            <Field label="Full Name" error={errors.fullName}>
              <input
                type="text"
                autoComplete="name"
                required
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={fieldCls(!!errors.fullName)}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="off"
                autoComplete="email"
                spellCheck={false}
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={fieldCls(!!errors.email)}
              />
            </Field>
            <Field label="Mobile Number" error={errors.mobile}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="+91 98xxxxxxxx"
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                className={fieldCls(!!errors.mobile)}
              />
            </Field>
            <Field label="Password" error={errors.password} hint="Min 8 chars, letters + numbers.">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className={fieldCls(!!errors.password)}
              />
            </Field>
            <Field label="Confirm Password" error={errors.confirm}>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                className={fieldCls(!!errors.confirm)}
              />
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-12 rounded-sm font-semibold uppercase tracking-[0.14em] text-sm disabled:opacity-60 inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Creating…" : "Create Super Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function fieldCls(hasError: boolean) {
  return `mt-1 w-full min-h-12 rounded-sm border ${
    hasError ? "border-destructive" : "border-border"
  } bg-background px-3 text-base sm:text-sm text-foreground outline-none focus:border-amber`;
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
