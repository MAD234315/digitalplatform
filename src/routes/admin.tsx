import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Images,
  Settings2,
  Sparkles,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Download,
  X,
  Calendar,
  Check,
  Lock,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Menu,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import {
  getMyRole,
  claimFirstAdmin,
  getAppSettings,
  updateSheetUrl,
  revokeSheetUrl,
  previewSheetUrl,
  checkGoogleSheetUrl,
  listSpreadsheetAudit,
  exportSpreadsheetAudit,
  listAllProofs,
  upsertProof,
  deleteProof,
  setProofPublished,
  bulkCreateProofs,
  listAdmins,
  grantAdminByEmail,
  revokeAdmin,
  getSiteStatus,
  setSiteOnline,
  type ProofRecord,
  type AdminUser,
  type SheetPreview,
  type SpreadsheetAuditEntry,
} from "@/lib/admin.functions";


export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Digital Platform" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "spreadsheet" | "proofs" | "admins" | "website" | "future";

const NAV: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, hint: "Dashboard summary" },
  { id: "spreadsheet", label: "Spreadsheet", icon: FileSpreadsheet, hint: "Catalogue data source" },
  { id: "proofs", label: "Proof Gallery", icon: Images, hint: "Manage delivery proofs" },
  { id: "admins", label: "Admins", icon: ShieldCheck, hint: "Grant or revoke access" },
  { id: "website", label: "Website Settings", icon: Settings2, hint: "Site preferences" },
  { id: "future", label: "Future Modules", icon: Sparkles, hint: "Coming soon" },
];

function AdminPage() {
  const nav = useNavigate();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "unauth" | "not-admin" | "ok">("loading");
  const [tab, setTab] = useState<Tab>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchRole = useServerFn(getMyRole);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (alive) setStatus("unauth");
        return;
      }
      try {
        const role = await fetchRole();
        if (!alive) return;
        setStatus(role.isAdmin ? "ok" : "not-admin");
      } catch {
        if (alive) setStatus("not-admin");
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchRole]);

  if (status === "loading")
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  if (status === "unauth") {
    nav({ to: "/auth" });
    return null;
  }

  if (status === "not-admin") {
    return (
      <PageShell>
        <section className="mx-auto max-w-2xl px-5 pt-32 pb-20">
          <div className="rounded-3xl border border-amber/40 bg-gradient-to-b from-black/60 to-black/30 p-10 text-center shadow-gold backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber/50 bg-amber/10 text-amber">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-display text-3xl">Access denied</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              This area is reserved for administrators. You&apos;ll be redirected to the home page shortly.
            </p>
            {canClaim && (
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-amber/30 bg-amber/5 p-5 text-left">
                <p className="text-sm text-muted-foreground">
                  No admin has been created yet. If this is your site, claim the first admin role now.
                </p>
                <button
                  onClick={async () => {
                    setClaiming(true);
                    setClaimMsg(null);
                    try {
                      const r = await claimFn();
                      if (r.claimed) setStatus("ok");
                      else setClaimMsg("An admin already exists. Ask them to grant you access.");
                    } catch (e) {
                      setClaimMsg(e instanceof Error ? e.message : "Could not claim admin.");
                    } finally {
                      setClaiming(false);
                    }
                  }}
                  disabled={claiming}
                  className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground shadow-gold disabled:opacity-60"
                >
                  {claiming ? "Working…" : "Claim first admin"}
                </button>
                {claimMsg && <p className="mt-3 text-sm">{claimMsg}</p>}
              </div>
            )}
            <button
              onClick={() => nav({ to: "/" })}
              className="mt-6 rounded-full border border-border px-5 py-2 text-sm hover:border-amber"
            >
              Go to home
            </button>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-24 sm:pb-20">
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber">Admin console</p>
            <h1 className="mt-1 font-display text-2xl sm:text-4xl">Dashboard</h1>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              Manage catalogue data, proof gallery and site settings.
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.invalidate();
              nav({ to: "/" });
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs sm:px-4 sm:text-sm hover:border-amber"
          >
            <LogOut className="h-4 w-4" /> <span className="whitespace-nowrap">Sign out</span>
          </button>
        </header>


        {/* Layout: sidebar + content */}
        <div className="mt-6 grid gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-[240px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
            <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card/60 p-2 backdrop-blur">
              {NAV.map((n) => {
                const active = tab === n.id;
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => setTab(n.id)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-amber/15 text-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--amber)_45%,transparent)]"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                        active
                          ? "border-amber/50 bg-amber/15 text-amber"
                          : "border-border bg-background/60 text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="font-medium">{n.label}</span>
                      <span className="text-[11px] text-muted-foreground">{n.hint}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile section bar (hamburger) */}
          <MobileSectionBar
            tab={tab}
            onOpen={() => setDrawerOpen(true)}
          />

          <div className="min-w-0">
            {tab === "overview" && <OverviewPanel onNavigate={setTab} />}
            {tab === "spreadsheet" && <SpreadsheetPanel />}
            {tab === "proofs" && <ProofsPanel />}
            {tab === "admins" && <AdminsPanel />}
            {tab === "website" && <WebsitePanel />}
            {tab === "future" && <FuturePanel />}
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {drawerOpen && (
          <MobileNavDrawer
            tab={tab}
            onSelect={(t) => {
              setTab(t);
              setDrawerOpen(false);
            }}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </section>
    </PageShell>
  );
}

function MobileSectionBar({ tab, onOpen }: { tab: Tab; onOpen: () => void }) {
  const cur = NAV.find((n) => n.id === tab) ?? NAV[0];
  const Icon = cur.icon;
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber/30 bg-gradient-to-b from-card/80 to-card/40 p-3 shadow-gold backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber/40 bg-amber/10 text-amber">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Section</p>
            <p className="truncate font-display text-base">{cur.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open admin menu"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-2 text-xs font-medium text-amber active:scale-[0.98]"
        >
          <Menu className="h-4 w-4" /> Menu
        </button>
      </div>
    </div>
  );
}

function MobileNavDrawer({
  tab,
  onSelect,
  onClose,
}: {
  tab: Tab;
  onSelect: (t: Tab) => void;
  onClose: () => void;
}) {
  // Lock scroll while drawer is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]"
      />
      <aside
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto border-r border-amber/30 bg-background shadow-gold"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-amber">Admin</p>
            <p className="font-display text-lg leading-tight">Navigation</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-amber"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV.map((n) => {
            const active = tab === n.id;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => onSelect(n.id)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  active
                    ? "bg-amber/15 text-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--amber)_45%,transparent)]"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${
                    active
                      ? "border-amber/50 bg-amber/15 text-amber"
                      : "border-border bg-background/60 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="font-medium">{n.label}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{n.hint}</span>
                </span>
                <ChevronRight className={`h-4 w-4 shrink-0 ${active ? "text-amber" : "text-muted-foreground/70"}`} />
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber border-t-transparent" />
    </div>
  );
}

// ============ OVERVIEW ============

function OverviewPanel({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const listFn = useServerFn(listAllProofs);
  const getSettings = useServerFn(getAppSettings);
  const [proofCount, setProofCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [sheetUpdated, setSheetUpdated] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [proofs, settings] = await Promise.all([listFn(), getSettings()]);
        setProofCount(proofs.length);
        setPublishedCount(proofs.filter((p) => p.published).length);
        setSheetUpdated(settings.updatedAt);
      } catch {
        // ignore
      }
    })();
  }, [listFn, getSettings]);

  const cards = [
    {
      label: "Total proofs",
      value: proofCount,
      hint: publishedCount !== null ? `${publishedCount} published` : "—",
      icon: Images,
      tab: "proofs" as Tab,
    },
    {
      label: "Spreadsheet",
      value: sheetUpdated ? "Connected" : "—",
      hint: sheetUpdated ? `Updated ${new Date(sheetUpdated).toLocaleDateString()}` : "Not configured",
      icon: FileSpreadsheet,
      tab: "spreadsheet" as Tab,
    },
    {
      label: "Website",
      value: "Live",
      hint: "Theme & metadata",
      icon: Settings2,
      tab: "website" as Tab,
    },
  ];

  return (
    <div className="space-y-6">
      <PremiumCard>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A quick snapshot of the marketplace. Jump into any module to make changes.
            </p>
          </div>
          <button
            onClick={() => onNavigate("proofs")}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber px-3 py-2 text-xs font-medium text-amber-foreground shadow-gold sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4" /> <span className="whitespace-nowrap">New proof</span>
          </button>
        </div>
      </PremiumCard>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.tab)}
            className="group rounded-2xl border border-border bg-card/60 p-5 text-left transition hover:-translate-y-0.5 hover:border-amber/50 hover:shadow-gold"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {c.label}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-amber/40 bg-amber/10 text-amber">
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 font-display text-3xl">{c.value ?? "…"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PremiumCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-amber/30 bg-gradient-to-b from-card/80 to-card/40 p-4 shadow-gold backdrop-blur sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

