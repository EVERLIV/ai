-- =============================================================================
-- ШАГ 1 из 2 — запустите ОТДЕЛЬНО и дождитесь успеха (Commit).
-- PostgreSQL: новое значение enum нельзя использовать в той же транзакции.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.property_moderation_status AS ENUM (
    'draft', 'on_moderation', 'published', 'rejected', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.property_request_type AS ENUM ('free_listing', 'management');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Если enum уже был без cancelled (миграция 20260720) — добавить значение:
ALTER TYPE public.property_moderation_status ADD VALUE IF NOT EXISTS 'cancelled';
