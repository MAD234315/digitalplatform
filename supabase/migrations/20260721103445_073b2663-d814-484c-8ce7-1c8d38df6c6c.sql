CREATE OR REPLACE FUNCTION public.auto_grant_admin_madmaxhub9()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'madmaxhub9@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_grant_admin_madmaxhub9_insert ON auth.users;
CREATE TRIGGER auto_grant_admin_madmaxhub9_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_admin_madmaxhub9();

DROP TRIGGER IF EXISTS auto_grant_admin_madmaxhub9_update ON auth.users;
CREATE TRIGGER auto_grant_admin_madmaxhub9_update
AFTER UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_admin_madmaxhub9();

-- Backfill for existing account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'madmaxhub9@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;