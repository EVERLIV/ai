-- =============================================================================
-- Hotfix for agency managers / properties / storage (self-hosted)
-- Run once in SQL Editor on api.arendacity.com, then retry adding a manager.
-- Safe to repeat.
-- =============================================================================

-- 1) Manager specialties
ALTER TABLE public.agency_managers
  ADD COLUMN IF NOT EXISTS property_types TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.agency_managers.property_types IS
  'Типы объектов, с которыми работает менеджер (Офис, Квартира, …)';

-- 2) Properties ↔ agency / manager
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_manager_id UUID REFERENCES public.agency_managers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON public.properties (agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_manager_id ON public.properties (listing_manager_id);

-- Backfill agency_id from membership of submitter
UPDATE public.properties p
SET agency_id = m.agency_id
FROM public.agency_members m
WHERE m.user_id = p.submitted_by
  AND p.agency_id IS NULL;

-- 3) Public storage bucket for manager photos / logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-assets', 'agency-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can view agency assets" ON storage.objects;
CREATE POLICY "Anyone can view agency assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Authenticated upload agency assets" ON storage.objects;
CREATE POLICY "Authenticated upload agency assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Service role upload agency assets" ON storage.objects;
CREATE POLICY "Service role upload agency assets"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Authenticated update agency assets" ON storage.objects;
CREATE POLICY "Authenticated update agency assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Authenticated delete agency assets" ON storage.objects;
CREATE POLICY "Authenticated delete agency assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'agency-assets');

-- 4) Reload PostgREST schema cache (critical — иначе снова 400)
NOTIFY pgrst, 'reload schema';
