-- =============================================================================
-- Seed: агентство «АрендаСити» + менеджер Анастасия Романова
-- Владелец: hoaandrey@gmail.com
--
-- Порядок:
--   1) supabase/self_hosted_agencies.sql (если ещё не применяли)
--   2) supabase/self_hosted_agency_reviews.sql
--   3) этот файл (SQL Editor / psql)
--
-- Фиксированные UUID (синхронизированы с src/config/defaultAgent.ts):
--   agency:  a0000000-0000-4000-8000-000000000001
--   manager: a0000000-0000-4000-8000-000000000002
--
-- Фото менеджера: положите public/consultant-anastasia.jpg на сайт
-- и при необходимости поправьте v_photo_url ниже под ваш домен.
-- =============================================================================

DO $$
DECLARE
  v_email TEXT := 'hoaandrey@gmail.com';
  v_agency_id UUID := 'a0000000-0000-4000-8000-000000000001';
  v_manager_id UUID := 'a0000000-0000-4000-8000-000000000002';
  v_user_id UUID;
  v_photo_url TEXT := '/consultant-anastasia.jpg';
  v_about TEXT :=
    'Агентство недвижимости АрендаСити. Аренда и продажа коммерческой и жилой недвижимости в Ангарске, Иркутске и области. Подбор помещений, показы, проверка контрагентов и сопровождение сделки.';
  v_manager_about TEXT :=
    'Ведёт объекты агентства в Ангарске, Иркутске и области. Подбор помещений, показы, проверка арендаторов и сопровождение сделки.';
  v_props_updated INT := 0;
