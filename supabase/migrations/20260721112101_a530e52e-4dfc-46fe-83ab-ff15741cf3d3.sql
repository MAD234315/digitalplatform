-- Public-safe aggregate: only returns the admin count. No PII, no rows.
-- Callable pre-auth so the admin login page can decide setup vs sign-in.
CREATE OR REPLACE FUNCTION public.get_admin_bootstrap_status()
RETURNS TABLE(admin_exists boolean, admin_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) AS admin_exists,
    (SELECT count(*)::int FROM public.user_roles WHERE role = 'admin'::public.app_role) AS admin_count;
$$;

COMMENT ON FUNCTION public.get_admin_bootstrap_status() IS
  'Returns only aggregate admin count for the admin login/setup page. Intentionally executable by anon; exposes no row data.';

REVOKE ALL ON FUNCTION public.get_admin_bootstrap_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_bootstrap_status() TO anon, authenticated, service_role;
