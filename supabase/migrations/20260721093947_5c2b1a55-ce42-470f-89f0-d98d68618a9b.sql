
-- Clean up old admin infra
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;
DROP TABLE IF EXISTS public.admin_requests CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.proofs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

DROP FUNCTION IF EXISTS public.protect_super_admin_profile() CASCADE;
DROP FUNCTION IF EXISTS public.protect_super_admin_roles() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_request() CASCADE;
DROP FUNCTION IF EXISTS public.notify_proof_event() CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin');

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles admins read all" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles self read" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_roles admins insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admins delete" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- claim_first_admin RPC
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- app_settings
CREATE TABLE public.app_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  sheet_url text NOT NULL DEFAULT '',
  site_online boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings admins read" ON public.app_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "app_settings admins update" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_app_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_app_settings_updated_at();

-- spreadsheet_url_audit
CREATE TABLE public.spreadsheet_url_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL CHECK (action IN ('set','update','revoke')),
  old_url text,
  new_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.spreadsheet_url_audit TO authenticated;
GRANT ALL ON public.spreadsheet_url_audit TO service_role;
ALTER TABLE public.spreadsheet_url_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admins read" ON public.spreadsheet_url_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit admins insert" ON public.spreadsheet_url_audit
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- proofs
CREATE TABLE public.proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_urls text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT '',
  validity text NOT NULL DEFAULT '',
  delivery text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proofs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT ALL ON public.proofs TO service_role;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proofs anon read published" ON public.proofs
  FOR SELECT TO anon USING (published = true);
CREATE POLICY "proofs authenticated read" ON public.proofs
  FOR SELECT TO authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proofs admins insert" ON public.proofs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proofs admins update" ON public.proofs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proofs admins delete" ON public.proofs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_proofs_updated_at BEFORE UPDATE ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for 'proofs' bucket
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname ILIKE '%proof%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "proofs bucket admins full access" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));
