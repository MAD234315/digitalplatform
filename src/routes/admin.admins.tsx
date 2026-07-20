import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAdmins,
  suspendAdmin,
  reactivateAdmin,
  deleteAdmin,
  resetAdminPassword,
  updateAdminRole,
} from "@/lib/admins.functions";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";
import { Search, Shield, ShieldOff, Trash2, KeyRound, ChevronLeft, ChevronRight, Copy } from "lucide-react";

export const Route = createFileRoute("/admin/admins")({
  component: AdminsPage,
});

type Admin = {
  user_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
  roles: string[];
};

function AdminsPage() {
  const perms = usePermissions();
  const list = useServerFn(listAdmins);
  const suspend = useServerFn(suspendAdmin);
  const reactivate = useServerFn(reactivateAdmin);
  const del = useServerFn(deleteAdmin);
  const reset = useServerFn(resetAdminPassword);
  const changeRole = useServerFn(updateAdminRole);

  const [rows, setRows] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState<{ userId: string; pw: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Admin | null>(null);
  const pageSize = 15;

  async function load() {
    setBusy(true);
    try {
      const r = await list({ data: { search: search || undefined, page, pageSize } });
      setRows(r.rows as any);
      setTotal(r.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally { setBusy(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canManageAll = perms.isSuperAdmin;

  return (
    <div>
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">User Management</div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Admins</h1>
        <p className="text-sm text-muted-foreground mt-1">All admin accounts with role, status, and last login.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, or mobile"
          className="w-full min-h-11 rounded-sm border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-amber"
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {busy && !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No admins found.</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((a) => {
              const isSuper = a.roles.includes("super_admin");
              return (
                <li key={a.user_id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{a.full_name}</span>
                        {isSuper && <span className="inline-flex items-center rounded-sm border border-amber/40 bg-amber/15 text-amber px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Super Admin</span>}
                        <StatusBadge status={a.status} />
                        {a.roles.filter(r => r !== "super_admin").map(r => (
                          <span key={r} className="inline-flex items-center rounded-sm border border-border text-muted-foreground px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{r}</span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{a.email} · {a.mobile ?? "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Created {new Date(a.created_at).toLocaleDateString()}
                        {a.last_login_at && ` · Last login ${new Date(a.last_login_at).toLocaleString()}`}
                      </div>
                    </div>

                    {canManageAll && !isSuper && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:w-auto">
                        <select
                          value={a.roles.find((r) => r !== "super_admin") ?? "admin"}
                          onChange={async (e) => {
                            try { await changeRole({ data: { userId: a.user_id, role: e.target.value as any } }); toast.success("Role updated"); load(); }
                            catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
                          }}
                          className="min-h-11 rounded-sm border border-border bg-background px-2 text-xs"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        {a.status === "suspended" ? (
                          <button onClick={async () => { try { await reactivate({ data: { userId: a.user_id } }); toast.success("Reactivated"); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }}
                            className="min-h-11 rounded-sm border border-border text-xs inline-flex items-center justify-center gap-1"><Shield className="h-4 w-4" /> Reactivate</button>
                        ) : (
                          <button onClick={async () => { try { await suspend({ data: { userId: a.user_id } }); toast.success("Suspended"); load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }}
                            className="min-h-11 rounded-sm border border-border text-xs inline-flex items-center justify-center gap-1"><ShieldOff className="h-4 w-4" /> Suspend</button>
                        )}
                        <button onClick={async () => { try { const r = await reset({ data: { userId: a.user_id } }); setTempPw({ userId: a.user_id, pw: r.temporaryPassword }); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }}
                          className="min-h-11 rounded-sm border border-border text-xs inline-flex items-center justify-center gap-1"><KeyRound className="h-4 w-4" /> Reset</button>
                        <button onClick={() => setConfirmDelete(a)}
                          className="min-h-11 rounded-sm border border-destructive/40 text-destructive text-xs inline-flex items-center justify-center gap-1"><Trash2 className="h-4 w-4" /> Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="min-h-10 rounded-sm border border-border px-3 disabled:opacity-50 inline-flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="min-h-10 rounded-sm border border-border px-3 disabled:opacity-50 inline-flex items-center gap-1">Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {tempPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6 bg-black/60" onClick={() => setTempPw(null)}>
          <div className="w-[min(94vw,440px)] rounded-lg border border-amber/40 bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg">Temporary Password</h3>
            <p className="text-xs text-muted-foreground mt-1">Share this with the user securely. It will not be shown again.</p>
            <div className="mt-3 flex items-center gap-2 rounded-sm border border-border bg-background p-2">
              <code className="flex-1 text-sm break-all">{tempPw.pw}</code>
              <button onClick={() => { navigator.clipboard.writeText(tempPw.pw); toast.success("Copied"); }} className="min-h-10 rounded-sm border border-border px-2 text-xs inline-flex items-center gap-1"><Copy className="h-4 w-4" /></button>
            </div>
            <button onClick={() => setTempPw(null)} className="mt-4 w-full min-h-11 rounded-sm font-semibold" style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}>Close</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6 bg-black/60" onClick={() => setConfirmDelete(null)}>
          <div className="w-[min(94vw,440px)] rounded-lg border border-destructive/40 bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg">Delete admin?</h3>
            <p className="text-sm text-muted-foreground mt-2">This will permanently delete <strong className="text-foreground">{confirmDelete.full_name}</strong> and revoke access. This cannot be undone.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDelete(null)} className="min-h-11 rounded-sm border border-border text-sm">Cancel</button>
              <button onClick={async () => {
                try { await del({ data: { userId: confirmDelete.user_id } }); toast.success("Deleted"); setConfirmDelete(null); load(); }
                catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              }} className="min-h-11 rounded-sm bg-destructive text-destructive-foreground text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    pending: "bg-amber/20 text-amber border-amber/40",
    suspended: "bg-destructive/20 text-destructive border-destructive/40",
    rejected: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? "border-border"}`}>{status}</span>
  );
}
