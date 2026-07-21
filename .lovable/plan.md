## Problem

The admin login page shows "Could not verify setup status" because `getAdminBootstrapStatus` (in `src/lib/admin.functions.ts`) calls `supabaseAdmin` — which needs `SUPABASE_SERVICE_ROLE_KEY`. Lovable Cloud does not inject that key, so the server function throws at first use and the login page falls into its catch branch.

This is the same class of issue we already fixed for the catalogue's `app_settings` read (we swapped `supabaseAdmin` for a `SECURITY DEFINER` RPC callable with the publishable key). We'll apply the same pattern here.

## Fix

1. **New database RPC** `public.get_admin_bootstrap_status()`
   - Returns only aggregate info: `admin_exists boolean, admin_count int`.
   - `SECURITY DEFINER`, `STABLE`, `SET search_path = public`.
   - `GRANT EXECUTE` to `anon`, `authenticated`, `service_role` (bootstrap check must work before anyone signs in).
   - No row data leaks — only a count, exactly what the login page needs.

2. **Refactor `getAdminBootstrapStatus`** in `src/lib/admin.functions.ts`
   - Replace the `supabaseAdmin.from("user_roles").select(...)` call with a publishable-key server client (same pattern as `sheet-products.functions.ts`) calling `rpc("get_admin_bootstrap_status")`.
   - No more dependency on the service-role key on Lovable Cloud.

3. **Login-page error clarity** (`src/components/admin/AdminLoginPage.tsx`)
   - The initial `checking` failure currently surfaces a generic hint. Extend the existing new error card to show the exact server-fn error message and code when the bootstrap check fails, so any future backend hiccup is diagnosable at a glance.

## Security note (linter warning you already see)

The scanner flags "Public Can Execute SECURITY DEFINER Function". This RPC is intentionally callable pre-auth (the login page needs to know whether to show "Create first admin"), and it only returns an aggregate boolean/count — no PII, no rows. We'll document that in the migration comment. If you'd rather avoid the warning entirely, the alternative is to expose a narrow anon `SELECT count` policy on `user_roles`, which is strictly worse.

## Files touched

- `supabase/migrations/<timestamp>_admin_bootstrap_rpc.sql` (new)
- `src/lib/admin.functions.ts` (rewrite `getAdminBootstrapStatus` handler only)
- `src/components/admin/AdminLoginPage.tsx` (richer error card on the initial check)

## Verification

- After deploy, hit `/admin/login` in an incognito tab — the page should load, show either the login form (admin exists) or the setup CTA (no admin), with no red "Could not verify setup status" banner.
- Invoke the server fn directly to confirm 200 + `{ adminExists, adminCount, setupAllowed }`.
