-- Agency Telegram bot: per-agency group notifications
-- Self-hosted mirror: supabase/self_hosted_agency_telegram.sql

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_chat_title TEXT,
  ADD COLUMN IF NOT EXISTS telegram_connect_code TEXT,
  ADD COLUMN IF NOT EXISTS telegram_connect_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS telegram_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS telegram_notify_leads BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_notify_views BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_notify_moderation BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_telegram_chat_id
  ON public.agencies (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agencies_telegram_connect_code
  ON public.agencies (telegram_connect_code)
  WHERE telegram_connect_code IS NOT NULL;

-- Event log for property views (used by StatsTab)
CREATE TABLE IF NOT EXISTS public.crm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source_page TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_events_object_id ON public.crm_events (object_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_created_at ON public.crm_events (created_at DESC);

ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read crm_events" ON public.crm_events;
CREATE POLICY "Admins read crm_events"
  ON public.crm_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Service insert crm_events" ON public.crm_events;
CREATE POLICY "Service insert crm_events"
  ON public.crm_events FOR INSERT TO authenticated
  WITH CHECK (true);

COMMENT ON COLUMN public.agencies.telegram_chat_id IS 'Telegram group chat id (supergroup, negative)';
