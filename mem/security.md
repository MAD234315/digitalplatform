---
name: Security posture
description: Intentional exceptions to Supabase security scanner rules for this project
type: constraint
---
# Anon-executable SECURITY DEFINER functions (intentional)

Two `public` SECURITY DEFINER functions are intentionally granted EXECUTE to `anon` and must stay that way. Do NOT flag or "fix" them:

- `public.get_public_app_settings()` — returns only whitelisted safe columns (sheet_url, site_online, reviews_sheet_url). Powers anon SSR loading of catalogue + reviews.
- `public.get_admin_bootstrap_status()` — returns only `(admin_exists boolean, admin_count int)`. Powers /admin/setup pre-auth gating.

All other SECURITY DEFINER functions (`auto_grant_admin_madmaxhub9`, `claim_first_admin_for_user`, `has_role`) must keep EXECUTE revoked from `anon`. **Why:** switching the two public RPCs to SECURITY INVOKER would require broad anon SELECT policies on `app_settings` / `user_roles`, which is a worse posture than the current narrow function surface.
