import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRolePermissions, updateRolePermissions } from "@/lib/admins.functions";
import { toast } from "sonner";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/roles")({
  component: RolesPage,
});

const ALL_PERMS = [
  { id: "proofs.manage", label: "Proof Gallery" },
  { id: "settings.manage", label: "Spreadsheet Settings" },
  { id: "status.manage", label: "Website Status" },
  { id: "products.manage", label: "Product Management" },
  { id: "users.manage", label: "User Management" },
  { id: "admins.manage", label: "Admin Management" },
  { id: "audit.view", label: "Audit Log" },
];
const EDITABLE_ROLES = ["admin", "editor", "viewer"] as const;

function RolesPage() {
  const list = useServerFn(listRolePermissions);
  const save = useServerFn(updateRolePermissions);
  const [map, setMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await list();
        const m: Record<string, Set<string>> = {};
        for (const r of rows as any[]) {
          if (!m[r.role]) m[r.role] = new Set();
          m[r.role].add(r.permission);
        }
        setMap(m);
      } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [list]);

  function toggle(role: string, perm: string) {
    setMap((prev) => {
      const s = new Set(prev[role] ?? []);
      if (s.has(perm)) s.delete(perm); else s.add(perm);
      return { ...prev, [role]: s };
    });
  }

  async function saveRole(role: (typeof EDITABLE_ROLES)[number]) {
    try {
      await save({ data: { role, permissions: Array.from(map[role] ?? []) } });
      toast.success(`${role} permissions saved`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Access Control</div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Roles &amp; Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure what each role can do. Super Admin has all permissions and cannot be edited.</p>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-4">
          {EDITABLE_ROLES.map((role) => (
            <div key={role} className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg capitalize">{role}</h2>
                <button
                  onClick={() => saveRole(role)}
                  className="min-h-11 rounded-sm px-4 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
                  style={{ backgroundColor: "var(--amber)", color: "var(--amber-foreground)" }}
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_PERMS.map((p) => {
                  const on = map[role]?.has(p.id) ?? false;
                  return (
                    <label key={p.id} className={`flex items-center gap-3 rounded-sm border p-3 cursor-pointer transition ${on ? "border-amber/50 bg-amber/10" : "border-border"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(role, p.id)} className="h-4 w-4 accent-amber" />
                      <div className="min-w-0">
                        <div className="text-sm text-foreground">{p.label}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.id}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-amber/40 bg-card p-4 sm:p-5">
            <h2 className="font-display text-lg">Super Admin</h2>
            <p className="text-sm text-muted-foreground mt-1">Has full access to all features. Permissions are fixed and cannot be modified.</p>
          </div>
        </div>
      )}
    </div>
  );
}