BEGIN
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'Пользователь % не найден в auth.users. Сначала зарегистрируйте аккаунт.',
      v_email;
  END IF;

  -- Профиль владельца
  UPDATE public.profiles
  SET
    account_type = 'agency',
    agency_name = 'АрендаСити',
    agency_about = v_about,
    verification_status = 'verified',
    verified_at = COALESCE(verified_at, now()),
    full_name = COALESCE(NULLIF(trim(full_name), ''), 'Андрей')
  WHERE id = v_user_id;

  -- Если уже состоит в другом агентстве — переносим membership
  DELETE FROM public.agency_members
  WHERE user_id = v_user_id
    AND agency_id IS DISTINCT FROM v_agency_id;

  INSERT INTO public.agencies (
    id,
    name,
    about,
    opened_at,
    working_hours,
    verification_status,
    verified_at,
    verified_by,
    avg_rating,
    reviews_count,
    response_minutes
  )
  VALUES (
    v_agency_id,
    'АрендаСити',
    v_about,
    '2013-01-01',
    'Пн–Пт: 9:00–19:00 · Сб: 10:00–15:00',
    'verified',
    now(),
    v_user_id,
    0,
    0,
    12
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    about = EXCLUDED.about,
    opened_at = EXCLUDED.opened_at,
    working_hours = EXCLUDED.working_hours,
    verification_status = 'verified',
    verified_at = COALESCE(public.agencies.verified_at, now()),
    verified_by = COALESCE(public.agencies.verified_by, EXCLUDED.verified_by),
    response_minutes = COALESCE(public.agencies.response_minutes, 12),
    updated_at = now();

  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (v_agency_id, v_user_id, 'owner')
  ON CONFLICT (user_id) DO UPDATE SET
    agency_id = EXCLUDED.agency_id,
    role = 'owner';

  INSERT INTO public.agency_managers (
    id,
    agency_id,
    full_name,
    phone,
    photo_url,
    property_types,
    sort_order,
    is_active,
    avg_rating,
    reviews_count,
    response_minutes,
    about
  )
  VALUES (
    v_manager_id,
    v_agency_id,
    'Анастасия Романова',
    '+7 (908) 658-19-19',
    v_photo_url,
    ARRAY[
      'Офис',
      'Торговая площадь',
      'Склад',
      'Производство',
      'Квартира',
      'Дом'
    ]::text[],
    0,
    true,
    0,
    0,
    12,
    v_manager_about
  )
  ON CONFLICT (id) DO UPDATE SET
    agency_id = EXCLUDED.agency_id,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    photo_url = COALESCE(NULLIF(EXCLUDED.photo_url, ''), public.agency_managers.photo_url),
    property_types = EXCLUDED.property_types,
    is_active = true,
    about = EXCLUDED.about,
    response_minutes = COALESCE(public.agency_managers.response_minutes, 12),
    updated_at = now();

  -- Бэкфилл объектов: без чужого собственника
  UPDATE public.properties p
  SET
    agency_id = v_agency_id,
    listing_manager_id = v_manager_id,
    extras = COALESCE(p.extras, '{}'::jsonb) || jsonb_build_object(
      'agency_id', v_agency_id::text,
      'listing_manager_id', v_manager_id::text,
      'agent_name', 'Анастасия Романова',
      'agent_company', 'АрендаСити',
      'agent_phone', '+7 (908) 658-19-19',
      'agent_avatar_url', v_photo_url,
      'agent_account_type', 'agency',
      'agent_verified', true,
      'agent_agency_about', v_manager_about,
      'agent_rating', 4.9,
      'agent_response_min', 12
    )
  WHERE p.agency_id IS NULL
    AND (
      p.submitted_by = v_user_id
      OR COALESCE(p.extras->>'owner_user_id', '') = ''
      OR COALESCE(p.extras->>'owner_user_id', '') = v_user_id::text
    )
    AND (
      COALESCE(p.extras->>'agent_account_type', '') IN ('', 'agency', 'realtor')
      OR p.extras->>'agent_name' ILIKE '%Анастасия%'
      OR p.extras->>'agent_company' ILIKE '%Аренда%'
      OR p.submitted_by = v_user_id
    );

  GET DIAGNOSTICS v_props_updated = ROW_COUNT;

  -- Демо-отзывы (идемпотентно по id)
  INSERT INTO public.agency_reviews (
    id, agency_id, manager_id, author_name, rating, body, status
  ) VALUES
    (
      'b0000000-0000-4000-8000-000000000001',
      v_agency_id,
      v_manager_id,
      'Ирина К.',
      5,
      'Быстро подобрали офис в Ангарске, все документы проверили. Рекомендую АрендаСити.',
      'published'
    ),
    (
      'b0000000-0000-4000-8000-000000000002',
      v_agency_id,
      v_manager_id,
      'Сергей М.',
      5,
      'Анастасия вела сделку по аренде склада — спокойно, по делу, без лишних звонков.',
      'published'
    ),
    (
      'b0000000-0000-4000-8000-000000000003',
      v_agency_id,
      v_manager_id,
      'Ольга П.',
      5,
      'Помогли снять торговое помещение. Ответ в течение дня, показы без задержек.',
      'published'
    ),
    (
      'b0000000-0000-4000-8000-000000000004',
      v_agency_id,
      v_manager_id,
      'Дмитрий В.',
      4,
      'Хорошее агентство, чуть дольше обычного ждали договор, но результат устроил.',
      'published'
    ),
    (
      'b0000000-0000-4000-8000-000000000005',
      v_agency_id,
      NULL,
      'Марина Л.',
      5,
      'Работаем с АрендаСити уже не первый год — всегда на связи и по коммерции, и по жилью.',
      'published'
    )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.refresh_agency_review_stats(v_agency_id);
  PERFORM public.refresh_manager_review_stats(v_manager_id);

  RAISE NOTICE 'OK agency=% manager=% user=% listings_updated=%',
    v_agency_id, v_manager_id, v_user_id, v_props_updated;
END $$;

-- Проверка
SELECT
  a.id AS agency_id,
  a.name,
  a.verification_status,
  a.avg_rating,
  a.reviews_count,
  a.response_minutes,
  (SELECT count(*) FROM public.agency_members m WHERE m.agency_id = a.id) AS members,
  (SELECT count(*) FROM public.agency_managers g WHERE g.agency_id = a.id AND g.is_active) AS managers,
  (SELECT count(*) FROM public.properties p WHERE p.agency_id = a.id) AS listings
FROM public.agencies a
WHERE a.id = 'a0000000-0000-4000-8000-000000000001';

SELECT
  g.id AS manager_id,
  g.full_name,
  g.avg_rating,
  g.reviews_count,
  g.phone,
  g.photo_url
FROM public.agency_managers g
WHERE g.id = 'a0000000-0000-4000-8000-000000000002';
