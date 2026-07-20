import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminRequests, approveAdminRequest, rejectAdminRequest } from "@/lib/admins.functions";
import { toast } from "sonner";
import { Check, X, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/requests")({
  component: RequestsPage,
});

type Req = {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  reason: string;
  device_info: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

function RequestsPage() {
  const list = useServerFn(listAdminRequests);
  const approve = useServerFn(approveAdminRequest);
  const reject = useServerFn(rejectAdminRequest);
  const [rows, setRows] = useState<Req[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Req | null>(null);
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("admin");
  const [rejectReason, setRejectReason] = useState("");
  const pageSize = 15;

  async function load() {
    setBusy(true);
    try {
      const r = await list({ data: { status, search: search || undefined, page, pageSize } });
      setRows(r.rows as any);
      setTotal(r.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  async function doApprove(id: string) {
    try {
      await approve({ data: { id, role } });
      toast.success("Approved");
      setSelected(null);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }
  async function doReject(id: string) {
    try {
      await reject({ data: { id, reason: rejectReason || undefined } });
      toast.success("Rejected");
      setSelected(null); setRejectReason("");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Admin Management</div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Admin Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review, approve, or reject requests to become an admin.</p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or mobile"
            className="w-full min-h-11 rounded-sm border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-amber"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
          className="min-h-11 rounded-sm border border-border bg-background px-3 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {busy && !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No requests found.</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground truncate">{r.full_name}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.email} · {r.mobile ?? "—"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-3 sm:flex gap-2">
                  <button
                    onClick={() => { setSelected(r); setRole("admin"); }}
                    className="min-h-11 rounded-sm border border-border px-3 text-xs inline-flex items-center justify-center gap-1"
                  >
                    <Eye className="h-4 w-4" /> View
                  </button>
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => doApprove(r.id)}
                        className="min-h-11 rounded-sm px-3 text-xs inline-flex items-center justify-center gap-1 font-semibold"
                        style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => { setSelected(r); setRejectReason(""); }}
                        className="min-h-11 rounded-sm border border-destructive/40 text-destructive px-3 text-xs inline-flex items-center justify-center gap-1"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 py-6 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-[min(94vw,520px)] rounded-lg border border-border bg-card p-5 sm:p-6 max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl">{selected.full_name}</h2>
            <div className="text-xs text-muted-foreground mt-1">{selected.email} · {selected.mobile ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</div>
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Reason</div>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">{selected.reason}</p>
            </div>
            {selected.device_info && (
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Device / Browser</div>
                <p className="mt-1 text-xs text-muted-foreground break-words">{selected.device_info}</p>
              </div>
            )}
            {selected.status === "pending" && (
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Assign role on approval</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mt-1 w-full min-h-11 rounded-sm border border-border bg-background px-3 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => doApprove(selected.id)}
                    className="min-h-11 rounded-sm px-3 text-sm font-semibold"
                    style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
                  >Approve</button>
                  <button
                    onClick={() => doReject(selected.id)}
                    className="min-h-11 rounded-sm border border-destructive/40 text-destructive text-sm"
                  >Reject</button>
                </div>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Optional rejection reason"
                  className="w-full min-h-11 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-amber"
                />
              </div>
            )}
            {selected.rejection_reason && (
              <div className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                Rejected: {selected.rejection_reason}
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-5 w-full min-h-11 rounded-sm border border-border text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber/20 text-amber border-amber/40",
    approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    rejected: "bg-destructive/20 text-destructive border-destructive/40",
  };
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? "border-border text-muted-foreground"}`}>
      {status}
    </span>
  );
}
