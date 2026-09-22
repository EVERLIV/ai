-- Апсерт site_presence через SECURITY DEFINER функцию.
--
-- Проблема: INSERT ... ON CONFLICT (session_id) DO UPDATE от роли anon падает с
-- "new row violates row-level security policy", хотя INSERT- и UPDATE-политики
-- разрешают anon эту операцию (WITH CHECK true). Причина — известная особенность
-- Postgres RLS: чтобы определить конфликт, движок должен сначала прочитать
-- существующую строку (SELECT), а SELECT-политики для anon на этой таблице нет
-- (и не должно быть — иначе любой анонимный запрос сможет прочитать чужие
-- session_id/path/user_id через REST).
--
-- Решение: SECURITY DEFINER функция, владелец которой (postgres) имеет BYPASSRLS —
-- апсерт выполняется в её теле в обход RLS, а наружу открыт только сам вызов
-- функции, не прямой доступ к таблице на чтение.

CREATE OR REPLACE FUNCTION public.upsert_site_presence(
  p_session_id text,
  p_user_id uuid,
  p_path text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.site_presence (session_id, user_id, last_seen_at, path)
  VALUES (p_session_id, p_user_id, now(), p_path)
  ON CONFLICT (session_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        last_seen_at = EXCLUDED.last_seen_at,
        path = EXCLUDED.path;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_site_presence(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_site_presence(text, uuid, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
