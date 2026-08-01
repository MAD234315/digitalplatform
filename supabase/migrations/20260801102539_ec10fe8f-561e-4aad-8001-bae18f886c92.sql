CREATE OR REPLACE FUNCTION public.is_published_proof_object(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proofs p
    WHERE p.published = true
      AND _name = ANY (p.image_urls)
  );
$$;

REVOKE ALL ON FUNCTION public.is_published_proof_object(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_published_proof_object(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Published proof files are readable" ON storage.objects;
CREATE POLICY "Published proof files are readable"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'proofs'
  AND public.is_published_proof_object(name)
);