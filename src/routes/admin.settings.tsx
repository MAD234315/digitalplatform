import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings, updateSetting } from "@/lib/admin.functions";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

  const save = useMutation({
    mutationFn: async (input: { key: "site_status" | "spreadsheet_url"; value: any }) => {
      return updateFn({ data: input });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  return (
    <div>
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Settings</div>
        <h1 className="font-display text-2xl sm:text-3xl mt-1">Site configuration</h1>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Website Status</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Offline hides products and shows a maintenance page. Admin still has access.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["online", "offline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setStatus(v); save.mutate({ key: "site_status", value: v }); }}
                  disabled={save.isPending}
                  className={`rounded-sm px-4 py-2 text-sm font-medium uppercase tracking-wider border transition ${
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

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Spreadsheet URL</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Product catalogue source. Paste the Google Sheets URL.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/…"
                className="flex-1 min-h-11 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-amber"
              />
              <button
                onClick={() => save.mutate({ key: "spreadsheet_url", value: sheetUrl })}
                disabled={save.isPending}
                className="min-h-11 rounded-sm px-5 text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
                style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
              >
                Save
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
