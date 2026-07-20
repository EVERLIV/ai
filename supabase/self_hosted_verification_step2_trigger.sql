-- ШАГ 2 из 3 — триггер защиты полей верификации
-- Запускайте ВЕСЬ файл целиком одним запросом.

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
