/**
 * Server-only startup diagnostics for Supabase environment variables.
 *
 * Runs once when the server module graph loads. Logs a clear, actionable
 * report of which vars are present / missing and where to set them.
 *
 * This file is `.server.ts` — it is blocked from client bundles by the
 * build. Import it from `src/start.ts` (server entry) only.
 */

type VarSpec = {
  name: string;
  required: boolean;
  purpose: string;
};

const SUPABASE_VARS: VarSpec[] = [
  {
    name: "SUPABASE_URL",
    required: true,
    purpose: "Server-side Supabase base URL. Auto-injected by Lovable Cloud.",
  },
  {
    name: "SUPABASE_PUBLISHABLE_KEY",
    required: true,
    purpose:
      "Server-side publishable/anon key used by server functions and the auth middleware. Auto-injected by Lovable Cloud.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: false,
    purpose:
      "Service-role key (bypasses RLS). NOT available on Lovable Cloud. Admin operations fall back to user-scoped RLS via requireSupabaseAuth.",
  },
  {
    name: "SUPABASE_PROJECT_ID",
    required: false,
    purpose: "Supabase project ref. Optional, informational.",
  },
];

let reported = false;

export function reportSupabaseEnv(): void {
  if (reported) return;
  reported = true;

  const rows = SUPABASE_VARS.map((v) => ({
    ...v,
    present: Boolean(process.env[v.name]),
  }));

  const missingRequired = rows.filter((r) => r.required && !r.present);
  const missingOptional = rows.filter((r) => !r.required && !r.present);
  const present = rows.filter((r) => r.present).map((r) => r.name);

  const lines: string[] = [];
  lines.push("──────────────────────────────────────────────────────────────");
  lines.push("[startup] Supabase environment check");
  lines.push("──────────────────────────────────────────────────────────────");
  lines.push(`  ✓ Present:  ${present.length ? present.join(", ") : "(none)"}`);

  if (missingRequired.length) {
    lines.push("");
    lines.push("  ✗ MISSING REQUIRED:");
    for (const r of missingRequired) {
      lines.push(`      - ${r.name}`);
      lines.push(`          ${r.purpose}`);
    }
  }

  if (missingOptional.length) {
    lines.push("");
    lines.push("  · Missing optional:");
    for (const r of missingOptional) {
      lines.push(`      - ${r.name}`);
      lines.push(`          ${r.purpose}`);
    }
  }

  if (missingRequired.length) {
    lines.push("");
    lines.push("  Where to set these:");
    lines.push("    • Lovable Cloud (managed): SUPABASE_URL and");
    lines.push("      SUPABASE_PUBLISHABLE_KEY are auto-injected. If they are");
    lines.push("      missing, open the Cloud panel in the Lovable sidebar and");
    lines.push("      confirm the backend is provisioned/healthy, then republish.");
    lines.push("    • Local dev: add them to the project's .env file at the");
    lines.push("      repo root (never commit the service-role key).");
    lines.push("    • SUPABASE_SERVICE_ROLE_KEY is NOT accessible on Lovable");
    lines.push("      Cloud — do not attempt to set it there. Use user-scoped");
    lines.push("      requireSupabaseAuth server functions instead.");
  }

  lines.push("──────────────────────────────────────────────────────────────");

  const output = lines.join("\n");
  if (missingRequired.length) console.error(output);
  else console.info(output);
}

// Run on import so it fires at server startup.
reportSupabaseEnv();
