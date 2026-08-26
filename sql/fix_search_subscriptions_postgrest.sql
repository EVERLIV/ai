-- Фикс upsert + обновление кэша PostgREST после создания таблиц
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/fix_search_subscriptions_postgrest.sql

-- PostgREST on_conflict=user_id требует UNIQUE CONSTRAINT, не только индекс
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'search_subscriptions_user_id_key'
      AND conrelid = 'public.search_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.search_subscriptions
      ADD CONSTRAINT search_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN unique_violation THEN NULL;
END $$;

-- На случай, если индекс уже есть и мешает constraint — оставить как есть
DROP INDEX IF EXISTS public.search_subscriptions_user_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS search_subscriptions_user_uidx
  ON public.search_subscriptions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_subscriptions TO authenticated, service_role;
GRANT SELECT, INSERT ON public.site_analytics_events TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_presence TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
