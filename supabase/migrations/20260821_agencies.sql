-- =============================================================================
-- Agencies: entity, members (multi-login), managers (contact cards), invites
-- Self-hosted: supabase/self_hosted_agencies.sql
-- =============================================================================

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE public.agency_member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.profile_account_type ADD VALUE IF NOT EXISTS 'agency';

-- Safer fallback for older Postgres without IF NOT EXISTS on enum:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'profile_account_type' AND e.enumlabel = 'agency'
  ) THEN
    BEGIN
      ALTER TYPE public.profile_account_type ADD VALUE 'agency';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 2) Agencies
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  about TEXT NOT NULL DEFAULT '',
  opened_at DATE,
  working_hours TEXT NOT NULL DEFAULT '',
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  verification_requested_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agencies_verification ON public.agencies (verification_status);

-- 3) Members (one user → one agency)
CREATE TABLE IF NOT EXISTS public.agency_members (
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.agency_member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agency_id, user_id),
  CONSTRAINT agency_members_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members (user_id);

-- 4) Managers (contact cards, no login)
CREATE TABLE IF NOT EXISTS public.agency_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  property_types TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_managers_agency ON public.agency_managers (agency_id);

-- 5) Invites
CREATE TABLE IF NOT EXISTS public.agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.agency_member_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_invites_agency ON public.agency_invites (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_invites_email ON public.agency_invites (lower(email));
CREATE INDEX IF NOT EXISTS idx_agency_invites_token ON public.agency_invites (token);

-- 6) Properties linkage
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_manager_id UUID REFERENCES public.agency_managers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON public.properties (agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_manager_id ON public.properties (listing_manager_id);

-- 7) Helper: is member of agency
CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members m
    WHERE m.agency_id = p_agency_id AND m.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_agency_admin(p_agency_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members m
    WHERE m.agency_id = p_agency_id
      AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.my_agency_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT m.agency_id FROM public.agency_members m WHERE m.user_id = p_user_id LIMIT 1;
$$;

-- 8) Protect agency verification (same idea as profiles)
CREATE OR REPLACE FUNCTION public.protect_agency_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  ) THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF OLD.verification_status IN ('unverified', 'rejected')
         AND NEW.verification_status = 'pending'
         AND public.is_agency_admin(OLD.id) THEN
        NEW.verification_requested_at := now();
      ELSE
        NEW.verification_status := OLD.verification_status;
      END IF;
    END IF;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_agency_verification ON public.agencies;
CREATE TRIGGER trg_protect_agency_verification
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_agency_verification_fields();

-- 9) Signup: agency create or accept invite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
DECLARE
  v_account_type public.profile_account_type;
  v_staff_count INTEGER;
  v_agency_name TEXT;
  v_invite_token TEXT;
  v_invite public.agency_invites%ROWTYPE;
  v_agency_id UUID;
  v_meta_type TEXT;
BEGIN
  v_meta_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'owner');
  v_invite_token := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'invite_token', '')), '');

  -- Invite takes precedence: join existing agency as agency account
  IF v_invite_token IS NOT NULL THEN
    SELECT * INTO v_invite
    FROM public.agency_invites
    WHERE token = v_invite_token
      AND accepted_at IS NULL
      AND expires_at > now()
    LIMIT 1;

    IF FOUND THEN
      v_account_type := 'agency'::public.profile_account_type;

      INSERT INTO public.profiles (
        id, full_name, email, phone,
        account_type, agency_name, agency_staff_count,
        verification_status
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        v_account_type,
        '',
        NULL,
        'unverified'::public.verification_status
      );

      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'client')
      ON CONFLICT (user_id, role) DO NOTHING;

      INSERT INTO public.agency_members (agency_id, user_id, role)
      VALUES (v_invite.agency_id, NEW.id, v_invite.role)
      ON CONFLICT (user_id) DO NOTHING;

      UPDATE public.agency_invites
      SET accepted_at = now()
      WHERE id = v_invite.id;

      RETURN NEW;
    END IF;
  END IF;

  v_account_type := CASE
    WHEN v_meta_type IN ('agency', 'realtor') THEN 'agency'::public.profile_account_type
    WHEN v_meta_type = 'realtor' THEN 'agency'::public.profile_account_type
    ELSE 'owner'::public.profile_account_type
  END;

  -- Prefer agency over legacy realtor label
  IF v_meta_type = 'realtor' THEN
    v_account_type := 'agency'::public.profile_account_type;
  END IF;

  v_staff_count := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'agency_staff_count', '')), '')::INTEGER;
  v_agency_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', '');

  INSERT INTO public.profiles (
    id, full_name, email, phone,
    account_type, agency_name, agency_staff_count,
    verification_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    v_account_type,
    v_agency_name,
    v_staff_count,
    'unverified'::public.verification_status
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF v_account_type = 'agency'::public.profile_account_type THEN
    INSERT INTO public.agencies (name, about)
    VALUES (
      COALESCE(NULLIF(trim(v_agency_name), ''), 'Агентство'),
      COALESCE(NEW.raw_user_meta_data->>'agency_about', '')
    )
    RETURNING id INTO v_agency_id;

    INSERT INTO public.agency_members (agency_id, user_id, role)
    VALUES (v_agency_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$fn$;

-- 10) Migrate existing realtor profiles → agencies
DO $$
DECLARE
  r RECORD;
  v_agency_id UUID;
BEGIN
  FOR r IN
    SELECT id, agency_name, agency_about, agency_staff_count, verification_status,
           verification_requested_at, verified_at, verified_by
    FROM public.profiles
    WHERE account_type::text = 'realtor'
      AND NOT EXISTS (SELECT 1 FROM public.agency_members m WHERE m.user_id = profiles.id)
  LOOP
    INSERT INTO public.agencies (
      name, about, verification_status, verification_requested_at, verified_at, verified_by
    )
    VALUES (
      COALESCE(NULLIF(trim(r.agency_name), ''), 'Агентство'),
      COALESCE(r.agency_about, ''),
      COALESCE(r.verification_status, 'unverified'),
      r.verification_requested_at,
      r.verified_at,
      r.verified_by
    )
    RETURNING id INTO v_agency_id;

    INSERT INTO public.agency_members (agency_id, user_id, role)
    VALUES (v_agency_id, r.id, 'owner')
    ON CONFLICT (user_id) DO NOTHING;

    -- Flip account_type to agency where enum supports it
    BEGIN
      UPDATE public.profiles
      SET account_type = 'agency'::public.profile_account_type
      WHERE id = r.id;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Link properties submitted by agency members
UPDATE public.properties p
SET agency_id = m.agency_id
FROM public.agency_members m
WHERE p.submitted_by = m.user_id
  AND p.agency_id IS NULL;

-- 11) RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;

