DROP FUNCTION IF EXISTS public.claim_first_admin();

CREATE OR REPLACE FUNCTION public.claim_first_admin_for_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Serialize all bootstrap attempts so two concurrent setup requests cannot
  -- both observe an empty admin list.
  PERFORM pg_advisory_xact_lock(hashtext('digital_platform_first_admin_bootstrap'));

  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin_for_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_first_admin_for_user(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_first_admin_for_user(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin_for_user(uuid) TO service_role;