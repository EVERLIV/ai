-- =============================================================================
-- Agency reviews: auth-only insert + pending moderation
-- Run after self_hosted_agency_reviews.sql (hotfix for already-applied DBs)
-- =============================================================================

ALTER TABLE public.agency_reviews
  ALTER COLUMN status SET DEFAULT 'pending'::public.agency_review_status;

DROP POLICY IF EXISTS "Anyone can insert agency reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Authenticated insert pending agency reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Public read published agency reviews" ON public.agency_reviews;
DROP POLICY IF EXISTS "Authors read own agency reviews" ON public.agency_reviews;

CREATE POLICY "Public read published agency reviews"
  ON public.agency_reviews FOR SELECT
  USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.is_agency_member(agency_id)
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

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

-- Keep admin manage policy (recreate if missing)
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

COMMENT ON TABLE public.agency_reviews IS
  'Reviews: authenticated users create pending; admins publish/reject';