-- Agencies: public read
DROP POLICY IF EXISTS "Public can read agencies" ON public.agencies;
CREATE POLICY "Public can read agencies"
  ON public.agencies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Members can update own agency" ON public.agencies;
CREATE POLICY "Members can update own agency"
  ON public.agencies FOR UPDATE TO authenticated
  USING (public.is_agency_member(id))
  WITH CHECK (public.is_agency_member(id));

DROP POLICY IF EXISTS "Admins manage agencies" ON public.agencies;
CREATE POLICY "Admins manage agencies"
  ON public.agencies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Members
DROP POLICY IF EXISTS "Public read agency members" ON public.agency_members;
CREATE POLICY "Public read agency members"
  ON public.agency_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Agency admins manage members" ON public.agency_members;
CREATE POLICY "Agency admins manage members"
  ON public.agency_members FOR ALL TO authenticated
  USING (
    public.is_agency_admin(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.is_agency_admin(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Managers: public read active; members manage
DROP POLICY IF EXISTS "Public read active managers" ON public.agency_managers;
CREATE POLICY "Public read active managers"
  ON public.agency_managers FOR SELECT
  USING (is_active = true OR public.is_agency_member(agency_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members manage managers" ON public.agency_managers;
CREATE POLICY "Members manage managers"
  ON public.agency_managers FOR ALL TO authenticated
  USING (
    public.is_agency_member(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.is_agency_member(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Invites
DROP POLICY IF EXISTS "Members read invites" ON public.agency_invites;
CREATE POLICY "Members read invites"
  ON public.agency_invites FOR SELECT TO authenticated
  USING (
    public.is_agency_member(agency_id)
    OR public.has_role(auth.uid(), 'admin')
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Admins create invites" ON public.agency_invites;
CREATE POLICY "Admins create invites"
  ON public.agency_invites FOR INSERT TO authenticated
  WITH CHECK (
    public.is_agency_admin(agency_id)
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins update invites" ON public.agency_invites;
CREATE POLICY "Admins update invites"
  ON public.agency_invites FOR UPDATE TO authenticated
  USING (
    public.is_agency_admin(agency_id)
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins delete invites" ON public.agency_invites;
CREATE POLICY "Admins delete invites"
  ON public.agency_invites FOR DELETE TO authenticated
  USING (
    public.is_agency_admin(agency_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- Properties: agency members can view/update agency listings
DROP POLICY IF EXISTS "Agency members view agency properties" ON public.properties;
CREATE POLICY "Agency members view agency properties"
  ON public.properties FOR SELECT TO authenticated
  USING (
    agency_id IS NOT NULL AND public.is_agency_member(agency_id)
  );

DROP POLICY IF EXISTS "Agency members update agency properties" ON public.properties;
CREATE POLICY "Agency members update agency properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    agency_id IS NOT NULL AND public.is_agency_member(agency_id)
  )
  WITH CHECK (
    agency_id IS NOT NULL AND public.is_agency_member(agency_id)
  );

-- 12) Storage bucket for agency assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-assets', 'agency-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view agency assets" ON storage.objects;
CREATE POLICY "Anyone can view agency assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Authenticated upload agency assets" ON storage.objects;
CREATE POLICY "Authenticated upload agency assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Authenticated update agency assets" ON storage.objects;
CREATE POLICY "Authenticated update agency assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "Authenticated delete agency assets" ON storage.objects;
CREATE POLICY "Authenticated delete agency assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'agency-assets');

COMMENT ON TABLE public.agencies IS 'Real-estate agencies (replaces realtor identity)';
COMMENT ON TABLE public.agency_managers IS 'Contact cards attached to listings; no login';
COMMENT ON TABLE public.agency_members IS 'Multi-login membership for an agency';
