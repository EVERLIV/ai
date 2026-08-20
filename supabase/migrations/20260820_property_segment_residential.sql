DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'property_segment'
  ) THEN
    CREATE TYPE public.property_segment AS ENUM ('commercial', 'residential');
  END IF;
END$$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS segment public.property_segment NOT NULL DEFAULT 'commercial';

CREATE INDEX IF NOT EXISTS idx_properties_segment_active
  ON public.properties (segment, is_active, created_at DESC);
