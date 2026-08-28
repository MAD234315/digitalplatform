-- Fix offer_banner: bucket creation + anon-safe RLS (has_role is not executable by anon)
-- Depends on 20260828092846_44b5ef51-5bc7-41dc-ada8-86118a1df4f9.sql

-- 1) Ensure storage bucket exists (private, signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-banners', 'offer-banners', false)
ON CONFLICT (id) DO NOTHING;

-- 2) Fix public/offer_banner RLS: anon cannot execute has_role (revoked in 20260723024419)
-- Original policy: USING (enabled = true OR public.has_role(...)) -> 42501 for anon
DROP POLICY IF EXISTS "offer_banner public read" ON public.offer_banner;

CREATE POLICY "offer_banner public read"
  ON public.offer_banner
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "offer_banner admin read"
  ON public.offer_banner
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure updated_at trigger still exists (idempotent guard: may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_offer_banner_updated_at'
  ) THEN
    CREATE TRIGGER trg_offer_banner_updated_at
      BEFORE UPDATE ON public.offer_banner
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 3) Reload PostgREST schema cache so new table/policy is visible without restart
NOTIFY pgrst, 'reload schema';
