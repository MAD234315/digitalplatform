import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ChatThreadSummary } from "@/lib/chat-threads.functions";

/** Today / Yesterday / Older buckets for the saved conversation list. */
function bucketOf(iso: string): "Today" | "Yesterday" | "Older" {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = date.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 86_400_000) return "Yesterday";
  return "Older";
}

function stamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} · ${d.toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function ChatHistorySheet({
  open,
  onOpenChange,
  threads,
  activeId,
  onNew,
  onDelete,
  onDeleteAll,
  onRename,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threads: ChatThreadSummary[];
  activeId: string;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);


  const groups: { label: string; items: ChatThreadSummary[] }[] = (
    ["Today", "Yesterday", "Older"] as const
  )
    .map((label) => ({ label, items: threads.filter((t) => bucketOf(t.updatedAt) === label) }))
    .filter((g) => g.items.length > 0);

  const commit = (id: string) => {
    const title = draft.trim();
    if (title) onRename(id, title);
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[88vw] max-w-sm flex-col gap-0 border-border bg-card p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4">
          <SheetTitle className="text-base">Chat history</SheetTitle>
        </SheetHeader>

        <div className="shrink-0 space-y-2 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onNew();
            }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber to-amber-600 px-4 text-sm font-semibold text-black transition-[filter] hover:brightness-110"
          >
            <Plus className="size-4" aria-hidden />
            New chat
          </button>

          {threads.length > 0 &&
            (confirmAll ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAll(false);
                    onDeleteAll();
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete all chats
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAll(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAll(true)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
                Delete all
              </button>
            ))}
        </div>


        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6 [-webkit-overflow-scrolling:touch]">
          {threads.length === 0 && (
            <p className="px-3 py-6 text-sm text-muted-foreground">No saved conversations yet.</p>
          )}

          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-2 pt-3 text-[11px] font-bold uppercase tracking-widest text-amber/70">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((t) => {
                  const active = t.id === activeId;
                  const editing = editingId === t.id;
                  return (
                    <li
                      key={t.id}
                      className={`flex items-center gap-1 rounded-2xl border px-1.5 py-1 transition-colors ${
                        active ? "border-amber/30 bg-amber/[0.06]" : "border-transparent hover:bg-background"
                      }`}
                    >
                      {editing ? (
                        <>
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commit(t.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            aria-label="Conversation name"
                            className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-amber/50 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => commit(t.id)}
                            aria-label="Save name"
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-amber"
                          >
                            <Check className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancel rename"
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/chat/$threadId"
                            params={{ threadId: t.id }}
                            onClick={() => onOpenChange(false)}
                            aria-current={active ? "page" : undefined}
                            className="min-h-11 min-w-0 flex-1 px-2 py-1.5 text-left"
                          >
                            <span className="block truncate text-sm text-foreground">{t.title}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {stamp(t.updatedAt)}
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(t.id);
                              setDraft(t.title);
                            }}
                            aria-label={`Rename conversation: ${t.title}`}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-amber"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(t.id)}
                            aria-label={`Delete conversation: ${t.title}`}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
