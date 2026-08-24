-- ИИ-консультант (чат + голос ElevenLabs) как услуга продавца.
-- Применить на self-hosted: psql / SQL editor api.arendacity.com

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS ai_consultant_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_consultant_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.agencies.ai_consultant_enabled IS
  'Услуга ИИ-консультанта: чат и голосовой звонок только по объектам этого агентства';
COMMENT ON COLUMN public.profiles.ai_consultant_enabled IS
  'Услуга ИИ-консультанта для собственника/риелтора (без агентства)';

-- Публичное чтение id профилей с включённой услугой (для карточек каталога)
DROP POLICY IF EXISTS "Public read ai consultant profile ids" ON public.profiles;
CREATE POLICY "Public read ai consultant profile ids"
  ON public.profiles FOR SELECT
  USING (ai_consultant_enabled = true);

-- Агентства уже public SELECT; индекс для быстрых выборок
CREATE INDEX IF NOT EXISTS idx_agencies_ai_consultant_enabled
  ON public.agencies (id)
  WHERE ai_consultant_enabled = true;

CREATE INDEX IF NOT EXISTS idx_profiles_ai_consultant_enabled
  ON public.profiles (id)
  WHERE ai_consultant_enabled = true;

-- АрендаСити (hoaandrey@gmail.com) — включено по умолчанию
UPDATE public.agencies
SET ai_consultant_enabled = true,
    updated_at = now()
WHERE id = 'a0000000-0000-4000-8000-000000000001';
