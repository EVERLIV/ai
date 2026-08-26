-- Подписки на поиск каталога + realtime-аналитика сайта (admin-only reads)
-- Применить: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/search_subscriptions_and_analytics.sql

-- ─── search_subscriptions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.search_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  property_types text[] NOT NULL DEFAULT '{}',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  results_snapshot integer,
  rules_accepted_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS search_subscriptions_user_uidx
  ON public.search_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS search_subscriptions_active_idx
  ON public.search_subscriptions (is_active)
  WHERE is_active = true;

ALTER TABLE public.search_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_subscriptions_select_own" ON public.search_subscriptions;
CREATE POLICY "search_subscriptions_select_own"
  ON public.search_subscriptions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "search_subscriptions_insert_own" ON public.search_subscriptions;
CREATE POLICY "search_subscriptions_insert_own"
  ON public.search_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "search_subscriptions_update_own" ON public.search_subscriptions;
CREATE POLICY "search_subscriptions_update_own"
  ON public.search_subscriptions FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "search_subscriptions_delete_own" ON public.search_subscriptions;
CREATE POLICY "search_subscriptions_delete_own"
  ON public.search_subscriptions FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- ─── site_analytics_events (append-only) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.site_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'property_view', 'section_view')),
  path text,
  section text,
  property_id text,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  session_id text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS site_analytics_events_occurred_idx
  ON public.site_analytics_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS site_analytics_events_type_idx
  ON public.site_analytics_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS site_analytics_events_path_idx
  ON public.site_analytics_events (path, occurred_at DESC);

CREATE INDEX IF NOT EXISTS site_analytics_events_property_idx
  ON public.site_analytics_events (property_id, occurred_at DESC)
  WHERE property_id IS NOT NULL;

ALTER TABLE public.site_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_analytics_events_insert_public" ON public.site_analytics_events;
CREATE POLICY "site_analytics_events_insert_public"
  ON public.site_analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "site_analytics_events_select_staff" ON public.site_analytics_events;
CREATE POLICY "site_analytics_events_select_staff"
  ON public.site_analytics_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- ─── site_presence ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.site_presence (
  session_id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  path text
);

CREATE INDEX IF NOT EXISTS site_presence_last_seen_idx
  ON public.site_presence (last_seen_at DESC);

ALTER TABLE public.site_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_presence_upsert_public" ON public.site_presence;
CREATE POLICY "site_presence_upsert_public"
  ON public.site_presence FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "site_presence_update_public" ON public.site_presence;
CREATE POLICY "site_presence_update_public"
  ON public.site_presence FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "site_presence_select_staff" ON public.site_presence;
CREATE POLICY "site_presence_select_staff"
  ON public.site_presence FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "site_presence_delete_staff" ON public.site_presence;
CREATE POLICY "site_presence_delete_staff"
  ON public.site_presence FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.site_analytics_events TO anon, authenticated;
GRANT SELECT ON public.site_analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.site_presence TO anon, authenticated;
GRANT DELETE ON public.site_presence TO authenticated;
