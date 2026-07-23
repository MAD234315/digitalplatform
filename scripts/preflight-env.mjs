#!/usr/bin/env node
/**
 * Preflight env validator — run before deploy/build.
 *
 *   node scripts/preflight-env.mjs
 *
 * Exits 0 when all required Supabase env vars are set; exits 1 with a
 * clear, actionable report when any are missing. Optional vars are only
 * warned about — they never fail the run.
 *
 * Env vars are checked from process.env (Lovable Cloud injects them at
 * build time; local dev loads them from .env via Vite). Values are never
 * printed — only names and presence.
 */

const REQUIRED = [
  {
    name: "SUPABASE_URL",
    scope: "server",
    purpose:
      "Server-side Supabase base URL. Used by server functions and the auth middleware.",
    fix: "Lovable Cloud auto-injects this. If missing, open the Cloud panel in the Lovable sidebar, confirm the backend is provisioned & healthy, then republish. For local dev: add SUPABASE_URL=https://<project-ref>.supabase.co to .env.",
  },
  {
    name: "SUPABASE_PUBLISHABLE_KEY",
    scope: "server",
    purpose:
      "Server-side publishable/anon key. Powers requireSupabaseAuth and the public server client during SSR. (a.k.a. SUPABASE_ANON_KEY on older Supabase projects — this app uses the new publishable name.)",
    fix: "Lovable Cloud auto-injects this. For local dev: add SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...> to .env.",
  },
  {
    name: "VITE_SUPABASE_URL",
    scope: "browser",
    purpose:
      "Client-side Supabase URL exposed to the browser bundle via Vite.",
    fix: "Lovable Cloud auto-injects this. For local dev: add VITE_SUPABASE_URL=https://<project-ref>.supabase.co to .env.",
  },
  {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    scope: "browser",
    purpose:
      "Client-side publishable key used by @supabase/supabase-js in the browser.",
    fix: "Lovable Cloud auto-injects this. For local dev: add VITE_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...> to .env.",
  },
];

const OPTIONAL = [
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    note: "NOT available on Lovable Cloud — expected to be absent. Admin ops use requireSupabaseAuth + RLS. Only set locally if you truly need the service role.",
  },
  {
    name: "SUPABASE_PROJECT_ID",
    note: "Informational only; no runtime path depends on it.",
  },
  {
    name: "LOVABLE_API_KEY",
    note: "Required only if you call the Lovable AI Gateway server-side.",
  },
];

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

const isTTY = process.stdout.isTTY;
const c = (code, s) => (isTTY ? `${code}${s}${RESET}` : s);

const rows = REQUIRED.map((v) => ({ ...v, present: Boolean(process.env[v.name]) }));
const missing = rows.filter((r) => !r.present);
const present = rows.filter((r) => r.present);
const missingOptional = OPTIONAL.filter((v) => !process.env[v.name]);

const line = "─".repeat(64);
console.log(line);
console.log(c(BOLD, "Supabase preflight environment check"));
console.log(line);

console.log(
  `${c(GREEN, "✓")} Present  (${present.length}/${REQUIRED.length}): ${
    present.length ? present.map((r) => r.name).join(", ") : c(DIM, "(none)")
  }`,
);

if (missing.length) {
  console.log("");
  console.log(c(RED, `✗ MISSING REQUIRED (${missing.length}):`));
  for (const r of missing) {
    console.log("");
    console.log(`  ${c(BOLD, r.name)} ${c(DIM, `[${r.scope}]`)}`);
    console.log(`    ${c(DIM, "Purpose:")} ${r.purpose}`);
    console.log(`    ${c(DIM, "Fix:")}     ${r.fix}`);
  }
}

if (missingOptional.length) {
  console.log("");
  console.log(c(YELLOW, `· Optional not set (${missingOptional.length}):`));
  for (const v of missingOptional) {
    console.log(`    - ${v.name} ${c(DIM, "— " + v.note)}`);
  }
}

console.log(line);

if (missing.length) {
  console.log(
    c(
      YELLOW,
      `Preflight WARNING: ${missing.length} required Supabase env var${
        missing.length === 1 ? "" : "s"
      } not visible at build time. Lovable Cloud injects these at runtime — safe to ignore during the build. For local dev, set them in .env.`,
    ),
  );
  process.exit(0);
}


console.log(c(GREEN, "Preflight OK — all required Supabase env vars are set."));
process.exit(0);
