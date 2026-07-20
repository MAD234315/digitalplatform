-- Ensure the role enum contains every Admin Panel role used by the app.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- Repair notification kind support for all events the Admin Panel writes.
ALTER TABLE public.admin_notifications
  DROP CONSTRAINT IF EXISTS admin_notifications_kind_check;

ALTER TABLE public.admin_notifications
  ADD CONSTRAINT admin_notifications_kind_check
  CHECK (kind IN (
    'proof_uploaded',
    'proof_published',
    'proof_hidden',
    'admin_requested',
    'admin_approved',
    'admin_rejected',
    'admin_suspended',
    'admin_deleted'
  ));

-- Tighten public Data API grants while keeping the app-readable surfaces available.
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.admin_profiles FROM anon;
REVOKE ALL ON public.admin_requests FROM anon;
REVOKE ALL ON public.admin_audit_log FROM anon;
REVOKE ALL ON public.admin_notifications FROM anon;
REVOKE ALL ON public.login_attempts FROM anon;
REVOKE ALL ON public.role_permissions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.proofs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.site_settings FROM anon;

GRANT SELECT ON public.proofs TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_requests TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT SELECT ON public.login_attempts TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.proofs TO service_role;
GRANT ALL ON public.site_settings TO service_role;
GRANT ALL ON public.admin_profiles TO service_role;
GRANT ALL ON public.admin_requests TO service_role;
GRANT ALL ON public.admin_notifications TO service_role;
GRANT ALL ON public.admin_audit_log TO service_role;
GRANT ALL ON public.login_attempts TO service_role;
GRANT ALL ON public.role_permissions TO service_role;

-- Helper functions must exist and be callable where needed.
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;

-- Keep existing bootstrap RPC available only to signed-in users.
GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_super_admin() FROM anon;

-- Repair timestamp and notification/protection triggers if a previous migration did not install them.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS proofs_updated_at ON public.proofs;
CREATE TRIGGER proofs_updated_at
  BEFORE UPDATE ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS admin_profiles_updated ON public.admin_profiles;
CREATE TRIGGER admin_profiles_updated
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_proof_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
    VALUES ('proof_uploaded', NEW.id, NEW.title, 'New proof uploaded: ' || NEW.title);
  ELSIF TG_OP = 'UPDATE' AND NEW.published IS DISTINCT FROM OLD.published THEN
    IF NEW.published THEN
      INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
      VALUES ('proof_published', NEW.id, NEW.title, 'Proof published: ' || NEW.title);
    ELSE
      INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
      VALUES ('proof_hidden', NEW.id, NEW.title, 'Proof hidden: ' || NEW.title);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proofs_notify_insert ON public.proofs;
CREATE TRIGGER proofs_notify_insert
  AFTER INSERT ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.notify_proof_event();

DROP TRIGGER IF EXISTS proofs_notify_update ON public.proofs;
CREATE TRIGGER proofs_notify_update
  AFTER UPDATE OF published ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.notify_proof_event();

CREATE OR REPLACE FUNCTION public.notify_admin_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (kind, proof_id, proof_title, message)
  VALUES ('admin_requested', NULL, NEW.full_name,
    'New admin access request from ' || NEW.full_name || ' (' || NEW.email || ')');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_request ON public.admin_requests;
CREATE TRIGGER notify_admin_request
  AFTER INSERT ON public.admin_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_request();

CREATE OR REPLACE FUNCTION public.protect_super_admin_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS protect_super_admin_roles ON public.user_roles;
CREATE TRIGGER protect_super_admin_roles
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_roles();

CREATE OR REPLACE FUNCTION public.protect_super_admin_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS protect_super_admin_profile ON public.admin_profiles;
CREATE TRIGGER protect_super_admin_profile
  BEFORE UPDATE OR DELETE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_profile();

REVOKE EXECUTE ON FUNCTION public.notify_proof_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_super_admin_roles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_super_admin_profile() FROM PUBLIC, anon, authenticated;

-- Ensure default role permissions exist for every role.
INSERT INTO public.role_permissions (role, permission) VALUES
  ('super_admin','proofs.manage'),
  ('super_admin','settings.manage'),
  ('super_admin','status.manage'),
  ('super_admin','products.manage'),
  ('super_admin','users.manage'),
  ('super_admin','admins.manage'),
  ('super_admin','audit.view'),
  ('admin','proofs.manage'),
  ('admin','settings.manage'),
  ('admin','status.manage'),
  ('admin','products.manage'),
  ('editor','proofs.manage'),
  ('viewer','audit.view')
ON CONFLICT DO NOTHING;

-- Ensure Realtime can emit proof and notification changes without failing if already configured.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proofs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE public.proofs REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;