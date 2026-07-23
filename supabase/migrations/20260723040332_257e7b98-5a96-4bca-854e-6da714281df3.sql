CREATE OR REPLACE FUNCTION public.list_admin_users_for_admin()
RETURNS TABLE(user_id uuid, email text, role_created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    ur.user_id,
    au.email::text,
    ur.created_at AS role_created_at,
    au.last_sign_in_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'admin'::public.app_role
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY ur.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_by_email_for_admin(_email text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user record;
  normalized_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  normalized_email := lower(trim(coalesce(_email, '')));
  IF normalized_email = '' THEN
    RAISE EXCEPTION 'Email is required.';
  END IF;

  SELECT au.id, au.email::text
  INTO target_user
  FROM auth.users au
  WHERE lower(au.email) = normalized_email
  LIMIT 1;

  IF target_user.id IS NULL THEN
    RAISE EXCEPTION 'No account found for %. Ask them to sign up first, then try again.', normalized_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user.id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN QUERY SELECT target_user.id::uuid, target_user.email::text;
END;
$$;

REVOKE ALL ON FUNCTION public.list_admin_users_for_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_by_email_for_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email_for_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_users_for_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email_for_admin(text) TO service_role;

COMMENT ON FUNCTION public.list_admin_users_for_admin() IS 'Admin-only helper that exposes admin account emails for the admin management screen.';
COMMENT ON FUNCTION public.grant_admin_by_email_for_admin(text) IS 'Admin-only helper that grants admin role to an existing account by email.';