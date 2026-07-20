import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listProofsAdmin,
  createProof,
  updateProof,
  deleteProof,
} from "@/lib/admin.functions";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, Upload, Search, X, Loader2, Pencil, Check, RefreshCw, WifiOff, Calendar as CalendarIcon, Replace } from "lucide-react";
import { useOnline, withTimeout, retry, isTransient } from "@/lib/network";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export const Route = createFileRoute("/admin/proofs")({
  component: ProofsAdmin,
});

// Accept common mobile capture formats. iOS returns HEIC unless the picker converts,
// so we accept it — display quality on non-Safari browsers is a known limitation
// we note to the user at upload time.
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp", "image/heic", "image/heif"];
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

type ProofRow = {
  id: string;
  title: string;
  description: string;
  image_path: string;
  image_url: string | null;
  published: boolean;
  created_at: string;
};

function ProofsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProofsAdmin);
  const createFn = useServerFn(createProof);
  const updateFn = useServerFn(updateProof);
  const deleteFn = useServerFn(deleteProof);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "proofs"],
    queryFn: () => listFn() as Promise<ProofRow[]>,
  });

  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ProofRow | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toTs = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    return data.filter((r) => {
      if (q && !(r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))) return false;
      const ts = new Date(r.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [data, query, fromDate, toDate]);

  const hasFilters = !!(query || fromDate || toDate);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "proofs"] });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); setPendingDelete(null); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const togglePub = useMutation({
    mutationFn: (row: ProofRow) => updateFn({ data: { id: row.id, published: !row.published } }),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div className="min-w-0">
      <div className="mb-5 sm:mb-6 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Proof Gallery</div>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Manage proofs</h1>
        </div>
        <div className="text-xs text-muted-foreground">
          {data ? `${data.length} total` : ""}
        </div>
      </div>

      <UploadCard
        onUploaded={async (payload) => {
          await createFn({ data: payload });
          toast.success("Proof published");
          invalidate();
        }}
      />

      <div className="mt-6 mb-3 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search proofs…"
          className="w-full min-h-12 pl-9 pr-3 rounded-sm border border-border bg-background text-base sm:text-sm outline-none focus:border-amber"
        />
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && (
        <div className="text-sm text-destructive break-words">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
      )}

      <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">

        {filtered.map((row) => (
          <ProofEditCard
            key={row.id}
            row={row}
            onDelete={() => {
              if (confirm(`Delete "${row.title}"?`)) del.mutate(row.id);
            }}
            onTogglePublished={() => togglePub.mutate(row)}
            onSaveEdit={async (patch) => {
              await updateFn({ data: { id: row.id, ...patch } });
              toast.success("Saved");
              invalidate();
            }}
          />
        ))}
      </ul>

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No proofs yet. Upload your first above.
        </div>
      )}
    </div>
  );
}

/* ---------------- Upload card ---------------- */

