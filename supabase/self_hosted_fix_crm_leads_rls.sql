-- Починка приёма заявок с сайта (crm_leads).
--
-- Проблема: анонимные посетители не могут отправить заявку —
-- INSERT отклоняется с ошибкой 42501 "new row violates row-level
-- security policy". Из-за этого молча не работают форма на странице
-- контактов, «Предложить свою цену», сообщения собственнику и заявки
-- из чата Анастасии.
--
-- Причина: у таблицы включён RLS, но политика на INSERT для роли anon
-- не создана в этой базе.
--
-- Скрипт идемпотентный — можно запускать повторно.

-- 0. Работаем в схеме public (иначе объекты уедут в другую схему).
SET search_path = public;

-- 1. Таблица (создаётся, только если её ещё нет).
--    Внешний ключ на properties добавляется отдельно в п. 1a — чтобы
--    скрипт не падал с ошибкой 42P01, если properties ещё не создана.
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  business_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1a. Связь с объектами — только если таблица properties существует.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'crm_leads'
      AND constraint_name = 'crm_leads_object_id_fkey'
  ) THEN
    ALTER TABLE public.crm_leads
      ADD CONSTRAINT crm_leads_object_id_fkey
      FOREIGN KEY (object_id) REFERENCES public.properties(id) ON DELETE SET NULL;
    RAISE NOTICE 'Внешний ключ на properties добавлен.';
  ELSE
    RAISE NOTICE 'Внешний ключ пропущен (нет таблицы properties или связь уже есть).';
  END IF;
END $$;

-- 2. Недостающие колонки, если таблица была создана раньше в другом виде.
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS object_id UUID;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'website';
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- 3. Права на уровне ролей. Без GRANT политика RLS не поможет:
--    anon может только добавлять заявки, читать их нельзя.
GRANT INSERT ON public.crm_leads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.crm_leads TO authenticated;

-- 4. Политика на приём заявок с сайта.
DROP POLICY IF EXISTS "Anyone can insert crm leads" ON public.crm_leads;
CREATE POLICY "Anyone can insert crm leads"
  ON public.crm_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5–6. Читают и меняют заявки только админы и менеджеры.
--      Посетитель сайта не должен видеть чужие телефоны.
--      Если функции has_role нет, доступ на чтение не выдаётся никому —
--      это безопасный вариант по умолчанию (лучше, чем открыть всем).
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins and managers read crm leads" ON public.crm_leads;
  DROP POLICY IF EXISTS "Admins and managers update crm leads" ON public.crm_leads;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    CREATE POLICY "Admins and managers read crm leads"
      ON public.crm_leads FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
      );

    CREATE POLICY "Admins and managers update crm leads"
      ON public.crm_leads FOR UPDATE TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
      );
    RAISE NOTICE 'Политики чтения и обновления созданы.';
  ELSE
    RAISE WARNING 'Функция public.has_role не найдена — политики чтения не созданы. Заявки принимаются, но в админке их не будет видно.';
  END IF;
END $$;

-- 7. Индексы под выборки в админке.
CREATE INDEX IF NOT EXISTS crm_leads_created_at_idx ON public.crm_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS crm_leads_status_idx ON public.crm_leads (status);
CREATE INDEX IF NOT EXISTS crm_leads_source_idx ON public.crm_leads (source);

-- Проверка: должны появиться три политики.
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'crm_leads'
ORDER BY policyname;
