import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2, Upload, Eye, EyeOff, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

type Notif = {
  id: string;
  kind: "proof_uploaded" | "proof_published" | "proof_hidden";
  proof_id: string | null;
  proof_title: string;
  message: string;
  read: boolean;
  created_at: string;
};

const PAGE_SIZE = 15;

function iconFor(kind: Notif["kind"]) {
  if (kind === "proof_uploaded") return Upload;
  if (kind === "proof_published") return Eye;
  return EyeOff;
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const seenInitial = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function loadUnreadCount() {
    const { count } = await supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);
    setUnreadTotal(count ?? 0);
  }

  async function loadPage(p: number, q: string) {
    setLoading(true);
    let query = supabase
      .from("admin_notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) {
      const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
      query = query.or(`message.ilike.${like},proof_title.ilike.${like}`);
    }
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await query.range(from, to);
    if (data) setItems(data as Notif[]);
    setTotal(count ?? 0);
    setLoading(false);
    seenInitial.current = true;
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  useEffect(() => {
    loadUnreadCount();
    const channel = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const n = payload.new as Notif;
          setUnreadTotal((c) => c + 1);
          // If viewing first page with no search, prepend live
          if (open && page === 0 && !debounced) {
            setItems((prev) => [n, ...prev].slice(0, PAGE_SIZE));
            setTotal((t) => t + 1);
          }
          if (seenInitial.current) {
            const label =
              n.kind === "proof_uploaded"
                ? "New proof uploaded"
                : n.kind === "proof_published"
                ? "Proof published"
                : "Proof hidden";
            toast(label, { description: n.proof_title });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, debounced]);

  // Load when open, page, or search changes
  useEffect(() => {
    if (!open) return;
    loadPage(page, debounced);
  }, [open, page, debounced]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageUnread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  async function markAllRead() {
    if (unreadTotal === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadTotal(0);
    await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
  }

  async function markOne(id: string) {
    const target = items.find((n) => n.id === id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (target && !target.read) setUnreadTotal((c) => Math.max(0, c - 1));
    await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
  }

  async function clearAll() {
    if (!confirm("Clear ALL notifications? This cannot be undone.")) return;
    setItems([]);
    setTotal(0);
    setUnreadTotal(0);
    await supabase.from("admin_notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border text-foreground hover:bg-card"
        aria-label={`Notifications${unreadTotal ? ` (${unreadTotal} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadTotal > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
          >
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(94vw,380px)] rounded-lg border border-border bg-background shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Notifications {total > 0 && <span className="ml-1 normal-case tracking-normal text-[10px]">({total})</span>}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllRead}
                disabled={unreadTotal === 0}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 disabled:opacity-40"
                title="Mark all read"
              >
                <Check className="h-3.5 w-3.5" /> Read all
              </button>
              <button
                onClick={clearAll}
                disabled={total === 0}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive px-2 py-1 disabled:opacity-40"
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications…"
                autoComplete="off"
                className="w-full h-9 rounded-sm border border-border bg-card pl-7 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <ul ref={listRef} className="max-h-[55vh] overflow-y-auto divide-y divide-border">
            {loading && items.length === 0 && (
              <li className="p-6 text-center text-xs text-muted-foreground">Loading…</li>
            )}
            {!loading && items.length === 0 && (
              <li className="p-6 text-center text-xs text-muted-foreground">
                {debounced ? `No results for "${debounced}".` : "You're all caught up."}
              </li>
            )}
            {items.map((n) => {
              const Icon = iconFor(n.kind);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => markOne(n.id)}
                    className={`w-full text-left flex gap-3 px-3 py-3 hover:bg-card transition ${
                      n.read ? "opacity-70" : ""
                    }`}
                  >
                    <div
                      className={`h-8 w-8 shrink-0 rounded-sm flex items-center justify-center border ${
                        n.read
                          ? "border-border text-muted-foreground"
                          : "border-amber/40 text-amber bg-amber/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">{n.message}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.read && (
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--amber)" }}
                        aria-label="Unread"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <div className="text-[11px] text-muted-foreground">
                Page {page + 1} of {totalPages}
                {pageUnread > 0 && <span className="ml-2">· {pageUnread} unread</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="inline-flex items-center h-7 px-2 rounded-sm border border-border text-[11px] text-foreground disabled:opacity-40 hover:bg-card"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="inline-flex items-center h-7 px-2 rounded-sm border border-border text-[11px] text-foreground disabled:opacity-40 hover:bg-card"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
