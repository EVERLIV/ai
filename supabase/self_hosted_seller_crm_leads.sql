-- Продавцы видят заявки по своим объектам (не только admin/manager).
-- Идемпотентно. Применить на api.arendacity.com.

SET search_path = public;

GRANT SELECT ON public.crm_leads TO authenticated;

DROP POLICY IF EXISTS "Sellers read leads for own listings" ON public.crm_leads;
CREATE POLICY "Sellers read leads for own listings"
  ON public.crm_leads FOR SELECT TO authenticated
  USING (
    object_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = object_id
        AND (
          p.submitted_by = auth.uid()
          OR p.agency_id IN (
            SELECT m.agency_id
            FROM public.agency_members m
            WHERE m.user_id = auth.uid()
          )
        )
    )
  );
