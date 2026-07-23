import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  KeyRound,
  Activity,
  ShieldCheck,
  Database,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import {
  getAdminDiagnostics,
  type DiagnosticsReport,
} from "@/lib/admin-diagnostics.functions";

export const Route = createFileRoute("/admin/diagnostics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Diagnostics — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const nav = useNavigate();
  const fetchFn = useServerFn(getAdminDiagnostics);
  const [state, setState] = useState<"loading" | "unauth" | "forbidden" | "ok" | "error">(
    "loading",
  );
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setState("unauth");
        return;
      }
      const r = await fetchFn();
      setReport(r);
      setState("ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/unauthorized|authorization|jwt|session|auth/i.test(msg)) setState("unauth");
      else if (/forbidden/i.test(msg)) setState("forbidden");
      else {
        setError(msg);
        setState("error");
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (state === "unauth") {
    nav({ to: "/admin/login", replace: true });
    return null;
  }

  if (state === "forbidden") {
    return (
      <PageShell>
        <section className="mx-auto max-w-2xl px-5 pt-32 pb-20 text-center">
          <h1 className="font-display text-3xl">Admins only</h1>
          <p className="mt-2 text-muted-foreground">This page is restricted to administrators.</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full border border-border px-5 py-2 text-sm hover:border-amber"
          >
            Go to home
          </Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber">Admin console</p>
            <h1 className="mt-1 font-display text-2xl sm:text-4xl">Diagnostics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live backend, environment and route health for quick self-troubleshooting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs hover:border-amber sm:px-4 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              onClick={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full bg-amber px-3 py-2 text-xs font-medium text-amber-foreground shadow-gold disabled:opacity-60 sm:px-4 sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </header>

        {state === "error" && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error ?? "Failed to load diagnostics."}
          </div>
        )}

        {report && (
          <div className="mt-8 space-y-6">
            <Section icon={ShieldCheck} title="Auth">
              <KV label="Signed in as" value={report.auth.email ?? "(no email)"} />
              <KV label="User ID" value={report.auth.userId} mono />
              <KV label="Admin" value={report.auth.isAdmin ? "Yes" : "No"} good={report.auth.isAdmin} />
              <KV label="Total admins" value={String(report.auth.adminCount)} />
            </Section>

            <Section icon={Database} title="Database">
              <KV
                label="Reachable"
                value={report.db.reachable ? "Yes" : "No"}
                good={report.db.reachable}
              />
              {report.db.error && <KV label="Error" value={report.db.error} bad />}
              {report.db.appSettings && (
                <>
                  <KV
                    label="Spreadsheet URL"
                    value={report.db.appSettings.sheetUrlConfigured ? "Configured" : "Not set"}
                    good={report.db.appSettings.sheetUrlConfigured}
                  />
                  <KV
                    label="Site status"
                    value={report.db.appSettings.siteOnline ? "Online" : "Offline"}
                    good={report.db.appSettings.siteOnline}
                  />
                </>
              )}
            </Section>

            <Section icon={KeyRound} title="Environment variables">
              <p className="mb-3 text-xs text-muted-foreground">
                Only names and presence are shown — values are never exposed. Expand a row
                for its purpose and a copyable remediation step.
              </p>
              <EnvTable rows={report.env} />
            </Section>


            <Section icon={Activity} title="Route health">
              <p className="mb-3 text-xs text-muted-foreground">
                Live checks against <span className="font-mono">{report.origin}</span>.
              </p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {report.routes.map((r) => (
                  <li
                    key={r.path}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{r.label}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {r.path}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{r.ms} ms</span>
                      <StatusPill
                        ok={r.ok}
                        label={
                          r.status !== null ? `HTTP ${r.status}` : r.error ?? "no response"
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <DeploymentHealthSection />

            <Section icon={Server} title="Meta">
              <KV label="Generated" value={new Date(report.generatedAt).toLocaleString()} />
              <KV label="Origin" value={report.origin} mono />
            </Section>

          </div>
        )}
      </section>
    </PageShell>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-amber/40 bg-amber/10 text-amber">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KV({
  label,
  value,
  mono,
  good,
  bad,
}: {
  label: string;
  value: string;
  mono?: boolean;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 py-1.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`truncate text-right ${mono ? "font-mono text-xs" : ""} ${
          good ? "text-emerald-400" : bad ? "text-red-400" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusPill({ ok, label, muted }: { ok: boolean; label: string; muted?: boolean }) {
  const cls = muted
    ? "border-border bg-background/40 text-muted-foreground"
    : ok
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-red-500/40 bg-red-500/10 text-red-300";
  const Icon = muted ? null : ok ? CheckCircle2 : XCircle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${cls}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />} {label}
    </span>
  );
}

function EnvTable({
  rows,
}: {
  rows: DiagnosticsReport["env"];
}) {
  const [openName, setOpenName] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const missingRequired = rows.filter((r) => r.required && !r.present);

  const copy = async (name: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedName(name);
      setTimeout(() => setCopiedName((n) => (n === name ? null : n)), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const statusLabel = (r: DiagnosticsReport["env"][number]) =>
    r.present ? "Set" : r.required ? "Missing" : "Not set";

  return (
    <div className="space-y-3">
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {missingRequired.length} required variable
            {missingRequired.length === 1 ? "" : "s"} missing. Expand{" "}
            {missingRequired.map((r, i) => (
              <span key={r.name}>
                <span className="font-mono">{r.name}</span>
                {i < missingRequired.length - 1 ? ", " : ""}
              </span>
            ))}{" "}
            below for the fix.
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border bg-background/40 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Variable</span>
          <span className="hidden sm:inline">Required</span>
          <span>Status</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const isOpen = openName === r.name;
            const isMissingRequired = r.required && !r.present;
            return (
              <li key={r.name}>
                <button
                  type="button"
                  onClick={() => setOpenName(isOpen ? null : r.name)}
                  className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-background/40"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0 truncate font-mono text-xs sm:text-sm">
                    {r.name}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {r.required ? "Required" : "Optional"}
                  </span>
                  <StatusPill
                    ok={r.present}
                    label={statusLabel(r)}
                    muted={!r.required && !r.present}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border/60 bg-background/30 px-3 py-3 text-sm">
                    <p className="text-muted-foreground">{r.purpose}</p>
                    {isMissingRequired || !r.present ? (
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-wider text-amber">
                            {isMissingRequired ? "Fix this" : "How to set it"}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(r.name, r.remediation)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] hover:border-amber"
                          >
                            {copiedName === r.name ? (
                              <>
                                <Check className="h-3 w-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy steps
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap rounded-md border border-border bg-background/60 p-3 text-xs leading-relaxed text-foreground/90">
                          {r.remediation}
                        </pre>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-emerald-300/80">
                        ✓ Currently set. No action needed.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

