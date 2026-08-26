-- Fix agency/developer/manager asset URLs missing /object/public/
-- Without /public/ the browser gets 401 and reports a false CORS error.
-- Safe to re-run.

UPDATE public.agencies
SET logo_url = replace(
  logo_url,
  '/storage/v1/object/agency-assets/',
  '/storage/v1/object/public/agency-assets/'
)
WHERE logo_url LIKE '%/storage/v1/object/agency-assets/%'
  AND logo_url NOT LIKE '%/storage/v1/object/public/%';

UPDATE public.agency_managers
SET photo_url = replace(
  photo_url,
  '/storage/v1/object/agency-assets/',
  '/storage/v1/object/public/agency-assets/'
)
WHERE photo_url LIKE '%/storage/v1/object/agency-assets/%'
  AND photo_url NOT LIKE '%/storage/v1/object/public/%';

UPDATE public.developers
SET logo_url = replace(
  logo_url,
  '/storage/v1/object/agency-assets/',
  '/storage/v1/object/public/agency-assets/'
)
WHERE logo_url LIKE '%/storage/v1/object/agency-assets/%'
  AND logo_url NOT LIKE '%/storage/v1/object/public/%';

-- Ensure bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-assets', 'agency-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;
