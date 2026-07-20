import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitAdminRequest } from "@/lib/admins.functions";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/request")({
  head: () => ({
    meta: [
      { title: "Request Admin Access" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const submit = useServerFn(submitAdminRequest);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirm: "",
    reason: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await submit({
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
          reason: form.reason.trim(),
        },
      });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-amber/40 bg-card p-6 sm:p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-amber" />
          <h1 className="font-display text-2xl mt-4">Request submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your admin access request is <strong className="text-foreground">pending approval</strong>.
            You'll be able to sign in once a Super Admin approves your account.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => navigate({ to: "/admin/login" })}
              className="min-h-12 rounded-sm font-semibold uppercase tracking-[0.14em] text-sm"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              Go to sign in
            </button>
            <Link to="/" className="min-h-11 text-xs text-muted-foreground hover:text-foreground text-center inline-flex items-center justify-center">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <Link to="/admin/login" className="mb-5 inline-flex min-h-10 items-center text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          ← Back to login
        </Link>
        <div className="rounded-lg border border-border bg-card p-5 sm:p-8 shadow-lg">
          <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Admin Portal</div>
          <h1 className="font-display text-2xl mt-1">Request Admin Access</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Fill out the form. A Super Admin will review your request.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <Field label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} autoComplete="name" required />
            <Field label="Email Address" type="email" value={form.email} onChange={(v) => set("email", v)} autoComplete="email" required />
            <Field label="Mobile Number" type="tel" inputMode="tel" value={form.mobile} onChange={(v) => set("mobile", v)} autoComplete="tel" required />
            <Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} autoComplete="new-password" required minLength={8} />
            <Field label="Confirm Password" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} autoComplete="new-password" required minLength={8} />
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Reason for Access</span>
              <textarea
                required
                minLength={10}
                maxLength={1000}
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-base sm:text-sm text-foreground outline-none focus:border-amber"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-12 rounded-sm font-semibold uppercase tracking-[0.14em] text-sm disabled:opacity-60"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              {busy ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, minLength, autoComplete, inputMode,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; minLength?: number; autoComplete?: string; inputMode?: any;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-h-12 rounded-sm border border-border bg-background px-3 text-base sm:text-sm text-foreground outline-none focus:border-amber"
      />
    </label>
  );
}
