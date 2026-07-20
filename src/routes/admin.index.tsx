import { createFileRoute, Link } from "@tanstack/react-router";
import { Image, Settings, ExternalLink, FileDown } from "lucide-react";


export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const CARDS = [
  {
    to: "/admin/proofs",
    title: "Proof Gallery",
    desc: "Upload, edit and publish customer proof screenshots.",
    icon: Image,
  },
  {
    to: "/admin/settings",
    title: "Site Settings",
    desc: "Spreadsheet URL and website online/offline status.",
    icon: Settings,
  },
] as const;

function AdminDashboard() {
  return (
    <div className="min-w-0">
      <div className="mb-5 sm:mb-6">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber">Dashboard</div>
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl mt-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your storefront from one place.</p>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {CARDS.map(({ to, title, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-border bg-card p-4 sm:p-5 hover:border-amber/40 hover:shadow-[0_10px_30px_-15px_color-mix(in_oklab,var(--amber)_50%,transparent)] transition min-h-[112px] flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm shrink-0"
                style={{ backgroundColor: "color-mix(in oklab, var(--amber) 18%, transparent)", color: "var(--amber)" }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-amber" />
            </div>
            <h2 className="mt-3 font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
