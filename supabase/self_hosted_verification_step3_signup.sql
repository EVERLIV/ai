-- ШАГ 3 — только ПОСЛЕ step1a + step1b (или step1)
-- Запускайте ВЕСЬ файл целиком.

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
