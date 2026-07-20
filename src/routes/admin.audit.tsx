import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLog } from "@/lib/admins.functions";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

type Row = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
};

function AuditPage() {
  const list = useServerFn(listAuditLog);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const pageSize = 20;

  async function load() {
    setBusy(true);
    try {
      const r = await list({ data: { search: search || undefined, page, pageSize } });
      setRows(r.rows as any); setTotal(r.total);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Security</div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Chronological record of all admin actions.</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action or actor"
          className="w-full min-h-11 rounded-sm border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-amber"
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {busy && !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !rows.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No audit entries.</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-sm border border-amber/40 bg-amber/10 text-amber px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{r.action}</span>
                      {r.target_type && <span className="text-xs text-muted-foreground">{r.target_type}{r.target_id ? `:${r.target_id.slice(0, 8)}` : ""}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      by {r.actor_email ?? "system"} · {new Date(r.created_at).toLocaleString()}
                    </div>
                    {r.metadata && Object.keys(r.metadata).length > 0 && (
                      <pre className="mt-2 text-[11px] text-muted-foreground bg-background rounded-sm border border-border p-2 overflow-x-auto">{JSON.stringify(r.metadata, null, 2)}</pre>
                    )}
                  </div>
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
    </div>
  );
}
