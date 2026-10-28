import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { getAdminBootstrapStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/setup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Setup — Digital Platform" },
      { name: "description", content: "Get started with Digital Platform administrator setup." },
      { property: "og:title", content: "Setup — Digital Platform" },
      { property: "og:description", content: "Get started with Digital Platform administrator setup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SetupRedirectPage,
});

function SetupRedirectPage() {
  const nav = useNavigate();
  const bootstrapFn = useServerFn(getAdminBootstrapStatus);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const setup = await bootstrapFn();
        if (!alive) return;
        nav({ to: setup.adminExists ? "/admin/login" : "/admin/setup", replace: true });
      } catch {
        if (alive) nav({ to: "/admin/login", replace: true });
      }
    })();
    return () => {
      alive = false;
    };
  }, [bootstrapFn, nav]);

  return (
    <PageShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    </PageShell>
  );
}