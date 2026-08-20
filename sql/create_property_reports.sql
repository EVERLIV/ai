-- Жалобы на объявления
-- Выполнить в SQL Editor self-hosted каталога
-- Безопасно повторять

CREATE TABLE IF NOT EXISTS public.property_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('fraud', 'fake', 'not_owner', 'other')),
  details text,
  contact_phone text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_reports_property
  ON public.property_reports (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_reports_status
  ON public.property_reports (status, created_at DESC);

ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users insert own reports" ON public.property_reports;
CREATE POLICY "Authenticated users insert own reports"
  ON public.property_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users read own reports" ON public.property_reports;
CREATE POLICY "Users read own reports"
  ON public.property_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );
