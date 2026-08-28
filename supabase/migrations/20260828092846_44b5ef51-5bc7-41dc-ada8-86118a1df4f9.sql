-- Offer banner: homepage promotional media and copy managed from the admin panel.

CREATE TABLE IF NOT EXISTS public.offer_banner (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  media_path text,
  headline text,
  subline text,
  cta_text text,
  cta_link text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.offer_banner IS 'Singleton settings for the homepage offer banner.';

-- Seed a default disabled row so the homepage query never returns empty.
INSERT INTO public.offer_banner (id, enabled, media_type)
VALUES (1, false, 'image')
ON CONFLICT (id) DO NOTHING;

-- Data API grants: public reads, admins write, service_role full access.
GRANT SELECT ON public.offer_banner TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offer_banner TO authenticated;
GRANT ALL ON public.offer_banner TO service_role;

ALTER TABLE public.offer_banner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_banner public read"
  ON public.offer_banner
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "offer_banner admin write"
  ON public.offer_banner
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_offer_banner_updated_at
  BEFORE UPDATE ON public.offer_banner
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Storage policies: public read via signed URLs, admin write.
DROP POLICY IF EXISTS "offer_banners public select" ON storage.objects;
DROP POLICY IF EXISTS "offer_banners admin all" ON storage.objects;

CREATE POLICY "offer_banners public select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'offer-banners');

CREATE POLICY "offer_banners admin all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'offer-banners' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'offer-banners' AND public.has_role(auth.uid(), 'admin'));
