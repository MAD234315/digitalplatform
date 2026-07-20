DROP POLICY IF EXISTS "anyone can read published proofs" ON public.proofs;

CREATE POLICY "public can read published proofs"
  ON public.proofs FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "proof managers can read all proofs"
  ON public.proofs FOR SELECT
  TO authenticated
  USING (public.has_permission(auth.uid(), 'proofs.manage'));
