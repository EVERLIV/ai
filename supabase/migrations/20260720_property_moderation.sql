-- Property moderation workflow for free listing / management requests

CREATE TYPE public.property_moderation_status AS ENUM (
  'draft',
  'on_moderation',
  'published',
  'rejected'
);

CREATE TYPE public.property_request_type AS ENUM (
  'free_listing',
  'management'
);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS moderation_status public.property_moderation_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS request_type public.property_request_type,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Existing admin-created active properties stay published
UPDATE public.properties
SET moderation_status = 'published'
WHERE moderation_status IS NULL OR moderation_status = 'published';

CREATE INDEX IF NOT EXISTS idx_properties_moderation_status ON public.properties (moderation_status);
CREATE INDEX IF NOT EXISTS idx_properties_submitted_by ON public.properties (submitted_by);

-- Tighten public read: only active published listings
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
CREATE POLICY "Anyone can view active properties"
  ON public.properties FOR SELECT
  USING (is_active = true AND moderation_status = 'published');

-- Replace overly broad authenticated read
DROP POLICY IF EXISTS "Authenticated can view all properties" ON public.properties;

CREATE POLICY "Users can view own submitted properties"
  ON public.properties FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "Admins and managers can view all properties"
  ON public.properties FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

-- Clients can submit properties for moderation
CREATE POLICY "Clients can insert own property submissions"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND moderation_status = 'on_moderation'
    AND is_active = false
    AND request_type IS NOT NULL
  );

CREATE POLICY "Clients can update own pending properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    submitted_by = auth.uid()
    AND moderation_status IN ('draft', 'on_moderation', 'rejected')
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND moderation_status IN ('draft', 'on_moderation', 'rejected')
  );
