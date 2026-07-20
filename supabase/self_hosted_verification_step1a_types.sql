-- =============================================================================
-- ВЕРИФИКАЦИЯ — запускайте по порядку, каждый файл ЦЕЛИКОМ
-- =============================================================================

-- ── 1A. Типы (если ошибка "already exists" — пропустите, идите к 1B) ──
CREATE TYPE public.profile_account_type AS ENUM ('owner', 'realtor');

CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
