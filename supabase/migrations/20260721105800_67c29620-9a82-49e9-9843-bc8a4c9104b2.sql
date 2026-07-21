
-- Public accessor for the two app_settings fields that the customer-facing
-- catalogue needs, so the /products path no longer requires the service-role key.
CREATE OR REPLACE FUNCTION public.get_public_app_settings()
RETURNS TABLE(sheet_url text, site_online boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sheet_url, site_online FROM public.app_settings WHERE id = 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_app_settings() TO anon, authenticated;
