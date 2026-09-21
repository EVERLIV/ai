-- Newsletter queue: settings kill-switch, campaign payload, pending drain
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sending_enabled BOOLEAN NOT NULL DEFAULT false,
  batch_size INT NOT NULL DEFAULT 25
    CHECK (batch_size >= 1 AND batch_size <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.newsletter_settings (id, sending_enabled, batch_size)
VALUES (1, false, 25)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS template_key TEXT NOT NULL DEFAULT 'partner_kp',
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.newsletter_campaigns
  DROP CONSTRAINT IF EXISTS newsletter_campaigns_status_check;

ALTER TABLE public.newsletter_campaigns
  ADD CONSTRAINT newsletter_campaigns_status_check
  CHECK (status IN ('draft', 'queued', 'sending', 'sent', 'failed', 'partial'));

ALTER TABLE public.newsletter_sends
  DROP CONSTRAINT IF EXISTS newsletter_sends_status_check;

ALTER TABLE public.newsletter_sends
  ADD CONSTRAINT newsletter_sends_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped'));

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_pending
  ON public.newsletter_sends (created_at ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_processing
  ON public.newsletter_sends (created_at ASC)
  WHERE status = 'processing';

ALTER TABLE public.newsletter_sends
  ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ;

-- Claim a batch for the cron worker (SKIP LOCKED → no double-send)
CREATE OR REPLACE FUNCTION public.claim_newsletter_queue(p_limit INT DEFAULT 25)
RETURNS TABLE (
  id UUID,
  campaign_id UUID,
  subscriber_id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    p_limit := 25;
  END IF;
  IF p_limit > 100 THEN
    p_limit := 100;
  END IF;

  RETURN QUERY
  WITH picked AS (
    SELECT s.id
    FROM public.newsletter_sends s
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.newsletter_sends s
  SET status = 'processing', processing_at = now()
  FROM picked
  WHERE s.id = picked.id
  RETURNING s.id, s.campaign_id, s.subscriber_id, s.email;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_newsletter_queue(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_newsletter_queue(INT) TO service_role;

-- Re-queue rows stuck in processing (>15 min)
CREATE OR REPLACE FUNCTION public.reset_stale_newsletter_processing(p_minutes INT DEFAULT 15)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  UPDATE public.newsletter_sends
  SET status = 'pending', processing_at = NULL
  WHERE status = 'processing'
    AND COALESCE(processing_at, created_at) < now() - make_interval(mins => GREATEST(COALESCE(p_minutes, 15), 5));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_stale_newsletter_processing(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_stale_newsletter_processing(INT) TO service_role;

ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_settings_admin_all ON public.newsletter_settings;
CREATE POLICY newsletter_settings_admin_all
  ON public.newsletter_settings
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

GRANT SELECT, INSERT, UPDATE ON public.newsletter_settings TO authenticated, service_role;
