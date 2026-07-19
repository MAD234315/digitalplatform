
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

-- Bootstrap: first signed-in user can claim admin if no admins exist
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count > 0 THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin');
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- updated_at helper
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

-- Site settings
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admins can insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES
  ('site_status', '"online"'::jsonb),
  ('spreadsheet_url', '""'::jsonb);

-- Proofs
CREATE TABLE public.proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_path text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.proofs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT ALL ON public.proofs TO service_role;

ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read published proofs"
  ON public.proofs FOR SELECT
  TO anon, authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can insert proofs"
  ON public.proofs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can update proofs"
  ON public.proofs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete proofs"
  ON public.proofs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX proofs_published_created_idx ON public.proofs (published, created_at DESC);

CREATE TRIGGER proofs_updated_at
  BEFORE UPDATE ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
