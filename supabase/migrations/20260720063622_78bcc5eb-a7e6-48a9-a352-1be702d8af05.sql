
-- 2. Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

-- 3. admin_profiles
CREATE TABLE public.admin_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','rejected')),
  last_login_at timestamptz,
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.admin_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "super admin manage profiles" ON public.admin_profiles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER admin_profiles_updated BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. admin_requests
CREATE TABLE public.admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text,
  reason text NOT NULL,
  device_info text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_requests TO authenticated;
GRANT ALL ON public.admin_requests TO service_role;
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin manage requests" ON public.admin_requests FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "self read own request" ON public.admin_requests FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 5. role_permissions
CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "super admin manage role permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- Seed default permissions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('super_admin','proofs.manage'),('super_admin','settings.manage'),('super_admin','status.manage'),
  ('super_admin','products.manage'),('super_admin','users.manage'),('super_admin','admins.manage'),('super_admin','audit.view'),
  ('admin','proofs.manage'),('admin','settings.manage'),('admin','status.manage'),('admin','products.manage'),
  ('editor','proofs.manage'),
  ('viewer','audit.view')
ON CONFLICT DO NOTHING;

-- 6. has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;

-- 7. admin_audit_log (append-only)
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "authenticated insert own audit" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (actor_user_id = auth.uid());

-- 8. login_attempts
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_created_idx ON public.login_attempts (email, created_at DESC);
GRANT SELECT ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin read login attempts" ON public.login_attempts FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- 9. claim_super_admin bootstrap
CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n int; uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT count(*) INTO n FROM public.user_roles WHERE role = 'super_admin';
  IF n > 0 THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin') ON CONFLICT DO NOTHING;
  -- Ensure an active profile exists
  INSERT INTO public.admin_profiles (user_id, full_name, email, status)
  SELECT uid, COALESCE(u.raw_user_meta_data->>'full_name', u.email), u.email, 'active'
  FROM auth.users u WHERE u.id = uid
  ON CONFLICT (user_id) DO UPDATE SET status = 'active';
  RETURN true;
END;
$$;

-- 10. Protect super admin from role removal / profile suspension / deletion
CREATE OR REPLACE FUNCTION public.protect_super_admin_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n int;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'super_admin') OR
     (TG_OP = 'UPDATE' AND OLD.role = 'super_admin' AND NEW.role IS DISTINCT FROM 'super_admin') THEN
    SELECT count(*) INTO n FROM public.user_roles WHERE role = 'super_admin' AND user_id <> OLD.user_id;
    IF n = 0 THEN RAISE EXCEPTION 'Cannot remove the only super admin'; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER protect_super_admin_roles
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_roles();

CREATE OR REPLACE FUNCTION public.protect_super_admin_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_super_admin(OLD.user_id) THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete a super admin profile';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.status <> 'active' THEN
      RAISE EXCEPTION 'Cannot deactivate a super admin';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER protect_super_admin_profile
BEFORE UPDATE OR DELETE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_profile();

-- 11. Notify super admins on new admin request
CREATE OR REPLACE FUNCTION public.notify_admin_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
  VALUES ('admin_requested', NULL, NEW.full_name,
    'New admin access request from ' || NEW.full_name || ' (' || NEW.email || ')');
  RETURN NEW;
END;
$$;
CREATE TRIGGER notify_admin_request AFTER INSERT ON public.admin_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_request();

-- 12. Backfill: create admin_profiles for existing admins
INSERT INTO public.admin_profiles (user_id, full_name, email, status)
SELECT ur.user_id, COALESCE(u.raw_user_meta_data->>'full_name', u.email), u.email, 'active'
FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role IN ('admin','super_admin')
ON CONFLICT (user_id) DO NOTHING;

-- Promote the first existing admin to super_admin if none exists yet
DO $$
DECLARE first_admin uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    SELECT user_id INTO first_admin FROM public.user_roles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1;
    IF first_admin IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (first_admin, 'super_admin') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
