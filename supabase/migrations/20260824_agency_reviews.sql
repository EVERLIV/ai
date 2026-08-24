-- =============================================================================
-- Agency / manager reviews + cached rating fields
-- Self-hosted: run after self_hosted_agencies.sql
-- Mirror: supabase/migrations/20260824_agency_reviews.sql
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.agency_review_status AS ENUM ('published', 'pending', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_minutes INTEGER NOT NULL DEFAULT 12;

ALTER TABLE public.agency_managers
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_minutes INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS about TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.agency_managers(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_email TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT NOT NULL DEFAULT '',
  status public.agency_review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_reviews_agency
  ON public.agency_reviews (agency_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_reviews_manager
  ON public.agency_reviews (manager_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.refresh_agency_review_stats(p_agency_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.agencies a
  SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.agency_reviews r
      WHERE r.agency_id = p_agency_id AND r.status = 'published'
    ), 0),
    reviews_count = COALESCE((
      SELECT COUNT(*)::int
      FROM public.agency_reviews r
      WHERE r.agency_id = p_agency_id AND r.status = 'published'
    ), 0),
    updated_at = now()
  WHERE a.id = p_agency_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_manager_review_stats(p_manager_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF p_manager_id IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.agency_managers m
  SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.agency_reviews r
      WHERE r.manager_id = p_manager_id AND r.status = 'published'
    ), 0),
    reviews_count = COALESCE((
      SELECT COUNT(*)::int
      FROM public.agency_reviews r
      WHERE r.manager_id = p_manager_id AND r.status = 'published'
    ), 0),
    updated_at = now()
  WHERE m.id = p_manager_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_agency_reviews_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_agency UUID;
  v_manager UUID;
  v_old_agency UUID;
  v_old_manager UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_agency := OLD.agency_id;
    v_manager := OLD.manager_id;
    PERFORM public.refresh_agency_review_stats(v_agency);
    PERFORM public.refresh_manager_review_stats(v_manager);
    RETURN OLD;
  END IF;

  v_agency := NEW.agency_id;
  v_manager := NEW.manager_id;
  PERFORM public.refresh_agency_review_stats(v_agency);
  PERFORM public.refresh_manager_review_stats(v_manager);

  IF TG_OP = 'UPDATE' THEN
    v_old_agency := OLD.agency_id;
    v_old_manager := OLD.manager_id;
    IF v_old_agency IS DISTINCT FROM v_agency THEN
      PERFORM public.refresh_agency_review_stats(v_old_agency);
    END IF;
    IF v_old_manager IS DISTINCT FROM v_manager THEN
      PERFORM public.refresh_manager_review_stats(v_old_manager);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agency_reviews_stats_trg ON public.agency_reviews;
CREATE TRIGGER agency_reviews_stats_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_agency_reviews_stats();

ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agency_reviews
  ALTER COLUMN status SET DEFAULT 'pending'::public.agency_review_status;

DROP POLICY IF EXISTS "Public read published agency reviews" ON public.agency_reviews;
CREATE POLICY "Public read published agency reviews"
  ON public.agency_reviews FOR SELECT
  USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.is_agency_member(agency_id)
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can insert agency reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Authenticated insert pending agency reviews" ON public.agency_reviews;
CREATE POLICY "Authenticated insert pending agency reviews"
  ON public.agency_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND length(trim(author_name)) >= 2
    AND length(trim(body)) >= 5
    AND status = 'pending'
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins manage agency reviews" ON public.agency_reviews;
CREATE POLICY "Admins manage agency reviews"
  ON public.agency_reviews FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

REVOKE INSERT ON public.agency_reviews FROM anon;
GRANT SELECT ON public.agency_reviews TO anon, authenticated;
GRANT INSERT ON public.agency_reviews TO authenticated;
GRANT SELECT ON public.agencies TO anon, authenticated;
GRANT SELECT ON public.agency_managers TO anon, authenticated;

COMMENT ON TABLE public.agency_reviews IS
  'Reviews: authenticated users create pending; admins publish/reject';