// ============ SPREADSHEET PANEL ============

function SpreadsheetPanel() {
  const getSettings = useServerFn(getAppSettings);
  const saveUrl = useServerFn(updateSheetUrl);
  const revokeUrl = useServerFn(revokeSheetUrl);
  const previewFn = useServerFn(previewSheetUrl);
  const [current, setCurrent] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<SheetPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewedFor, setPreviewedFor] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const s = await getSettings();
        setCurrent(s.sheetUrl);
        setInput(s.sheetUrl);
        setUpdatedAt(s.updatedAt);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load settings");
      }
    })();
  }, [getSettings]);

  const trimmedInput = input.trim();
  const validation = useMemo(
    () => (trimmedInput ? checkGoogleSheetUrl(trimmedInput) : null),
    [trimmedInput],
  );
  const isValid = validation?.ok === true;
  const validationError = validation && !validation.ok ? validation.error : null;
  const normalizedInput = validation?.ok ? validation.normalized : "";

  async function onPreview() {
    if (!trimmedInput) return;
    if (!isValid) {
      setPreview(null);
      setPreviewError(validationError ?? "Invalid Google Sheet URL.");
      return;
    }
    setPreviewing(true);
    setPreviewError(null);
    try {
      const p = await previewFn({ data: { sheetUrl: trimmedInput } });
      setPreview(p);
      setPreviewedFor(trimmedInput);
    } catch (e) {
      setPreview(null);
      setPreviewError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmedInput) {
      toast.error("Spreadsheet URL is required.");
      return;
    }
    if (!isValid) {
      toast.error(validationError ?? "Invalid Google Sheet URL.");
      return;
    }
    setBusy(true);
    try {
      const r = await saveUrl({ data: { sheetUrl: trimmedInput } });
      const saved = r.sheetUrl ?? normalizedInput;
      setCurrent(saved);
      setInput(saved);
      setUpdatedAt(new Date().toISOString());
      toast.success("Spreadsheet URL updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke() {
    setConfirmRevoke(false);
    if (!current) {
      toast.error("There is no active spreadsheet URL to revoke.");
      return;
    }
    setRevoking(true);
    try {
      await revokeUrl();
      setCurrent("");
      setInput("");
      setPreview(null);
      setPreviewedFor("");
      setPreviewError(null);
      setUpdatedAt(new Date().toISOString());
      toast.success("Spreadsheet URL revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setRevoking(false);
    }
  }

  const previewStale = preview !== null && previewedFor !== trimmedInput;





  return (
    <PremiumCard>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber/40 bg-amber/10 text-amber">
          <FileSpreadsheet className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl">Spreadsheet Configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The catalogue is loaded from this Google Sheet. Changes take effect within about a minute.
          </p>
        </div>
      </div>


      <div className="mt-6 rounded-xl border border-border bg-background/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Current URL</p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              current
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${current ? "bg-emerald-400" : "bg-red-400"}`}
            />
            {current ? "Active" : "No active URL"}
          </span>
        </div>
        <p className="mt-2 break-all text-sm">
          {current || <span className="text-muted-foreground">(not set)</span>}
        </p>
        {updatedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Updated {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={onSave} className="mt-6 space-y-3" noValidate>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            New spreadsheet URL
          </span>
          <input
            type="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…/edit"
            aria-invalid={validationError ? true : undefined}
            aria-describedby="sheet-url-hint"
            className={`mt-1 h-12 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-amber ${
              validationError
                ? "border-red-500/60 focus:border-red-500"
                : isValid
                  ? "border-emerald-500/50 focus:border-emerald-400"
                  : "border-border"
            }`}
          />
          <p
            id="sheet-url-hint"
            className={`mt-1.5 min-h-[1.25rem] text-xs ${
              validationError
                ? "text-red-300"
                : isValid
                  ? "text-emerald-300"
                  : "text-muted-foreground"
            }`}
          >
            {validationError
              ? validationError
              : isValid
                ? normalizedInput === trimmedInput
                  ? "Looks valid — link is normalized."
                  : `Will be saved as: ${normalizedInput}`
                : "Paste the full Google Sheets URL — e.g. https://docs.google.com/spreadsheets/d/{ID}/edit"}
          </p>
        </label>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onPreview}
            disabled={previewing || !isValid}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber/50 bg-amber/10 px-5 py-2.5 text-sm font-medium text-amber transition hover:bg-amber/20 disabled:opacity-50 sm:w-auto"
            title={!trimmedInput ? "Enter a URL first" : !isValid ? validationError ?? "Fix the URL to preview" : "Preview the sheet"}
          >
            <Eye className="h-4 w-4" /> {previewing ? "Loading preview…" : "Preview sheet"}
          </button>
          <button
            type="submit"
            disabled={busy || !isValid || normalizedInput === current}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-2.5 text-sm font-medium text-amber-foreground shadow-gold disabled:opacity-50 sm:w-auto"
            title={
              !trimmedInput
                ? "Enter a URL first"
                : !isValid
                  ? validationError ?? "Fix the URL to save"
                  : normalizedInput === current
                    ? "This URL is already saved"
                    : "Save changes"
            }
          >
            <Check className="h-4 w-4" /> {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmRevoke(true)}
            disabled={revoking || !current}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50 sm:ml-auto sm:w-auto"
            title={current ? "Clear the current spreadsheet URL" : "No active URL to revoke"}
          >
            <Trash2 className="h-4 w-4" /> {revoking ? "Revoking…" : "Revoke URL"}
          </button>
        </div>

      </form>


      {confirmRevoke && (
        <ConfirmDialog
          title="Revoke spreadsheet URL?"
          message="This clears the current Google Sheet from settings and records an audit entry. The catalogue will stop loading until a new URL is saved."
          confirmLabel="Revoke"
          destructive
          onCancel={() => setConfirmRevoke(false)}
          onConfirm={onRevoke}
        />
      )}

      {previewError && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {previewError}
        </div>
      )}

      {preview && (
        <div className="mt-6 rounded-xl border border-amber/30 bg-background/60 p-4">
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-baseline sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Preview {previewStale && <span className="ml-1 text-amber">(URL changed — re-preview)</span>}
              </p>
              <p className="mt-1 break-words font-display text-lg">{preview.sheetName}</p>
              <p className="text-xs text-muted-foreground">
                First tab · showing {preview.totalRowsShown} of the first rows · {preview.headers.length} columns
              </p>
            </div>
            <span className="inline-flex w-fit shrink-0 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber">
              Not saved yet
            </span>
          </div>


          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-amber/10 text-amber">
                <tr>
                  {preview.headers.map((h, i) => (
                    <th key={i} className="whitespace-nowrap px-3 py-2 font-medium">
                      {h || <span className="opacity-50">col {i + 1}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border/60 odd:bg-background/40">
                    {preview.headers.map((_, c) => (
                      <td key={c} className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {row[c] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.rows.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-muted-foreground" colSpan={preview.headers.length || 1}>
                      No data rows below the header.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SpreadsheetAuditLog refreshKey={updatedAt ?? ""} />
    </PremiumCard>
  );
}

function SpreadsheetAuditLog({ refreshKey }: { refreshKey: string }) {
  const fetchAudit = useServerFn(listSpreadsheetAudit);
  const fetchExport = useServerFn(exportSpreadsheetAudit);
  const [entries, setEntries] = useState<SpreadsheetAuditEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [qAdmin, setQAdmin] = useState("");
  const [qAdminDebounced, setQAdminDebounced] = useState("");
  const [qAction, setQAction] = useState<"all" | "set" | "update" | "revoke">("all");
  const [qFrom, setQFrom] = useState("");
  const [qTo, setQTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce the admin search input
  useEffect(() => {
    const t = setTimeout(() => setQAdminDebounced(qAdmin.trim()), 300);
    return () => clearTimeout(t);
  }, [qAdmin]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [qAdminDebounced, qAction, qFrom, qTo, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetchAudit({
          data: {
            page,
            pageSize,
            search: qAdminDebounced,
            action: qAction,
            from: qFrom || undefined,
            to: qTo || undefined,
          },
        });
        if (!cancelled) {
          setEntries(res.rows);
          setTotal(res.total);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load audit log");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchAudit, refreshKey, page, pageSize, qAdminDebounced, qAction, qFrom, qTo]);

  const hasFilters =
    qAdmin.trim() !== "" || qAction !== "all" || qFrom !== "" || qTo !== "";

  function resetFilters() {
    setQAdmin("");
    setQAction("all");
    setQFrom("");
    setQTo("");
  }

  async function onExport() {
    try {
      setExporting(true);
      const rows = await fetchExport({
        data: {
          search: qAdminDebounced,
          action: qAction,
          from: qFrom || undefined,
          to: qTo || undefined,
        },
      });
      if (rows.length === 0) {
        toast.error("Nothing to export");
        return;
      }
      const esc = (v: string | null | undefined) => {
        const s = v == null ? "" : String(v);
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = ["created_at", "action", "actor_email", "actor_id", "old_url", "new_url"];
      const lines = [header.join(",")];
      for (const e of rows) {
        lines.push([
          esc(e.createdAt),
          esc(e.action),
          esc(e.actorEmail),
          esc(e.actorId),
          esc(e.oldUrl),
          esc(e.newUrl),
        ].join(","));
      }
      const csv = "\ufeff" + lines.join("\r\n") + "\r\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `spreadsheet-url-audit-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);

  const inputCls =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-amber";

  return (
    <div className="mt-8 rounded-xl border border-border bg-background/60 p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber" />
          <p className="min-w-0 truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Audit trail
            <span className="ml-2 normal-case tracking-normal text-muted-foreground/80">
              {total > 0
                ? `(${rangeFrom}–${rangeTo} of ${total.toLocaleString()})`
                : loading
                ? "(loading…)"
                : "(0)"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || total === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber/50 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber transition hover:bg-amber/20 disabled:opacity-40 sm:ml-auto sm:px-4"
        >
          <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>


      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Search admin</span>
          <input
            type="search"
            value={qAdmin}
            onChange={(e) => setQAdmin(e.target.value)}
            placeholder="Email or actor ID"
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Action</span>
          <select
            value={qAction}
            onChange={(e) => setQAction(e.target.value as typeof qAction)}
            className={`${inputCls} mt-1`}
          >
            <option value="all">All actions</option>
            <option value="set">Set</option>
            <option value="update">Update</option>
            <option value="revoke">Revoke</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">From</span>
          <input
            type="date"
            value={qFrom}
            onChange={(e) => setQFrom(e.target.value)}
            max={qTo || undefined}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">To</span>
          <input
            type="date"
            value={qTo}
            onChange={(e) => setQTo(e.target.value)}
            min={qFrom || undefined}
            className={`${inputCls} mt-1`}
          />
        </label>
      </div>
      {hasFilters && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-amber hover:text-amber"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {!error && entries === null && loading && (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      )}
      {!error && entries && entries.length === 0 && !loading && (
        <p className="mt-3 text-sm text-muted-foreground">
          {hasFilters ? "No entries match the current filters." : "No changes recorded yet."}
        </p>
      )}
      {!error && entries && entries.length > 0 && (
        <>
        <div className="sticky top-16 z-10 -mx-4 mt-3 border-y border-border/60 bg-background/85 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:top-20 sm:hidden">
          <div className="flex items-center gap-x-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="w-16 shrink-0">Action</span>
            <span className="min-w-0 flex-1">Admin</span>
            <span className="shrink-0">When</span>
          </div>
        </div>
        <ul className={`mt-3 divide-y divide-border/60 ${loading ? "opacity-60" : ""}`}>

          {entries.map((e) => {
            const badge =
              e.action === "set"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                : e.action === "revoke"
                ? "border-red-400/40 bg-red-500/10 text-red-200"
                : "border-amber/40 bg-amber/10 text-amber";
            return (
              <li key={e.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${badge}`}
                  >
                    {e.action}
                  </span>
                  <span className="min-w-0 max-w-full truncate text-foreground">{e.actorEmail ?? "unknown admin"}</span>
                  {e.actorId && (
                    <span
                      className="shrink-0 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      title={e.actorId}
                    >
                      {e.actorId.slice(0, 8)}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    · {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="mt-1 grid gap-1 text-xs">
                  <div className="text-muted-foreground">
                    <span className="uppercase tracking-[0.15em] opacity-70">From: </span>
                    <span className="break-all">{e.oldUrl ?? "(not set)"}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="uppercase tracking-[0.15em] opacity-70">To: </span>
                    <span className="break-all text-foreground">{e.newUrl ?? "(cleared)"}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </>
      )}


      {total > 0 && (
        <div className="mt-4 grid gap-3 border-t border-border/60 pt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-amber"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground sm:gap-2">
            <span className="mr-1 shrink-0">
              Page <span className="text-foreground">{page}</span> of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={!canPrev || loading}
              aria-label="First page"
              className="rounded-md border border-border px-2 py-1 hover:border-amber hover:text-amber disabled:opacity-40"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev || loading}
              className="rounded-md border border-border px-2 py-1 hover:border-amber hover:text-amber disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext || loading}
              className="rounded-md border border-border px-2 py-1 hover:border-amber hover:text-amber disabled:opacity-40"
            >
              Next ›
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={!canNext || loading}
              aria-label="Last page"
              className="rounded-md border border-border px-2 py-1 hover:border-amber hover:text-amber disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      )}

    </div>
  );

}

// ============ WEBSITE PANEL ============

function WebsitePanel() {
  return (
    <div className="space-y-6">
      <WebsiteStatusCard />
      <PremiumCard>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber/40 bg-amber/10 text-amber">
            <Settings2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl">Website Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Theme, navigation and metadata are configured in code today. More toggles are coming here soon.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { k: "Theme", v: "Premium black & gold" },
            { k: "Nav items", v: "Home · Catalogue · Proofs · About · FAQ · Contact" },
            { k: "Domain", v: "previewhonest12.lovable.app" },
            { k: "Support", v: "WhatsApp — +91 96521 91369" },
          ].map((r) => (
            <div key={r.k} className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{r.k}</p>
              <p className="mt-1 text-sm">{r.v}</p>
            </div>
          ))}
        </div>
      </PremiumCard>
    </div>
  );
}

function WebsiteStatusCard() {
  const qc = useQueryClient();
  const getStatus = useServerFn(getSiteStatus);
  const setStatus = useServerFn(setSiteOnline);
  const [online, setOnline] = useState<boolean | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getStatus()
      .then((r) => {
        if (!alive) return;
        setOnline(r.online);
        setUpdatedAt(r.updatedAt);
      })
      .catch(() => alive && setOnline(true));
    return () => {
      alive = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  async function toggle(next: boolean) {
    if (busy || online === next) return;
    setBusy(true);
    const t = toast.loading(next ? "Bringing site online…" : "Switching site to offline…");
    try {
      const r = await setStatus({ data: { online: next } });
      setOnline(r.online);
      setUpdatedAt(new Date().toISOString());
      // Refresh the customer catalogue cache so visitors see the change quickly.
      qc.invalidateQueries({ queryKey: ["sheet-products"] });
      toast.success(next ? "Website is now Online" : "Website is now Offline", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status", { id: t });
    } finally {
      setBusy(false);
    }
  }

  const isOnline = online === true;
  const isLoading = online === null;

  return (
    <PremiumCard>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
              isOnline
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-amber/40 bg-amber/10 text-amber"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${
                  isOnline ? "bg-emerald-400" : "bg-amber"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  isOnline ? "bg-emerald-400" : "bg-amber"
                }`}
              />
            </span>
          </span>
          <div>
            <h2 className="font-display text-2xl">Website Status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Control whether the customer-facing catalogue is live. While offline,
              the spreadsheet is not scanned and visitors see a maintenance page.
              Admins keep full access to <span className="font-medium text-foreground">/admin</span>.
            </p>
            {updatedAt && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Last changed · {new Date(updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Website status"
          className="inline-flex shrink-0 rounded-full border border-border bg-background/60 p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={isOnline}
            disabled={busy || isLoading}
            onClick={() => toggle(true)}
            className={`inline-flex min-w-[110px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              isOnline
                ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            } disabled:opacity-50`}
          >
            <Eye className="h-4 w-4" /> Online
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={online === false}
            disabled={busy || isLoading}
            onClick={() => toggle(false)}
            className={`inline-flex min-w-[110px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              online === false
                ? "bg-amber/25 text-amber shadow-[0_0_0_1px_rgba(245,158,11,0.5)]"
                : "text-muted-foreground hover:text-foreground"
            } disabled:opacity-50`}
          >
            <EyeOff className="h-4 w-4" /> Offline
          </button>
        </div>
      </div>

      {online === false && (
        <div className="mt-6 rounded-xl border border-amber/40 bg-amber/10 p-4 text-sm text-amber">
          Site is currently <span className="font-semibold">Offline</span>. Visitors to the catalogue
          see a maintenance page and no spreadsheet requests are made.
        </div>
      )}
    </PremiumCard>
  );
}

// ============ ADMINS PANEL ============

function AdminsPanel() {
  const listFn = useServerFn(listAdmins);
  const grantFn = useServerFn(grantAdminByEmail);
  const revokeFn = useServerFn(revokeAdmin);
  const [items, setItems] = useState<AdminUser[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);

  async function refresh() {
    try {
      setItems(await listFn());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load admins");
    }
  }
  useEffect(() => {
    refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    const val = email.trim().toLowerCase();
    if (!val) return;
    setBusy(true);
    const t = toast.loading("Granting admin access…");
    try {
      const r = await grantFn({ data: { email: val } });
      toast.success(`${r.email} is now an admin`, { id: t });
      setEmail("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Grant failed", { id: t });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PremiumCard>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber/40 bg-amber/10 text-amber">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl">Admin Access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Promote a user by email address or revoke access. The user must have
              signed up on the site first.
            </p>
          </div>
        </div>

        <form onSubmit={onGrant} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Email address
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
              className="mt-1 h-12 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="inline-flex items-end justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-medium text-amber-foreground shadow-gold disabled:opacity-50 sm:mt-[22px] sm:h-12 sm:items-center sm:py-0"
          >
            <UserPlus className="h-4 w-4" />
            {busy ? "Granting…" : "Grant admin"}
          </button>
        </form>
      </PremiumCard>

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-display text-lg">Current admins</h3>
            <p className="text-xs text-muted-foreground">
              {items ? `${items.length} account${items.length === 1 ? "" : "s"}` : "Loading…"}
            </p>
          </div>
        </div>
        {!items ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No admins yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li
                key={a.userId}
                className="flex items-center gap-3 px-4 py-4 sm:px-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber/40 bg-amber/10 text-amber">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    <span className="min-w-0 max-w-full truncate">{a.email}</span>
                    {a.isSelf && (
                      <span className="shrink-0 rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Added {new Date(a.createdAt).toLocaleDateString()} ·{" "}
                    {a.lastSignInAt
                      ? `last sign-in ${new Date(a.lastSignInAt).toLocaleDateString()}`
                      : "never signed in"}
                  </p>
                </div>
                <button
                  onClick={() => setConfirm(a)}
                  disabled={a.isSelf}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title={a.isSelf ? "You can't revoke your own access" : "Revoke admin"}
                >
                  <UserMinus className="h-3 w-3" /> Revoke
                </button>
              </li>

            ))}
          </ul>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Revoke admin access?"
          message={`${confirm.email} will lose access to the admin console immediately.`}
          confirmLabel="Revoke"
          destructive
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const target = confirm;
            setConfirm(null);
            const t = toast.loading("Revoking…");
            try {
              await revokeFn({ data: { userId: target.userId } });
              toast.success(`${target.email} is no longer an admin`, { id: t });
              refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Revoke failed", { id: t });
            }
          }}
        />
      )}
    </div>
  );
}

// ============ FUTURE PANEL ============

function FuturePanel() {
  const items = [
    { title: "Analytics", desc: "Track visits, top products and conversions." },
    { title: "Orders", desc: "Log manual orders and export reports." },
    { title: "Team", desc: "Invite moderators with limited access." },
    { title: "Announcements", desc: "Push a homepage banner from the dashboard." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <div
          key={i.title}
          className="rounded-2xl border border-dashed border-border bg-card/40 p-5 backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber" />
            <h3 className="font-display text-lg">{i.title}</h3>
            <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Soon
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ============ PROOFS PANEL ============

function ProofsPanel() {
  const listFn = useServerFn(listAllProofs);
  const delFn = useServerFn(deleteProof);
  const qc = useQueryClient();
  const [items, setItems] = useState<ProofRecord[] | null>(null);
  const [editing, setEditing] = useState<ProofRecord | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProofRecord | null>(null);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");


  async function refresh() {
    try {
      setItems(await listFn());
      qc.invalidateQueries({ queryKey: ["published-proofs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load proofs");
    }
  }
  useEffect(() => {
    refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    const needle = q.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toMs = dateTo ? new Date(dateTo).getTime() + 24 * 3600 * 1000 : null;
    return items.filter((p) => {
      if (needle && !(`${p.title} ${p.description}`.toLowerCase().includes(needle))) return false;
      const t = new Date(p.createdAt).getTime();
      if (fromMs && t < fromMs) return false;
      if (toMs && t > toMs) return false;
      return true;
    });
  }, [items, q, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <PremiumCard>
        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber/40 bg-amber/10 text-amber">
              <Images className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl sm:text-2xl">Proof Gallery</h2>
              <p className="text-sm text-muted-foreground">
                {items ? `${items.length} total · ${items.filter((p) => p.published).length} published` : "Loading…"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-2.5 text-xs font-medium text-amber hover:bg-amber/20 sm:px-4 sm:text-sm"
            >
              <Upload className="h-4 w-4" /> Bulk upload
            </button>
            <button
              onClick={() => setEditing("new")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-3 py-2.5 text-xs font-medium text-amber-foreground shadow-gold sm:px-5 sm:text-sm"
            >
              <Plus className="h-4 w-4" /> New proof
            </button>
          </div>

        </div>


        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or description…"
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-amber"
            />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </PremiumCard>

      {filtered && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No proofs match your filters.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered?.map((p) => (
          <article
            key={p.id}
            className="group overflow-hidden rounded-2xl border border-border bg-card/70 transition hover:-translate-y-0.5 hover:border-amber/50 hover:shadow-gold"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              {p.images[0] ? (
                <img
                  src={p.images[0].url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">No image</div>
              )}
              {p.images.length > 1 && (
                <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
                  +{p.images.length - 1}
                </span>
              )}
              <span
                className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  p.published
                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border border-border bg-black/60 text-muted-foreground"
                }`}
              >
                {p.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {p.published ? "Live" : "Hidden"}
              </span>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 font-medium">{p.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                {new Date(p.createdAt).toLocaleString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-amber"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <TogglePublish proof={p} onDone={refresh} />
                <button
                  onClick={() => setConfirmDelete(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <ProofEditor
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      {bulkOpen && (
        <BulkUploadModal
          onClose={() => setBulkOpen(false)}
          onDone={() => {
            setBulkOpen(false);
            refresh();
          }}
        />
      )}


      {confirmDelete && (
        <ConfirmDialog
          title="Delete this proof?"
          message={`“${confirmDelete.title}” and its images will be permanently removed.`}
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const id = confirmDelete.id;
            setConfirmDelete(null);
            const t = toast.loading("Deleting…");
            try {
              await delFn({ data: { id } });
              toast.success("Proof deleted", { id: t });
              refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Delete failed", { id: t });
            }
          }}
        />
      )}
    </div>
  );
}

function TogglePublish({ proof, onDone }: { proof: ProofRecord; onDone: () => void }) {
  const fn = useServerFn(setProofPublished);
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fn({ data: { id: proof.id, published: !proof.published } });
          toast.success(proof.published ? "Hidden from gallery" : "Published to gallery");
          onDone();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:border-amber disabled:opacity-50"
    >
      {proof.published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      {proof.published ? "Hide" : "Publish"}
    </button>
  );
}

// ============ EDITOR ============

// Files are uploaded to storage from the browser so mobile screenshots
// don't have to base64-round-trip through a server function (~33 % size
// blow-up + wrong Content-Type on Samsung Internet / FF Android).
import {
  validateImageFile,
  uploadProofFile,
  MAX_IMAGE_MB,
  type ValidatedFile,
} from "@/lib/proof-uploads";

type PendingImage = ValidatedFile & {
  id: string;
  status: "pending" | "uploading" | "done" | "failed";
  error?: string;
  path?: string;
};
type RejectedFile = { id: string; name: string; reason: string };

function ProofEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProofRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertProof);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [status, setStatus] = useState(initial?.status ?? "");
  const [validity, setValidity] = useState(initial?.validity ?? "");
  const [delivery, setDelivery] = useState(initial?.delivery ?? "");
  const [keep, setKeep] = useState(initial?.images ?? []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<PendingImage[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      newImages.forEach((n) => URL.revokeObjectURL(n.previewUrl));
    },
    [newImages],
  );

  async function onPick(files: FileList | null) {
    if (!files) return;
    const accepted: PendingImage[] = [];
    const bad: RejectedFile[] = [];
    for (const f of Array.from(files)) {
      const result = await validateImageFile(f);
      if (!result.ok) {
        bad.push({ id: crypto.randomUUID(), name: f.name, reason: result.reason });
        continue;
      }
      accepted.push({
        ...result.value,
        id: crypto.randomUUID(),
        status: "pending",
      });
    }
    if (accepted.length) setNewImages((p) => [...p, ...accepted]);
    if (bad.length) setRejected((p) => [...p, ...bad]);
    if (fileRef.current) fileRef.current.value = "";
  }

  const failedCount = newImages.filter((n) => n.status === "failed").length;
  const totalImages = keep.length + newImages.length - failedCount;
  const valid = title.trim().length > 0 && description.trim().length > 0 && (keep.length + newImages.length) > 0;


  async function uploadPending(items: PendingImage[]) {
    // Mark queued items as uploading and reset any prior error.
    setNewImages((prev) =>
      prev.map((n) => (items.some((i) => i.id === n.id) ? { ...n, status: "uploading", error: undefined } : n)),
    );
    let done = 0;
    const results: { id: string; ok: boolean; path?: string; error?: string }[] = [];
    for (const item of items) {
      try {
        const path = await uploadProofFile(item);
        results.push({ id: item.id, ok: true, path });
      } catch (e) {
        results.push({ id: item.id, ok: false, error: e instanceof Error ? e.message : "Upload failed" });
      } finally {
        done += 1;
        setProgress(5 + Math.round((done / Math.max(1, items.length)) * 80));
      }
    }
    setNewImages((prev) =>
      prev.map((n) => {
        const r = results.find((x) => x.id === n.id);
        if (!r) return n;
        return r.ok
          ? { ...n, status: "done", path: r.path, error: undefined }
          : { ...n, status: "failed", error: r.error };
      }),
    );
    return results;
  }

  async function onRetryFailed() {
    const failed = newImages.filter((n) => n.status === "failed");
    if (!failed.length) return;
    setBusy(true);
    setProgress(5);
    const t = toast.loading(`Retrying ${failed.length} file${failed.length > 1 ? "s" : ""}…`);
    const results = await uploadPending(failed);
    const stillBad = results.filter((r) => !r.ok).length;
    if (stillBad === 0) toast.success("All failed uploads succeeded", { id: t });
    else toast.error(`${stillBad} still failed — see details`, { id: t });
    setBusy(false);
    setTimeout(() => setProgress(0), 400);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      toast.error("Title, description and at least one image are required");
      return;
    }
    setBusy(true);
    setProgress(5);
    const pending = newImages.filter((n) => n.status !== "done");
    const tId = toast.loading(
      pending.length
        ? `Uploading ${pending.length} image${pending.length > 1 ? "s" : ""}…`
        : initial ? "Updating proof…" : "Publishing proof…",
    );
    try {
      if (pending.length) {
        const results = await uploadPending(pending);
        const failed = results.filter((r) => !r.ok);
        if (failed.length) {
          toast.error(
            `${failed.length} file${failed.length > 1 ? "s" : ""} failed to upload — retry or remove them`,
            { id: tId },
          );
          setBusy(false);
          setTimeout(() => setProgress(0), 400);
          return;
        }
      }
      // Collect final paths by re-reading the latest state after uploads settled.
      const paths = await new Promise<string[]>((resolve) => {
        setNewImages((prev) => {
          resolve(prev.filter((n) => n.status === "done" && n.path).map((n) => n.path as string));
          return prev;
        });
      });


      toast.loading(initial ? "Updating proof…" : "Publishing proof…", { id: tId });
      await save({
        data: {
          id: initial?.id,
          title: title.trim(),
          description: description.trim(),
          published,
          status: status.trim(),
          validity: validity.trim(),
          delivery: delivery.trim(),
          keepPaths: keep.map((k) => k.path),
          removePaths: removed,
          newImagePaths: paths,
        },
      });

      setProgress(100);
      toast.success(initial ? "Proof updated" : "Proof published", { id: tId });
      onSaved();
    } catch (e) {
      // Roll back files that were uploaded this attempt (uncommitted).
      const orphan = newImages.filter((n) => n.status === "done" && n.path).map((n) => n.path as string);
      if (orphan.length) supabase.storage.from("proofs").remove(orphan).catch(() => {});
      toast.error(e instanceof Error ? e.message : "Save failed", { id: tId });
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 400);
    }
  }


  return (
    <div
      className="fixed inset-0 z-[80] flex bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-amber/40 bg-background shadow-gold sm:h-auto sm:max-h-[85dvh] sm:max-w-3xl sm:rounded-2xl sm:border"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="font-display text-lg sm:text-xl">{initial ? "Edit proof" : "New proof"}</h3>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-amber"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={onSubmit} className="flex-1 space-y-5 overflow-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Title <span className="text-red-400">*</span>
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Description <span className="text-red-400">*</span>
            </span>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
              >
                <option value="">—</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Validity</span>
              <input
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                maxLength={80}
                placeholder="e.g. 30 days, Lifetime, 2026-12-31"
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Delivery</span>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-amber"
              >
                <option value="">—</option>
                <option value="Instant">Instant</option>
                <option value="24 hours">24 hours</option>
                <option value="Manual">Manual</option>
              </select>
            </label>
          </div>


          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Images <span className="text-red-400">*</span> · {totalImages} total
              </span>
              <span className="text-[11px] text-muted-foreground">
                JPG, PNG, WEBP, GIF, BMP · up to {MAX_IMAGE_MB} MB each
              </span>
            </div>

            {keep.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Existing</p>
                <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {keep.map((img) => (
                    <div key={img.path} className="relative">
                      <img src={img.url} alt="" className="h-24 w-full rounded-md object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setKeep((k) => k.filter((x) => x.path !== img.path));
                          setRemoved((r) => [...r, img.path]);
                        }}
                        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-red-500/60 bg-background text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/40 px-4 py-8 text-center transition hover:border-amber/60 hover:bg-amber/5">
              <Upload className="h-6 w-6 text-amber" />
              <span className="mt-2 text-sm font-medium">Click to upload or drop files</span>
              <span className="mt-1 text-[11px] text-muted-foreground">Multiple images supported</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
                multiple
                onChange={(e) => onPick(e.target.files)}
                className="hidden"
              />
            </label>

            {rejected.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-red-300">
                    {rejected.length} file{rejected.length > 1 ? "s" : ""} rejected — fix and re-add
                  </p>
                  <button
                    type="button"
                    onClick={() => setRejected([])}
                    className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-red-300"
                  >
                    Clear
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {rejected.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate text-foreground/90" title={r.name}>{r.name}</span>
                      <span className="shrink-0 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                        {r.reason}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRejected((p) => p.filter((x) => x.id !== r.id))}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-xs hover:border-red-500/60"
                        aria-label="Dismiss"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {newImages.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    New (preview before publishing)
                  </p>
                  {failedCount > 0 && (
                    <button
                      type="button"
                      onClick={onRetryFailed}
                      disabled={busy}
                      className="rounded-full border border-amber/50 bg-amber/10 px-3 py-1 text-[11px] font-medium text-amber hover:bg-amber/20 disabled:opacity-50"
                    >
                      Retry {failedCount} failed
                    </button>
                  )}
                </div>
                <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {newImages.map((n, i) => {
                    const ring =
                      n.status === "failed"
                        ? "ring-2 ring-red-500/70"
                        : n.status === "done"
                        ? "ring-2 ring-emerald-500/60"
                        : n.status === "uploading"
                        ? "ring-2 ring-amber/60 animate-pulse"
                        : "";
                    return (
                      <div key={n.id} className={`relative rounded-md ${ring}`}>
                        <img
                          src={n.previewUrl}
                          alt=""
                          className="h-24 w-full rounded-md object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setNewImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-red-500/60 bg-background text-xs"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                        {n.status === "done" && (
                          <span className="absolute left-1 top-1 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
                            ✓ Uploaded
                          </span>
                        )}
                        {n.status === "uploading" && (
                          <span className="absolute left-1 top-1 rounded-full bg-amber/90 px-1.5 py-0.5 text-[9px] font-medium text-amber-foreground">
                            Uploading…
                          </span>
                        )}
                        {n.status === "failed" && (
                          <span
                            className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded-full bg-red-600/90 px-1.5 py-0.5 text-[9px] font-medium text-white"
                            title={n.error}
                          >
                            Failed: {n.error ?? "upload error"}
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 truncate rounded-b-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          {n.file.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="accent-amber"
            />
            <span className="text-sm">Publish immediately (visible on the customer gallery)</span>
          </label>

          {busy && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-amber transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2 text-sm hover:border-amber"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !valid}
              className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-2.5 text-sm font-medium text-amber-foreground shadow-gold disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {busy ? "Saving…" : initial ? "Save changes" : "Publish proof"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ============ Confirm Dialog ============

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-amber/40 bg-background p-6 shadow-gold"
      >
        <h3 className="font-display text-xl">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2 text-sm hover:border-amber"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              destructive
                ? "border border-red-500/50 bg-red-500/15 text-red-200 hover:bg-red-500/25"
                : "bg-amber text-amber-foreground shadow-gold"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ BULK UPLOAD ============

type ParsedRow = {
  title: string;
  description: string;
  imageFilenames: string[];
  _lineNo: number;
  _error?: string;
};

type BulkImage = {
  id: string;
  file: File;
  mime: string;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "failed";
  path?: string;
  error?: string;
};
type BulkRejected = { id: string; name: string; reason: string };


/** Minimal RFC-4180-ish CSV parser (handles quoted fields with commas / escaped quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}


function BulkUploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const bulk = useServerFn(bulkCreateProofs);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [images, setImages] = useState<BulkImage[]>([]);
  const [rejected, setRejected] = useState<BulkRejected[]>([]);
  const [status, setStatus] = useState("Active");
  const [validity, setValidity] = useState("");
  const [delivery, setDelivery] = useState("Instant");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    },
    [images],
  );

  async function onCsv(file: File) {
    try {
      const text = await file.text();
      const table = parseCsv(text);
      if (!table.length) throw new Error("Empty CSV");
      const header = table[0].map((h) => h.trim().toLowerCase());
      const idxTitle = header.indexOf("title");
      const idxDesc = header.indexOf("description");
      const idxImages = header.findIndex((h) => h === "images" || h === "image" || h === "image_filename" || h === "filename");
      if (idxTitle === -1 || idxImages === -1) {
        throw new Error("CSV must include columns: title, images (and optionally description)");
      }
      const parsed: ParsedRow[] = table.slice(1).map((cols, i) => {
        const title = (cols[idxTitle] ?? "").trim();
        const description = idxDesc >= 0 ? (cols[idxDesc] ?? "").trim() : "";
        const imgCell = (cols[idxImages] ?? "").trim();
        const imageFilenames = imgCell
          .split(/[;|]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const row: ParsedRow = { title, description, imageFilenames, _lineNo: i + 2 };
        if (!title) row._error = "Missing title";
        else if (imageFilenames.length === 0) row._error = "No image filename";
        return row;
      });
      setRows(parsed);
      toast.success(`Parsed ${parsed.length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse CSV");
    }
  }

  async function onImages(files: FileList | null) {
    if (!files) return;
    const accepted: BulkImage[] = [];
    const bad: BulkRejected[] = [];
    for (const f of Array.from(files)) {
      const result = await validateImageFile(f);
      if (!result.ok) {
        bad.push({ id: crypto.randomUUID(), name: f.name, reason: result.reason });
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file: result.value.file,
        mime: result.value.mime,
        previewUrl: result.value.previewUrl,
        status: "pending",
      });
    }
    setImages((p) => {
      // dedupe by filename (keep latest)
      const map = new Map<string, BulkImage>();
      [...p, ...accepted].forEach((i) => map.set(i.file.name, i));
      return Array.from(map.values());
    });
    if (bad.length) setRejected((p) => [...p, ...bad]);
    if (imgRef.current) imgRef.current.value = "";
  }

  // Match rows ↔ images by filename
  const imageNames = useMemo(() => new Set(images.map((i) => i.file.name)), [images]);
  const validation = useMemo(() => {
    if (!rows) return null;
    let ready = 0;
    let missing = 0;
    for (const r of rows) {
      if (r._error) { missing++; continue; }
      const allPresent = r.imageFilenames.every((fn) => imageNames.has(fn));
      if (allPresent) ready++;
      else missing++;
    }
    return { ready, missing };
  }, [rows, imageNames]);

  const failedImageCount = images.filter((i) => i.status === "failed").length;
  const canSubmit =
    !!rows && rows.length > 0 && validation?.missing === 0 && images.length > 0 && !busy;

  async function uploadBulk(items: BulkImage[]) {
    setImages((prev) =>
      prev.map((i) => (items.some((x) => x.id === i.id) ? { ...i, status: "uploading", error: undefined } : i)),
    );
    let done = 0;
    const results: { id: string; ok: boolean; path?: string; error?: string }[] = [];
    for (const item of items) {
      try {
        const path = await uploadProofFile({ file: item.file, mime: item.mime, previewUrl: item.previewUrl });
        results.push({ id: item.id, ok: true, path });
      } catch (e) {
        results.push({ id: item.id, ok: false, error: e instanceof Error ? e.message : "Upload failed" });
      } finally {
        done += 1;
        setProgress(5 + Math.round((done / Math.max(1, items.length)) * 80));
      }
    }
    setImages((prev) =>
      prev.map((i) => {
        const r = results.find((x) => x.id === i.id);
        if (!r) return i;
        return r.ok
          ? { ...i, status: "done", path: r.path, error: undefined }
          : { ...i, status: "failed", error: r.error };
      }),
    );
    return results;
  }

  async function onRetryFailedBulk() {
    const failed = images.filter((i) => i.status === "failed");
    if (!failed.length) return;
    setBusy(true);
    setProgress(5);
    const t = toast.loading(`Retrying ${failed.length} file${failed.length > 1 ? "s" : ""}…`);
    const results = await uploadBulk(failed);
    const stillBad = results.filter((r) => !r.ok).length;
    if (stillBad === 0) toast.success("All failed uploads succeeded", { id: t });
    else toast.error(`${stillBad} still failed — see details`, { id: t });
    setBusy(false);
    setTimeout(() => setProgress(0), 400);
  }

  async function onSubmit() {
    if (!rows) return;
    setBusy(true);
    setProgress(5);
    const usedFilenames = new Set<string>();
    rows.forEach((r) => r.imageFilenames.forEach((fn) => usedFilenames.add(fn)));
    const toUpload = images.filter((i) => usedFilenames.has(i.file.name) && i.status !== "done");
    const t = toast.loading(
      toUpload.length ? `Uploading ${toUpload.length} images…` : `Publishing ${rows.length} proofs…`,
    );
    try {
      if (toUpload.length) {
        const results = await uploadBulk(toUpload);
        const failed = results.filter((r) => !r.ok);
        if (failed.length) {
          toast.error(
            `${failed.length} file${failed.length > 1 ? "s" : ""} failed — retry or remove them`,
            { id: t },
          );
          setBusy(false);
          setTimeout(() => setProgress(0), 400);
          return;
        }
      }
      // Pull the latest paths from state after uploads settled.
      const pathByFilename = await new Promise<Map<string, string>>((resolve) => {
        setImages((prev) => {
          const m = new Map<string, string>();
          prev.forEach((i) => { if (i.status === "done" && i.path) m.set(i.file.name, i.path); });
          resolve(m);
          return prev;
        });
      });

      toast.loading(`Publishing ${rows.length} proofs…`, { id: t });
      const res = await bulk({
        data: {
          shared: { status, validity, delivery, published },
          rows: rows.map((r) => ({
            title: r.title,
            description: r.description,
            imagePaths: r.imageFilenames.map((fn) => pathByFilename.get(fn)!).filter(Boolean),
          })),
        },
      });
      setProgress(100);
      toast.success(`Published ${res.inserted} proofs`, { id: t });
      onDone();
    } catch (e) {
      // Roll back orphaned uploads if the DB insert failed.
      const orphan = images.filter((i) => i.status === "done" && i.path).map((i) => i.path!);
      if (orphan.length) supabase.storage.from("proofs").remove(orphan).catch(() => {});
      toast.error(e instanceof Error ? e.message : "Bulk upload failed", { id: t });
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 500);
    }
  }


  return (
    <div
      className="fixed inset-0 z-[80] flex bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-amber/40 bg-background shadow-gold sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl sm:rounded-2xl sm:border"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl">Bulk upload proofs</h3>
            <p className="text-xs text-muted-foreground">CSV + images · shared Status / Validity / Delivery</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border hover:border-amber"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Shared batch fields */}
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber">Applied to every proof</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-amber">
                  <option value="">—</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Expired</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Validity</span>
                <input value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="30 days" maxLength={80} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-amber" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Delivery</span>
                <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-amber">
                  <option value="">—</option>
                  <option>Instant</option>
                  <option>24 hours</option>
                  <option>Manual</option>
                </select>
              </label>
              <label className="mt-6 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                Publish immediately
              </label>
            </div>
          </div>

          {/* CSV picker */}
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">1. Upload CSV</p>
                <p className="text-xs text-muted-foreground">
                  Columns: <code className="text-amber">title</code>, <code className="text-amber">description</code>, <code className="text-amber">images</code> (semicolon-separated filenames).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const sample = 'title,description,images\n"Google Workspace 1 year","Business Standard plan","gws1.jpg;gws2.jpg"\n"Netflix Premium","4K UHD account","netflix.png"\n';
                  const blob = new Blob([sample], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "proofs-template.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs text-amber underline underline-offset-4"
              >
                Download template
              </button>
            </div>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && onCsv(e.target.files[0])}
              className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-amber file:px-4 file:py-2 file:text-amber-foreground"
            />
            {rows && (
              <p className="mt-2 text-xs text-muted-foreground">
                {rows.length} rows parsed · {validation?.ready ?? 0} ready · {validation?.missing ?? 0} missing images or errors
              </p>
            )}
          </div>

          {/* Image picker */}
          <div className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-sm font-medium">2. Select images</p>
            <p className="text-xs text-muted-foreground">Filenames must match values in the CSV's <code className="text-amber">images</code> column exactly.</p>
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onImages(e.target.files)}
              className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-amber file:px-4 file:py-2 file:text-amber-foreground"
            />
            {images.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {images.length} selected · {images.filter((i) => i.status === "done").length} uploaded · {failedImageCount} failed
                  </p>
                  {failedImageCount > 0 && (
                    <button
                      type="button"
                      onClick={onRetryFailedBulk}
                      disabled={busy}
                      className="rounded-full border border-amber/50 bg-amber/10 px-3 py-1 text-[11px] font-medium text-amber hover:bg-amber/20 disabled:opacity-50"
                    >
                      Retry {failedImageCount} failed
                    </button>
                  )}
                </div>
                <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border border-border/60 p-2">
                  {images.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 flex-1 truncate" title={i.file.name}>{i.file.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          i.status === "done"
                            ? "bg-emerald-600/20 text-emerald-300"
                            : i.status === "uploading"
                            ? "bg-amber/20 text-amber"
                            : i.status === "failed"
                            ? "bg-red-600/20 text-red-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                        title={i.error}
                      >
                        {i.status === "failed" ? `failed · ${i.error ?? "error"}` : i.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((x) => x.id !== i.id))}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[10px] hover:border-red-500/60"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rejected.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-red-300">
                    {rejected.length} file{rejected.length > 1 ? "s" : ""} rejected before upload
                  </p>
                  <button
                    type="button"
                    onClick={() => setRejected([])}
                    className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-red-300"
                  >
                    Clear
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {rejected.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 flex-1 truncate" title={r.name}>{r.name}</span>
                      <span className="shrink-0 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                        {r.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Preview table */}
          {rows && (
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-sm font-medium">3. Preview</p>
              <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Images</th>
                      <th className="px-3 py-2">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const missingFiles = r._error
                        ? []
                        : r.imageFilenames.filter((fn) => !imageNames.has(fn));
                      const ok = !r._error && missingFiles.length === 0;
                      return (
                        <tr key={i} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{r._lineNo}</td>
                          <td className="px-3 py-2">
                            <div className="line-clamp-1 font-medium">{r.title || <span className="text-red-400">—</span>}</div>
                            {r.description && <div className="line-clamp-1 text-[11px] text-muted-foreground">{r.description}</div>}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-muted-foreground">{r.imageFilenames.join(", ")}</td>
                          <td className="px-3 py-2">
                            {r._error ? (
                              <span className="text-red-400">{r._error}</span>
                            ) : ok ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-3 w-3" /> Ready</span>
                            ) : (
                              <span className="text-amber">Missing: {missingFiles.join(", ")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {busy && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-amber transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <footer
          className="grid grid-cols-2 gap-2 border-t border-border px-4 py-3 sm:flex sm:items-center sm:justify-end sm:px-6 sm:py-4"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-border px-4 py-2.5 text-sm hover:border-amber disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground shadow-gold disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {busy ? "Uploading…" : `Upload ${rows?.length ?? 0} proofs`}
          </button>
        </footer>
      </div>
    </div>
  );
}

