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
      if (/forbidden/i.test(msg)) setState("forbidden");
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
    nav({ to: "/auth" });
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
                Only names and presence are shown — values are never exposed.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {report.env.map((e) => (
                  <li
                    key={e.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="truncate font-mono text-xs">{e.name}</span>
                    <StatusPill
                      ok={e.present}
                      label={e.present ? "Set" : e.required ? "Missing" : "Not set"}
                      muted={!e.required && !e.present}
                    />
                  </li>
                ))}
              </ul>
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
