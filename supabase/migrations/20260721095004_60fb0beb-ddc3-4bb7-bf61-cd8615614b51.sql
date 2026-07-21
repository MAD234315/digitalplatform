REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO service_role;