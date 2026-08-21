-- Manager specialties: which property types they handle
ALTER TABLE public.agency_managers
  ADD COLUMN IF NOT EXISTS property_types TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.agency_managers.property_types IS
  'Типы объектов, с которыми работает менеджер (Офис, Квартира, …)';

NOTIFY pgrst, 'reload schema';
