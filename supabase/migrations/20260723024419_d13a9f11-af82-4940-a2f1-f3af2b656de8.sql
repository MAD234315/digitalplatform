
-- Tighten EXECUTE grants on SECURITY DEFINER functions.

-- Trigger-only functions: no role EXECUTE needed.
REVOKE ALL ON FUNCTION public.auto_grant_admin_madmaxhub9() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_app_settings_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_grant_admin_madmaxhub9() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_app_settings_updated_at() TO service_role;

-- Used inside RLS policies; only signed-in users need it.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Bootstrap RPC; only signed-in users.
REVOKE ALL ON FUNCTION public.claim_first_admin_for_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin_for_user(uuid) TO authenticated, service_role;

-- Intentionally public: catalogue settings (no PII, no rows).
REVOKE ALL ON FUNCTION public.get_public_app_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_app_settings() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_public_app_settings() IS
  'Intentionally callable by anon: returns only public catalogue settings (sheet_url, site_online). No PII.';

-- Intentionally public: aggregate admin bootstrap status for the login page.
REVOKE ALL ON FUNCTION public.get_admin_bootstrap_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_bootstrap_status() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_admin_bootstrap_status() IS
  'Intentionally callable by anon: returns only aggregate admin count for the setup vs sign-in gate. No user data.';
