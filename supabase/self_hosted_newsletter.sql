-- Newsletter: opt-in subscribers, campaigns, send log
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT DEFAULT '',
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  source TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active
  ON public.newsletter_subscribers (marketing_opt_in, unsubscribed_at)
  WHERE marketing_opt_in = true AND unsubscribed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token
  ON public.newsletter_subscribers (unsubscribe_token);

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta_label TEXT DEFAULT 'Смотреть каталог',
  cta_url TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed', 'partial')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  fail_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_campaign
  ON public.newsletter_sends (campaign_id, status);

CREATE OR REPLACE FUNCTION public.set_newsletter_subscribers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_newsletter_subscribers_updated_at();

-- Normalize email
CREATE OR REPLACE FUNCTION public.normalize_newsletter_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_subscribers_normalize_email ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_normalize_email
  BEFORE INSERT OR UPDATE OF email ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_newsletter_email();

-- Public one-click unsubscribe by token
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(p_token UUID)
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
    marketing_opt_in = false,
    unsubscribed_at = COALESCE(unsubscribed_at, now())
  WHERE unsubscribe_token = p_token
    AND unsubscribed_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_newsletter(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(UUID) TO anon, authenticated, service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_subscribers_admin_all ON public.newsletter_subscribers;
CREATE POLICY newsletter_subscribers_admin_all
  ON public.newsletter_subscribers
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

DROP POLICY IF EXISTS newsletter_campaigns_admin_all ON public.newsletter_campaigns;
CREATE POLICY newsletter_campaigns_admin_all
  ON public.newsletter_campaigns
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

DROP POLICY IF EXISTS newsletter_sends_admin_all ON public.newsletter_sends;
CREATE POLICY newsletter_sends_admin_all
  ON public.newsletter_sends
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campaigns TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_sends TO authenticated, service_role;
