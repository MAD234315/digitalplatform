# Deployment Checklist — Supabase Environment

Quick pre-deploy sanity check for the Supabase env vars this app depends on.
On Lovable Cloud, the required vars are auto-injected; this list is what to
verify (and what breaks if any are missing).

## Required

| Variable | Scope | If missing |
|---|---|---|
| `SUPABASE_URL` | server | Server functions throw `Missing Supabase environment variable(s): SUPABASE_URL`. `/products` and every server route/RPC using the publishable or auth-middleware client fail. Startup log prints `✗ MISSING REQUIRED`. |
| `SUPABASE_PUBLISHABLE_KEY` | server | `requireSupabaseAuth` middleware + the server publishable client can't initialize. Authenticated server functions return 500; public server reads (e.g. `get_public_app_settings`) fall back to defaults, so the catalogue loads with the default sheet URL and site-online = true. |
| `VITE_SUPABASE_URL` | client (browser) | Browser Supabase client can't initialize. Sign-in, sign-up, password reset, realtime subscriptions, and any `supabase.*` call from React code throw at first use. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client (browser) | Same failure surface as `VITE_SUPABASE_URL` — browser client throws on first call. |

## Optional

| Variable | Scope | If missing |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | server | **Not available on Lovable Cloud — expected to be absent there.** Any code path that still calls `supabaseAdmin` (admin panel writes, storage uploads, `auth.admin.*`, spreadsheet audit inserts) throws `Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY`. Use `requireSupabaseAuth` + RLS instead where possible. |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | both | Informational only. No runtime behavior depends on it today. |
| `LOVABLE_API_KEY` | server | Lovable AI Gateway calls (if any) return 401. No effect on Supabase paths. |

## Where to set them

- **Lovable Cloud (production/preview):** `SUPABASE_URL` and
  `SUPABASE_PUBLISHABLE_KEY` (plus their `VITE_` twins) are auto-injected.
  If they show as missing, open the Cloud panel in the Lovable sidebar,
  confirm the backend is provisioned and healthy, then republish.
- **Local dev:** add them to `.env` at the repo root. Never commit
  `SUPABASE_SERVICE_ROLE_KEY`.
- **`SUPABASE_SERVICE_ROLE_KEY`:** cannot be set on Lovable Cloud. Do not
  add it there.

## Verify after deploy

1. Check server startup logs for the `[startup] Supabase environment check`
   block — it lists Present vs Missing at boot.
2. Open `/products` — should render the catalogue without a
   `Missing Supabase environment variable(s)` toast.
3. Open `/auth` and sign in — confirms the browser client + auth-middleware
   bearer flow both work.
4. Open `/admin` as an admin user — confirms authenticated server functions
   and RLS-scoped reads.
