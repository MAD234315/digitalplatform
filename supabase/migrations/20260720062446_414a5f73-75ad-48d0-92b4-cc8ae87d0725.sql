CREATE POLICY "public can read proof images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'proofs');