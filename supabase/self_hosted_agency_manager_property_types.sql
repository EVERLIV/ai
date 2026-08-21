-- Manager specialties: which property types they handle
-- Run on self-hosted (api.arendacity.com). Safe to repeat.
ALTER TABLE public.agency_managers
  ADD COLUMN IF NOT EXISTS property_types TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.agency_managers.property_types IS
  'Типы объектов, с которыми работает менеджер (Офис, Квартира, …)';

-- Refresh PostgREST schema cache (otherwise PATCH still 400)
NOTIFY pgrst, 'reload schema';
