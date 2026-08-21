-- =============================================================================
-- Admin user management without GoTrue /auth/v1/admin (often 403 behind gateway)
-- Call via PostgREST: POST /rest/v1/rpc/admin_list_users  (service_role)
-- Apply on self-hosted Postgres (api.arendacity.com), then redeploy frontend.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO auth, public
AS $fn$
BEGIN
  -- service_role from PostgREST OR logged-in admin/manager
  IF coalesce(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.phone::text,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.raw_user_meta_data
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO auth, public
AS $fn$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id required';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_confirm_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO auth, public
AS $fn$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin')
     AND NOT public.has_role(auth.uid(), 'manager') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = p_user_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_set_user_password(p_user_id UUID, p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO auth, extensions, public
AS $fn$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'password too short';
  END IF;

  -- GoTrue stores bcrypt in encrypted_password
  UPDATE auth.users
  SET
    encrypted_password = crypt(p_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_confirm_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_password(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_confirm_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_password(UUID, TEXT) TO service_role;

-- Optional: allow authenticated admins via user JWT (if REST works with user token)
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_password(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_list_users() IS 'List auth.users for admin UI when /auth/v1/admin is blocked (403)';
