-- =============================================================================
-- Newsletter double opt-in: подтверждение подписки по токену из письма
-- Применить: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/self_hosted_newsletter_confirm.sql
-- =============================================================================

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirm_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirm_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirm_token
  ON public.newsletter_subscribers (confirm_token);

-- Активная аудитория рассылки = подтвердившие и не отписавшиеся
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmed
  ON public.newsletter_subscribers (marketing_opt_in, confirmed_at, unsubscribed_at)
  WHERE marketing_opt_in = true
    AND confirmed_at IS NOT NULL
    AND unsubscribed_at IS NULL;

-- Ранее заведённые подписчики считаются подтверждёнными,
-- иначе после деплоя они молча выпадут из аудитории.
UPDATE public.newsletter_subscribers
SET confirmed_at = COALESCE(confirmed_at, created_at)
WHERE marketing_opt_in = true
  AND confirmed_at IS NULL;

-- -----------------------------------------------------------------------------
-- Заявка на подписку. Повторный вызов не плодит записи и не сбрасывает
-- подтверждение — возвращает токен для письма.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_newsletter_subscription(
  p_email TEXT,
  p_full_name TEXT DEFAULT '',
  p_source TEXT DEFAULT 'site'
)
RETURNS TABLE (
  confirm_token UUID,
  already_confirmed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(btrim(p_email));
  v_token UUID;
  v_confirmed TIMESTAMPTZ;
BEGIN
  IF v_email = '' OR position('@' IN v_email) = 0 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  INSERT INTO public.newsletter_subscribers AS s (email, full_name, source, marketing_opt_in)
  VALUES (v_email, COALESCE(btrim(p_full_name), ''), COALESCE(p_source, 'site'), false)
  ON CONFLICT (email) DO UPDATE
    SET
      full_name = CASE
        WHEN btrim(COALESCE(EXCLUDED.full_name, '')) <> '' THEN EXCLUDED.full_name
        ELSE s.full_name
      END,
      -- повторная заявка после отписки снова открывает подтверждение
      unsubscribed_at = CASE
        WHEN s.confirmed_at IS NULL THEN NULL
        ELSE s.unsubscribed_at
      END,
      confirm_token = COALESCE(s.confirm_token, gen_random_uuid()),
      confirm_sent_at = now(),
      updated_at = now()
  RETURNING s.confirm_token, s.confirmed_at INTO v_token, v_confirmed;

  RETURN QUERY SELECT v_token, (v_confirmed IS NOT NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.request_newsletter_subscription(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_newsletter_subscription(TEXT, TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- Подтверждение по ссылке из письма: только здесь включается marketing_opt_in
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_newsletter_subscription(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  UPDATE public.newsletter_subscribers
  SET
    marketing_opt_in = true,
    confirmed_at = COALESCE(confirmed_at, now()),
    unsubscribed_at = NULL,
    updated_at = now()
  WHERE confirm_token = p_token;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_newsletter_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(UUID) TO anon, authenticated, service_role;
