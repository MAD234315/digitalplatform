## What the linter is flagging

Five SECURITY DEFINER functions in `public` are callable by `anon` and/or `authenticated`. Some of that access is legitimate; most is unnecessary and just inherited from Postgres' default `PUBLIC` grant.

Current SECURITY DEFINER functions:

| Function | Purpose | Needs public/anon execute? |
| --- | --- | --- |
| `get_public_app_settings()` | Powers the public catalogue | **Yes — intentional** |
| `get_admin_bootstrap_status()` | Powers the login "first-time setup" gate | **Yes — intentional** |
| `has_role(uuid, app_role)` | Used inside RLS policies | Only `authenticated` (RLS runs as the caller) |
| `claim_first_admin_for_user(uuid)` | One-time bootstrap RPC | Only `authenticated` |
| `auto_grant_admin_madmaxhub9()` | Trigger function | **No — trigger only** |
| `set_updated_at()` / `set_app_settings_updated_at()` | Trigger functions | **No — trigger only** |

## Fix (single migration)

Tighten grants — no signature changes, no behavior changes:

- `REVOKE ALL ... FROM PUBLIC, anon, authenticated` on **every** SECURITY DEFINER function above.
- `GRANT EXECUTE` back only where needed:
  - `get_public_app_settings()` → `anon, authenticated, service_role`
  - `get_admin_bootstrap_status()` → `anon, authenticated, service_role`
  - `has_role(uuid, app_role)` → `authenticated, service_role`
  - `claim_first_admin_for_user(uuid)` → `authenticated, service_role`
  - Trigger functions → `service_role` only (triggers don't need role EXECUTE — the trigger fires under table privileges).

## Expected linter outcome

- The three "signed-in users can execute" warnings will clear (has_role/claim/trigger fns no longer exposed to `authenticated`).
- Two "public can execute" warnings will remain and are **intentional and safe**: both functions return only public catalogue data / an aggregate admin count, never rows or PII. I'll add a `COMMENT ON FUNCTION` explaining that so future scans have context.

## Files

- One new migration: revokes + regrants only.
- No app code changes.

## Verification

- Re-run the Supabase linter after the migration; expect 3 warnings resolved, 2 intentional ones remaining with clear comments.
- Smoke-test: `/products` still loads, `/admin/login` still shows the correct setup vs sign-in state, `/admin/setup` claim still works after signing in.
