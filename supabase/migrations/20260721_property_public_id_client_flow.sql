-- Migration: public_id, crm_leads, RLS refresh
-- Run AFTER 20260721a_add_cancelled_enum.sql (cancelled must be committed first)

ALTER TABLE public.properties  ADD COLUMN IF NOT EXISTS public_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_public_id ON public.properties (public_id)
  WHERE public_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_property_public_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
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
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
  FOR EACH ROW EXECUTE FUNCTION public.set_property_public_id();

UPDATE public.properties
SET public_id = public.generate_property_public_id()
WHERE public_id IS NULL OR btrim(public_id) = '';

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
  ON public.crm_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and managers read crm leads" ON public.crm_leads;
CREATE POLICY "Admins and managers read crm leads"
  ON public.crm_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

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
