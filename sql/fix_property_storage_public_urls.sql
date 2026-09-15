-- Fix property photo URLs missing /object/public/
-- Without /public/ the browser gets 401 (looks like CORS on <img>).
-- Also backfill empty cover_photo from photos[1].
-- Safe to re-run.

-- cover_photo: property-photos bucket
UPDATE public.properties
SET cover_photo = replace(
  cover_photo,
  '/storage/v1/object/property-photos/',
  '/storage/v1/object/public/property-photos/'
)
WHERE cover_photo LIKE '%/storage/v1/object/property-photos/%'
  AND cover_photo NOT LIKE '%/storage/v1/object/public/%';

-- photos[] text array elements
UPDATE public.properties
SET photos = (
  SELECT coalesce(
    array_agg(
      CASE
        WHEN elem LIKE '%/storage/v1/object/property-photos/%'
          AND elem NOT LIKE '%/storage/v1/object/public/%'
        THEN replace(
          elem,
          '/storage/v1/object/property-photos/',
          '/storage/v1/object/public/property-photos/'
        )
        ELSE elem
      END
    ),
    '{}'::text[]
  )
  FROM unnest(coalesce(photos, '{}'::text[])) AS elem
)
WHERE photos IS NOT NULL
  AND exists (
    SELECT 1
    FROM unnest(photos) AS elem
    WHERE elem LIKE '%/storage/v1/object/property-photos/%'
      AND elem NOT LIKE '%/storage/v1/object/public/%'
  );

-- Empty cover but gallery has photos → use first photo
UPDATE public.properties
SET cover_photo = photos[1]
WHERE (cover_photo IS NULL OR btrim(cover_photo) = '')
  AND photos IS NOT NULL
  AND cardinality(photos) > 0
  AND photos[1] IS NOT NULL
  AND btrim(photos[1]) <> '';

-- Ensure bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
