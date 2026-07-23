import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type CheckResult = {
  ok: boolean;
  host: string;
  checkedAt: string;
  env: {
    present: string[];
    missing: string[];
  };
  connectivity: {
    reachable: boolean;
    latencyMs: number | null;
    error: string | null;
    rpc: "get_admin_bootstrap_status" | null;
    adminExists: boolean | null;
  };
  remediation: string[];
};

export const Route = createFileRoute("/api/public/health/supabase")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const present: string[] = [];
        const missing: string[] = [];
        for (const key of REQUIRED) {
          if (process.env[key] && process.env[key]!.length > 0) present.push(key);
          else missing.push(key);
        }

        const remediation: string[] = [];
        if (missing.length > 0) {
          remediation.push(
            `Missing env vars on this deployment host (${url.host}): ${missing.join(", ")}. Add them in your hosting provider's environment/secret settings, then redeploy.`,
          );
        }

        let reachable = false;
        let latencyMs: number | null = null;
        let error: string | null = null;
        let adminExists: boolean | null = null;
        let rpcUsed: CheckResult["connectivity"]["rpc"] = null;

        const canProbe =
          !!process.env.SUPABASE_URL && !!process.env.SUPABASE_PUBLISHABLE_KEY;

        if (canProbe) {
          try {
            const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
            const sb = createClient(process.env.SUPABASE_URL!, key, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: {
                fetch: (input, init) => {
                  const h = new Headers(init?.headers);
                  if (
                    key.startsWith("sb_") &&
                    h.get("Authorization") === `Bearer ${key}`
                  ) {
                    h.delete("Authorization");
                  }
                  h.set("apikey", key);
                  return fetch(input, { ...init, headers: h });
                },
              },
            });
            const started = Date.now();
            const { data, error: rpcError } = await sb.rpc(
              "get_admin_bootstrap_status",
            );
            latencyMs = Date.now() - started;
            if (rpcError) throw new Error(rpcError.message);
            rpcUsed = "get_admin_bootstrap_status";
            reachable = true;
            const row = Array.isArray(data) ? data[0] : data;
            adminExists = row?.admin_exists ?? null;
          } catch (err) {
            error = err instanceof Error ? err.message : String(err);
            remediation.push(
              "Backend probe failed. Verify SUPABASE_URL matches the project, keys aren't rotated, and the Data API is reachable from this host.",
            );
          }
        } else {
          error = "Skipped probe: required env vars missing.";
        }

        const result: CheckResult = {
          ok: missing.length === 0 && reachable,
          host: url.host,
          checkedAt: new Date().toISOString(),
          env: { present, missing },
          connectivity: {
            reachable,
            latencyMs,
            error,
            rpc: rpcUsed,
            adminExists,
          },
          remediation,
        };

        return new Response(JSON.stringify(result, null, 2), {
          status: result.ok ? 200 : 503,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
