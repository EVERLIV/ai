-- Mirror of self_hosted_agency_reviews_reply.sql
-- =============================================================================

ALTER TABLE public.agency_reviews
  ADD COLUMN IF NOT EXISTS reply_body TEXT,
  ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reply_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.reply_to_agency_review(
  p_review_id UUID,
  p_reply TEXT
)
RETURNS public.agency_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_row public.agency_reviews;
  v_text TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Войдите, чтобы ответить на отзыв';
  END IF;

  v_text := trim(COALESCE(p_reply, ''));
  IF length(v_text) < 2 THEN
    RAISE EXCEPTION 'Напишите ответ подробнее';
  END IF;
  IF length(v_text) > 2000 THEN
    RAISE EXCEPTION 'Ответ слишком длинный (макс. 2000 символов)';
  END IF;

  SELECT * INTO v_row
  FROM public.agency_reviews
  WHERE id = p_review_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Отзыв не найден';
  END IF;

  IF NOT public.is_agency_member(v_row.agency_id, auth.uid())
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'Нет доступа к отзывам этого агентства';
  END IF;

  UPDATE public.agency_reviews
  SET
    reply_body = v_text,
    reply_at = now(),
    reply_by = auth.uid(),
    updated_at = now()
  WHERE id = p_review_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reply_to_agency_review(UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Agency members reply to reviews" ON public.agency_reviews;
CREATE POLICY "Agency members reply to reviews"
  ON public.agency_reviews FOR UPDATE
  TO authenticated
  USING (
    public.is_agency_member(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.is_agency_member(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

GRANT UPDATE ON public.agency_reviews TO authenticated;
