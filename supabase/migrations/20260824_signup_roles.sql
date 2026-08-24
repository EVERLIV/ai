-- =============================================================================
-- Signup roles: seeker | owner | realtor | agency
-- Run on self-hosted after self_hosted_agencies.sql
-- =============================================================================

DO $$ BEGIN
  ALTER TYPE public.profile_account_type ADD VALUE IF NOT EXISTS 'seeker';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Safer fallback without IF NOT EXISTS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'profile_account_type' AND e.enumlabel = 'seeker'
  ) THEN
    BEGIN
      ALTER TYPE public.profile_account_type ADD VALUE 'seeker';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

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
  v_meta_type := lower(trim(COALESCE(NEW.raw_user_meta_data->>'account_type', 'owner')));
  v_invite_token := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'invite_token', '')), '');

  -- Invite takes precedence: join existing agency
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

  v_account_type := CASE v_meta_type
    WHEN 'agency' THEN 'agency'::public.profile_account_type
    WHEN 'realtor' THEN 'realtor'::public.profile_account_type
    WHEN 'seeker' THEN 'seeker'::public.profile_account_type
    ELSE 'owner'::public.profile_account_type
  END;

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
    CASE WHEN v_account_type = 'agency'::public.profile_account_type THEN v_agency_name ELSE '' END,
    CASE WHEN v_account_type = 'agency'::public.profile_account_type THEN v_staff_count ELSE NULL END,
    'unverified'::public.verification_status
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Only full agencies get agencies row + membership (managers created later in cabinet)
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

COMMENT ON FUNCTION public.handle_new_user() IS
  'Signup: seeker|owner|realtor|agency; agency creates agencies+owner membership';
