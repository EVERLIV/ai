
-- Storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);

-- RLS policies for property-photos bucket
CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can upload property photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can update property photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can delete property photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos');

-- Add photo columns to properties
ALTER TABLE public.properties
  ADD COLUMN photos TEXT[] DEFAULT '{}',
  ADD COLUMN cover_photo TEXT DEFAULT '';
