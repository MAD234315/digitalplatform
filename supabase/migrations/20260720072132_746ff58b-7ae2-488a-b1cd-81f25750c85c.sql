-- Remove open admin-claim RPCs; use bootstrapSuperAdmin (token-gated) instead.
DROP FUNCTION IF EXISTS public.claim_admin();
DROP FUNCTION IF EXISTS public.claim_super_admin();

-- Remove overly-broad public read on the proofs storage bucket.
-- Public access continues via server-generated signed URLs, which do not
-- require a SELECT policy on storage.objects.
DROP POLICY IF EXISTS "public can read proof images" ON storage.objects;
