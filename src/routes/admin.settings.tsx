import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings, updateSetting } from "@/lib/admin.functions";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useOnline, withTimeout, retry, isTransient } from "@/lib/network";
import { RefreshCw, WifiOff } from "lucide-react";


export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const listFn = useServerFn(getSettings);
  const updateFn = useServerFn(updateSetting);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => listFn(),
  });

  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState<"online" | "offline">("online");

  useEffect(() => {
    if (!data) return;
    const s = data.find((r: any) => r.key === "site_status")?.value;
    const u = data.find((r: any) => r.key === "spreadsheet_url")?.value;
    setStatus(s === "offline" ? "offline" : "online");
    setSheetUrl(typeof u === "string" ? u : "");
  }, [data]);

  const online = useOnline();
  const [attempt, setAttempt] = useState(0);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<
    | { key: "site_status" | "spreadsheet_url"; value: any; message: string }
    | null
  >(null);

  function validateSpreadsheetUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value) return "Spreadsheet URL is required.";
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return "Enter a valid URL (starting with https://).";
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "URL must start with http:// or https://.";
    }
    const host = url.hostname.toLowerCase();
    const isGoogleSheet =
      host === "docs.google.com" &&
      /^\/spreadsheets\/d\/[A-Za-z0-9_-]+/.test(url.pathname);
    const isExcelHost =
      host.endsWith("live.com") ||
      host.endsWith("office.com") ||
      host.endsWith("sharepoint.com") ||
      host.endsWith("onedrive.com") ||
      host.endsWith("office.net");
    const isDirectFile = /\.(xlsx|xls|xlsm|csv)(\?|$)/i.test(
      url.pathname + url.search,
    );
    if (!isGoogleSheet && !isExcelHost && !isDirectFile) {
      return "Enter a Google Sheets link or an Excel/CSV spreadsheet URL.";
    }
    return null;
  }

  const save = useMutation({
    mutationFn: async (input: { key: "site_status" | "spreadsheet_url"; value: any }) => {
      if (!online) throw new Error("You're offline. Reconnect and try again.");
      setAttempt(0);
      return retry(
        () => withTimeout(updateFn({ data: input }), 15000, "Save"),
        { attempts: 3, onAttempt: (n) => setAttempt(n) }
      );
    },
    onSuccess: () => {
      toast.success("Saved");
      setLastFailed(null);
      setAttempt(0);
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e, vars) => {
      const message = e instanceof Error ? e.message : "Save failed";
      setLastFailed({ key: vars.key, value: vars.value, message });
      setAttempt(0);
      toast.error(message);
    },
  });

  function handleSaveSheet() {
    const err = validateSpreadsheetUrl(sheetUrl);
    setSheetError(err);
    if (err) {
      toast.error(err);
      return;
    }
    save.mutate({ key: "spreadsheet_url", value: sheetUrl.trim() });
  }


  return (
    <div className="min-w-0">
      <div className="mb-5 sm:mb-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Settings</div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Site configuration</h1>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <h2 className="font-semibold text-foreground">Website Status</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Offline hides products and shows a maintenance page. Admin still has access.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {(["online", "offline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setStatus(v); save.mutate({ key: "site_status", value: v }); }}
                  disabled={save.isPending}
                  className={`min-h-12 rounded-sm px-4 text-sm font-medium uppercase tracking-wider border transition ${
                    status === v
                      ? "border-amber bg-amber text-amber-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <h2 className="font-semibold text-foreground">Spreadsheet URL</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Product catalogue source. Paste a Google Sheets link or an Excel/CSV URL.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={sheetUrl}
                onChange={(e) => {
                  setSheetUrl(e.target.value);
                  if (sheetError) setSheetError(null);
                }}
                onBlur={() => setSheetError(validateSpreadsheetUrl(sheetUrl))}
                aria-invalid={!!sheetError}
                aria-describedby={sheetError ? "sheet-url-error" : undefined}
                placeholder="https://docs.google.com/spreadsheets/…"
                className={`flex-1 min-w-0 min-h-12 rounded-sm border bg-background px-3 text-base sm:text-sm outline-none focus:border-amber ${
                  sheetError ? "border-destructive" : "border-border"
                }`}
              />
              <button
                onClick={handleSaveSheet}
                disabled={save.isPending || !online}
                className="min-h-12 rounded-sm px-5 text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
                style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
              >
                {save.isPending && attempt > 1 ? `Retrying ${attempt}/3…` : save.isPending ? "Saving…" : "Save"}
              </button>
            </div>
            {sheetError && (
              <p id="sheet-url-error" className="mt-2 text-xs text-destructive">
                {sheetError}
              </p>
            )}
          </section>


          {lastFailed && !save.isPending && (
            <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-xs text-destructive min-w-0 flex-1">
                <div className="font-semibold uppercase tracking-wider">Save failed</div>
                <div className="mt-1 break-words">{lastFailed.message}</div>
              </div>
              {isTransient(new Error(lastFailed.message)) && (
                <button
                  onClick={() => save.mutate({ key: lastFailed.key, value: lastFailed.value })}
                  disabled={!online}
                  className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-sm border border-destructive/40 text-destructive text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry last save
                </button>
              )}
            </section>
          )}

          {!online && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/10 text-destructive text-xs px-3 py-2 flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>You're offline. Changes will fail until your connection returns.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

