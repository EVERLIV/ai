-- ШАГ 1 (legacy) — лучше используйте step1a + step1b отдельно

DO $do$ BEGIN
  CREATE TYPE public.profile_account_type AS ENUM ('owner', 'realtor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

DO $do$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.profile_account_type NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS agency_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS agency_staff_count INTEGER,
  ADD COLUMN IF NOT EXISTS agency_about TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles (verification_status);
