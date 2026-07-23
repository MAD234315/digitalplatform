
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS reviews_sheet_url text NOT NULL DEFAULT '';

DROP FUNCTION IF EXISTS public.get_public_app_settings();

CREATE FUNCTION public.get_public_app_settings()
RETURNS TABLE(sheet_url text, site_online boolean, reviews_sheet_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sheet_url, site_online, reviews_sheet_url FROM public.app_settings WHERE id = 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_app_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_app_settings() TO anon, authenticated, service_role;
