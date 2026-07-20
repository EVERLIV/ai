-- =============================================================================
-- ВСЁ В ОДНОМ — верификация пользователей
-- Запускайте целиком в SQL Editor (Supabase → SQL → New query → Run)
-- =============================================================================

-- 1. Типы
DO $do$ BEGIN
  CREATE TYPE public.profile_account_type AS ENUM ('owner', 'realtor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

DO $do$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- 2. Колонки
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

-- 3. Триггер защиты верификации
CREATE OR REPLACE FUNCTION public.protect_profile_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
BEGIN
  IF auth.uid() = NEW.id AND NOT (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  ) THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF OLD.verification_status IN ('unverified', 'rejected')
         AND NEW.verification_status = 'pending' THEN
        NEW.verification_requested_at := now();
      ELSE
        NEW.verification_status := OLD.verification_status;
      END IF;
    END IF;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_profile_verification ON public.profiles;
CREATE TRIGGER trg_protect_profile_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_profile_verification_fields();

-- 4. Регистрация + политика админа
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $fn$
DECLARE
  v_account_type public.profile_account_type;
  v_staff_count INTEGER;
BEGIN
  v_account_type := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' = 'realtor' THEN 'realtor'::public.profile_account_type
    ELSE 'owner'::public.profile_account_type
  END;

  v_staff_count := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'agency_staff_count', '')), '')::INTEGER;

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
    COALESCE(NEW.raw_user_meta_data->>'agency_name', ''),
    v_staff_count,
    'unverified'::public.verification_status
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$fn$;

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

-- 5. Проверка
SELECT typname AS created_type
FROM pg_type
WHERE typname IN ('profile_account_type', 'verification_status');
