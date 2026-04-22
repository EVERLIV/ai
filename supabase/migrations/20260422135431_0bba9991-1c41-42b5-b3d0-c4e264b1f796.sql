ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

CREATE INDEX IF NOT EXISTS idx_properties_latlng ON public.properties (lat, lng);