function UploadCard({
  onUploaded,
}: {
  onUploaded: (payload: { title: string; description: string; image_path: string }) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const online = useOnline();


  function reset() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setTitle("");
    setDescription("");
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(f: File | null) {
    if (!f) return;
    // Some mobile browsers report empty MIME for HEIC — allow if extension matches.
    const type = (f.type || "").toLowerCase();
    const nameLower = f.name.toLowerCase();
    const extOk = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(nameLower);
    if (type && !ACCEPTED.includes(type) && !extOk) {
      toast.error("Unsupported file format. Use JPG, PNG, WEBP, HEIC, GIF, or BMP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error(`Image too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 15 MB.`);
      return;
    }
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function runUpload() {
    if (!file) return;
    if (!online) {
      const msg = "You're offline. Reconnect and retry the upload.";
      setLastError(msg);
      toast.error(msg);
      return;
    }
    setBusy(true);
    setLastError(null);
    setProgress(5);
    try {
      await verifyImageLoadable(file);
      setProgress(15);

      const ext = extensionFromFile(file);
      const path = `${cryptoId()}.${ext}`;

      await retry(
        async () => {
          setProgress(35);
          const { error: upErr } = await withTimeout(
            supabase.storage.from("proofs").upload(path, file, {
              cacheControl: "3600",
              upsert: true, // safe: same generated path only reused across retries
              contentType: file.type || `image/${ext}`,
            }),
            // Slow-network friendly: scale timeout with file size (min 30s, ~1s/MB).
            Math.max(30_000, Math.round((file.size / (1024 * 1024)) * 1000) + 20_000),
            "Upload"
          );
          if (upErr) throw upErr;
          setProgress(80);

          await withTimeout(
            onUploaded({
              title: title.trim(),
              description: description.trim(),
              image_path: path,
            }),
            20_000,
            "Publish"
          );
        },
        { attempts: 3, onAttempt: (n) => setAttempt(n) }
      );
      setProgress(100);
      reset();
      setAttempt(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setLastError(msg);
      toast.error(msg);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Please choose an image.");
    if (!title.trim()) return toast.error("Title is required.");
    if (!description.trim()) return toast.error("Description is required.");
    await runUpload();
  }


  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="font-semibold text-foreground">Upload proof</h2>
      <p className="text-xs text-muted-foreground mt-1">
        JPG, PNG, WEBP, HEIC, GIF or BMP · max 15 MB · all fields required.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="min-w-0">
          <label
            htmlFor="proof-file"
            className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-background aspect-video cursor-pointer hover:border-amber/50 transition overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center px-3 py-6">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                <div className="mt-2 text-xs text-muted-foreground">Tap to choose image</div>
                <div className="mt-1 text-[10px] text-muted-foreground/70">Gallery · Camera · Files</div>
              </div>
            )}
          </label>
          <input
            ref={inputRef}
            id="proof-file"
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          {file && (
            <button
              type="button"
              onClick={reset}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 min-h-9"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full min-h-12 rounded-sm border border-border bg-background px-3 text-base sm:text-sm outline-none focus:border-amber"
          />
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-base sm:text-sm outline-none focus:border-amber resize-y"
          />
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              {progress !== null && (
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-amber transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              {busy && attempt > 1 && (
                <div className="mt-1 text-[11px] text-muted-foreground">Retrying (attempt {attempt}/3)…</div>
              )}
            </div>
            <button
              type="submit"
              disabled={busy || !file || !online}
              className="w-full sm:w-auto min-h-12 rounded-sm px-5 text-sm font-semibold uppercase tracking-wider disabled:opacity-60 inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {busy ? (attempt > 1 ? `Retrying ${attempt}/3…` : "Uploading…") : "Publish"}
            </button>
          </div>

          {!online && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/10 text-destructive text-xs px-3 py-2 flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>You're offline. Uploads will fail until your connection returns.</span>
            </div>
          )}

          {lastError && !busy && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 text-destructive text-xs px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="min-w-0 flex-1 break-words">{lastError}</span>
              {isTransient(new Error(lastError)) && file && (
                <button
                  type="button"
                  onClick={runUpload}
                  disabled={!online}
                  className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry upload
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </form>

  );
}


/* ---------------- Row card ---------------- */

function ProofEditCard({
  row,
  onDelete,
  onTogglePublished,
  onSaveEdit,
}: {
  row: ProofRow;
  onDelete: () => void;
  onTogglePublished: () => void;
  onSaveEdit: (patch: { title: string; description: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [description, setDescription] = useState(row.description);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description required.");
      return;
    }
    setSaving(true);
    try {
      await onSaveEdit({ title: title.trim(), description: description.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      <div className="aspect-video bg-background overflow-hidden">
        {row.image_url ? (
          <img
            src={row.image_url}
            alt={row.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
            Image unavailable
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        {editing ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-11 rounded-sm border border-border bg-background px-2 text-base sm:text-sm outline-none focus:border-amber"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-base sm:text-sm outline-none focus:border-amber resize-y"
            />
          </>

        ) : (
          <>
            <h3 className="font-semibold text-foreground text-sm">{row.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>
          </>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs">
          <span className={row.published ? "text-amber" : "text-muted-foreground"}>
            {row.published ? "Published" : "Hidden"}
          </span>
          <span className="text-muted-foreground">
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 min-w-[110px] min-h-10 rounded-sm bg-amber text-amber-foreground text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button
                onClick={() => { setEditing(false); setTitle(row.title); setDescription(row.description); }}
                className="min-h-10 px-3 rounded-sm border border-border text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="min-h-10 px-3 rounded-sm border border-border text-xs inline-flex items-center gap-1"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={onTogglePublished}
                className="min-h-10 px-3 rounded-sm border border-border text-xs inline-flex items-center gap-1"
              >
                {row.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {row.published ? "Hide" : "Show"}
              </button>
              <button
                onClick={onDelete}
                aria-label="Delete"
                className="min-h-10 min-w-10 px-3 rounded-sm border border-destructive/40 text-destructive text-xs inline-flex items-center justify-center gap-1 ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

      </div>
    </li>
  );
}

/* ---------------- Utils ---------------- */

function verifyImageLoadable(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(); };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // HEIC/HEIF often can't decode in <img> on Chrome/Android — allow upload anyway;
      // the customer site will still display it via signed URL on browsers that can render it.
      const name = file.name.toLowerCase();
      if (name.endsWith(".heic") || name.endsWith(".heif")) resolve();
      else reject(new Error("Image cannot be opened. Please try a different file."));
    };
    img.src = url;
  });
}

function extensionFromFile(file: File): string {
  const name = file.name.toLowerCase();
  const m = name.match(/\.([a-z0-9]+)$/);
  if (m) return m[1];
  const t = (file.type || "").toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("bmp")) return "bmp";
  if (t.includes("heic")) return "heic";
  if (t.includes("heif")) return "heif";
  return "jpg";
}

function cryptoId(): string {
  const arr = new Uint8Array(16);
  (globalThis.crypto || (window as any).crypto).getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
