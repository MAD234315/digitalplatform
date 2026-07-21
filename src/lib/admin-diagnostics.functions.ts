/**
 * Admin diagnostics server function.
 *
 * Reports:
 *  - Which required env vars are present on the server (names only, never
 *    the values).
 *  - Whether the current caller is authenticated and an admin.
 *  - Live HTTP health for the main public routes and API endpoints,
 *    fetched server-side against the current request's origin.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const OPTIONAL_ENV = [
  "LOVABLE_API_KEY",
  "ADMIN_BOOTSTRAP_TOKEN",
  "SUPABASE_DB_URL",
] as const;

const ROUTES_TO_CHECK = [
  { path: "/", label: "Home" },
  { path: "/products", label: "Catalogue" },
  { path: "/proof-gallery", label: "Proof Gallery" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/faq", label: "FAQ" },
  { path: "/auth", label: "Sign in" },
  { path: "/admin", label: "Admin" },
  { path: "/sitemap.xml", label: "Sitemap" },
  { path: "/robots.txt", label: "Robots" },
] as const;

export type EnvCheck = { name: string; present: boolean; required: boolean };
export type RouteCheck = {
  path: string;
  label: string;
  status: number | null;
  ok: boolean;
  ms: number;
  error?: string;
};

export type DiagnosticsReport = {
  generatedAt: string;
  origin: string;
  auth: {
    userId: string;
    email: string | null;
    isAdmin: boolean;
    adminCount: number;
  };
  db: {
    reachable: boolean;
    error?: string;
    appSettings: { sheetUrlConfigured: boolean; siteOnline: boolean } | null;
  };
  env: EnvCheck[];
  routes: RouteCheck[];
};

async function checkRoute(origin: string, path: string, label: string): Promise<RouteCheck> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${origin}${path}`, {
      method: "GET",
      redirect: "manual",
      signal: ctrl.signal,
      headers: { "user-agent": "AdminDiagnostics/1.0" },
    });
    return {
      path,
      label,
      status: res.status,
      ok: res.status < 400 || (res.status >= 300 && res.status < 400),
      ms: Date.now() - started,
    };
  } catch (e) {
    return {
      path,
      label,
      status: null,
      ok: false,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

export const getAdminDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiagnosticsReport> => {
    // Role check via the RLS-protected user_roles table (never trust the client).
    const { data: roleRow, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Forbidden: admin only");

    const req = getRequest();
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    // Env presence (names only, no values).
    const env: EnvCheck[] = [
      ...REQUIRED_ENV.map((n) => ({ name: n, present: Boolean(process.env[n]), required: true })),
      ...OPTIONAL_ENV.map((n) => ({ name: n, present: Boolean(process.env[n]), required: false })),
    ];

    // Caller metadata + admin count.
    let email: string | null = null;
    let adminCount = 0;
    let dbReachable = true;
    let dbError: string | undefined;
    let appSettings: { sheetUrlConfigured: boolean; siteOnline: boolean } | null = null;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: u }, cRes, sRes] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(context.userId),
        supabaseAdmin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin"),
        supabaseAdmin
          .from("app_settings")
          .select("sheet_url, site_online")
          .eq("id", 1)
          .maybeSingle(),
      ]);
      email = u?.user?.email ?? null;
      adminCount = cRes.count ?? 0;
      appSettings = sRes.data
        ? {
            sheetUrlConfigured: Boolean((sRes.data.sheet_url ?? "").trim()),
            siteOnline: Boolean(sRes.data.site_online),
          }
        : null;
    } catch (e) {
      dbReachable = false;
      dbError = e instanceof Error ? e.message : String(e);
    }

    // Run route checks in parallel.
    const routes = await Promise.all(
      ROUTES_TO_CHECK.map((r) => checkRoute(origin, r.path, r.label)),
    );

    return {
      generatedAt: new Date().toISOString(),
      origin,
      auth: { userId: context.userId, email, isAdmin: true, adminCount },
      db: { reachable: dbReachable, error: dbError, appSettings },
      env,
      routes,
    };
  });
