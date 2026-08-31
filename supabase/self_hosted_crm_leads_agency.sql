-- Прямые заявки со страниц риелтора / агентства → видны в личном кабинете.
-- Идемпотентно. Применить на api.arendacity.com.

SET search_path = public;

ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS manager_id UUID;

CREATE INDEX IF NOT EXISTS crm_leads_agency_id_idx
  ON public.crm_leads (agency_id)
  WHERE agency_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS crm_leads_manager_id_idx
  ON public.crm_leads (manager_id)
  WHERE manager_id IS NOT NULL;

DROP POLICY IF EXISTS "Agency members read direct leads" ON public.crm_leads;
CREATE POLICY "Agency members read direct leads"
  ON public.crm_leads FOR SELECT TO authenticated
  USING (
    agency_id IS NOT NULL
    AND agency_id IN (
      SELECT m.agency_id
      FROM public.agency_members m
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Agency members update direct leads" ON public.crm_leads;
CREATE POLICY "Agency members update direct leads"
  ON public.crm_leads FOR UPDATE TO authenticated
  USING (
    agency_id IS NOT NULL
    AND agency_id IN (
      SELECT m.agency_id
      FROM public.agency_members m
      WHERE m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id IS NOT NULL
    AND agency_id IN (
      SELECT m.agency_id
      FROM public.agency_members m
      WHERE m.user_id = auth.uid()
    )
  );
