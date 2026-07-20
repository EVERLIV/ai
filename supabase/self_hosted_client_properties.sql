-- =============================================================================
-- Self-hosted Supabase: клиентские объекты, модерация, public_id, crm_leads
--
-- ВАЖНО: сначала выполните self_hosted_step1_enums.sql (отдельным запуском),
--         затем этот файл.
-- =============================================================================

-- 1. Колонки properties для модерации и публичного ID
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS moderation_status public.property_moderation_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS request_type public.property_request_type,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS public_id TEXT;

-- Уникальный публичный код объекта (8 символов A-Z, 2-9)
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_public_id ON public.properties (public_id)
  WHERE public_id IS NOT NULL;

-- Генератор public_id (без путающих O/0, I/1)
CREATE OR REPLACE FUNCTION public.generate_property_public_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  pos INT;
BEGIN
  FOR i IN 1..8 LOOP
    pos := 1 + floor(random() * length(chars))::INT;
    result := result || substr(chars, pos, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_property_public_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.public_id IS NULL OR btrim(NEW.public_id) = '' THEN
    LOOP
      NEW.public_id := public.generate_property_public_id();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.properties p WHERE p.public_id = NEW.public_id AND p.id IS DISTINCT FROM NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_properties_public_id ON public.properties;
CREATE TRIGGER trg_properties_public_id
  BEFORE INSERT OR UPDATE OF public_id ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_property_public_id();

-- Backfill public_id для существующих строк
UPDATE public.properties
SET public_id = public.generate_property_public_id()
WHERE public_id IS NULL OR btrim(public_id) = '';

-- Повторный backfill при коллизиях (редко)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.properties WHERE public_id IS NULL LOOP
    UPDATE public.properties SET public_id = public.generate_property_public_id() WHERE id = r.id;
  END LOOP;
END $$;

-- Старые админские объекты — published (без ссылки на cancelled в одной транзакции с ADD VALUE)
UPDATE public.properties
SET moderation_status = 'published'
WHERE submitted_by IS NULL
  AND moderation_status IS DISTINCT FROM 'published';

CREATE INDEX IF NOT EXISTS idx_properties_moderation_status ON public.properties (moderation_status);
CREATE INDEX IF NOT EXISTS idx_properties_submitted_by ON public.properties (submitted_by);

-- 2. Таблица crm_leads (заявки, сообщения риелтору, управление)
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  business_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert crm leads" ON public.crm_leads;
CREATE POLICY "Anyone can insert crm leads"
  ON public.crm_leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and managers read crm leads" ON public.crm_leads;
CREATE POLICY "Admins and managers read crm leads"
  ON public.crm_leads FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE INDEX IF NOT EXISTS idx_crm_leads_object_id ON public.crm_leads (object_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads (status);

-- 3. RLS properties — публичный каталог + личные объекты клиента + админ
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
CREATE POLICY "Anyone can view active properties"
  ON public.properties FOR SELECT
  USING (is_active = true AND moderation_status = 'published');

DROP POLICY IF EXISTS "Authenticated can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own submitted properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and managers can view all properties" ON public.properties;

CREATE POLICY "Users can view own submitted properties"
  ON public.properties FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "Admins and managers can view all properties"
  ON public.properties FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Admins and managers can insert properties" ON public.properties;
CREATE POLICY "Admins and managers can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Clients can insert own property submissions" ON public.properties;
CREATE POLICY "Clients can insert own property submissions"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND moderation_status = 'on_moderation'
    AND is_active = false
    AND request_type IS NOT NULL
  );

DROP POLICY IF EXISTS "Admins and managers can update properties" ON public.properties;
CREATE POLICY "Admins and managers can update properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Clients can update own pending properties" ON public.properties;
CREATE POLICY "Clients can update own pending properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    submitted_by = auth.uid()
    AND moderation_status IN ('draft', 'on_moderation', 'rejected')
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND moderation_status IN ('draft', 'on_moderation', 'rejected', 'cancelled')
  );

DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;
CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Storage: фото объектов (bucket property-photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read property photos" ON storage.objects;
CREATE POLICY "Public read property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Authenticated upload property photos" ON storage.objects;
CREATE POLICY "Authenticated upload property photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Authenticated update property photos" ON storage.objects;
CREATE POLICY "Authenticated update property photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Authenticated delete property photos" ON storage.objects;
CREATE POLICY "Authenticated delete property photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos');

COMMENT ON COLUMN public.properties.public_id IS 'Публичный код объекта (8 символов A-Z, 2-9) для клиента и модерации';
COMMENT ON COLUMN public.properties.moderation_status IS 'draft | on_moderation | published | rejected | cancelled';
COMMENT ON COLUMN public.properties.features IS 'Массив особенностей объекта (TEXT[])';
COMMENT ON COLUMN public.properties.extras IS 'JSONB: условия аренды, проходимость, арендодатель и т.д.';
