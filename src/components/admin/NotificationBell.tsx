import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2, Upload, Eye, EyeOff } from "lucide-react";
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
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const seenInitial = useRef(false);

  async function load() {
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setItems(data as Notif[]);
    seenInitial.current = true;
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => [n, ...prev].slice(0, 30));
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
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("admin_notifications").update({ read: true }).in("id", ids);
  }

  async function markOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
  }

  async function clearAll() {
    const ids = items.map((n) => n.id);
    if (ids.length === 0) return;
    setItems([]);
    await supabase.from("admin_notifications").delete().in("id", ids);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border text-foreground hover:bg-card"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,340px)] rounded-lg border border-border bg-background shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Notifications
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllRead}
                disabled={unread === 0}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 disabled:opacity-40"
                title="Mark all read"
              >
                <Check className="h-3.5 w-3.5" /> Read all
              </button>
              <button
                onClick={clearAll}
                disabled={items.length === 0}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive px-2 py-1 disabled:opacity-40"
                title="Clear"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {items.length === 0 && (
              <li className="p-6 text-center text-xs text-muted-foreground">
                You're all caught up.
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
        </div>
      )}
    </div>
  );
}
