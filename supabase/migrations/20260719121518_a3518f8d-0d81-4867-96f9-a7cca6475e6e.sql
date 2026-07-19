
CREATE POLICY "admins can upload proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can update proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can read proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));
