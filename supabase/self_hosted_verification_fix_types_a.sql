-- Быстрый фикс: только типы + колонки (если step1 не прошёл)
-- После успеха снова запустите step3.

CREATE TYPE public.profile_account_type AS ENUM ('owner', 'realtor');
