-- Сегмент land: enum + backfill (self-hosted / VPS)
-- Если UPDATE падает с «unsafe use of new value» — выполните сначала только блок ALTER,
-- закоммитьте, затем остальное.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'property_segment'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typnamespace = 'public'::regnamespace
        AND t.typname = 'property_segment'
        AND e.enumlabel = 'land'
    ) THEN
      ALTER TYPE public.property_segment ADD VALUE 'land';
    END IF;
  END IF;
END$$;

-- После ADD VALUE на PG < 12 нужен COMMIT перед использованием 'land'.
-- В psql: \echo run COMMIT; then continue

UPDATE public.properties
SET segment = 'land'
WHERE type IN ('Земля', 'Участок')
   OR (
     extras ? 'property_types'
     AND (
       extras->'property_types' ? 'Земля'
       OR extras->'property_types' ? 'Участок'
     )
   );

UPDATE public.dictionaries
SET parent = 'land'
WHERE category = 'property_type'
  AND value IN ('Земля', 'Участок');

INSERT INTO public.dictionaries (category, value, parent, sort_order, is_active)
VALUES
  ('property_type', 'Земля', 'land', 40, true),
  ('property_type', 'Участок', 'land', 41, true)
ON CONFLICT (category, value) DO UPDATE
SET parent = EXCLUDED.parent,
    sort_order = EXCLUDED.sort_order,
    is_active = true;
