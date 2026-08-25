-- =============================================================================
-- Seed: застройщик (ЖК) для wewa666@mail.ru
-- Один дом / ЖК + квартиры разной площади с фото, ценами и описаниями
--
-- Порядок на VPS:
--   1) supabase/self_hosted_developers.sql
--   2) supabase/self_hosted_signup_roles.sql  (ветка developer)
--   3) этот файл
--
-- Требование: пользователь wewa666@mail.ru уже есть в auth.users
--   (зарегистрируйтесь на сайте, если ещё нет).
--
-- Фиксированные UUID (идемпотентный повторный запуск):
--   developer:  d0000000-0000-4000-8000-000000000001
--   project:    d0000000-0000-4000-8000-000000000010
--   unit types: d0000000-0000-4000-8000-00000000002{1-6}
--   properties: d1000000-0000-4000-8000-00000000000{1-6}
-- =============================================================================

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS promotions JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
DECLARE
  v_email TEXT := 'wewa666@mail.ru';
  v_user_id UUID;
  v_developer_id UUID := 'd0000000-0000-4000-8000-000000000001';
  v_project_id UUID := 'd0000000-0000-4000-8000-000000000010';
  v_company TEXT := 'БайкалСтройИнвест';
  v_about TEXT :=
    'Застройщик многоквартирных домов в Иркутске и области. ЖК комфорт-класса, ипотека от банков-партнёров, прозрачные сроки сдачи и сопровождение сделки до ключей.';
  v_phone TEXT := '+7 (3952) 48-00-66';
  v_address TEXT := 'г. Иркутск, ул. Байкальская, 280к1';
  v_district TEXT := 'Свердловский';
  v_lat NUMERIC := 52.2558;
  v_lng NUMERIC := 104.3352;
  v_cover TEXT :=
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80';
BEGIN
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'Пользователь % не найден в auth.users. Сначала зарегистрируйте аккаунт на сайте.',
      v_email;
  END IF;

  -- Если был в агентстве — снимаем membership (один user → одна org-модель)
  DELETE FROM public.agency_members WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET
    account_type = 'developer',
    agency_name = v_company,
    agency_about = v_about,
    verification_status = 'verified',
    verified_at = COALESCE(verified_at, now()),
    full_name = COALESCE(NULLIF(trim(full_name), ''), 'Владелец БайкалСтройИнвест'),
    phone = COALESCE(NULLIF(trim(phone), ''), v_phone)
  WHERE id = v_user_id;

  INSERT INTO public.developers (
    id,
    name,
    logo_url,
    about,
    subtype,
    city,
    region,
    phone,
    website,
    verification_status,
    verified_at,
    verified_by,
    promotions
  )
  VALUES (
    v_developer_id,
    v_company,
    v_cover,
    v_about,
    'apartment_developer',
    'Иркутск',
    'Иркутская область',
    v_phone,
    'https://arendacity.com',
    'verified',
    now(),
    v_user_id,
    jsonb_build_array(
      jsonb_build_object(
        'badge', 'Акция',
        'title', 'Ипотека от 5,9%',
        'text', 'Семейная и льготная ипотека у банков-партнёров. Одобрение в офисе продаж.'
      ),
      jsonb_build_object(
        'badge', 'Акция',
        'title', 'Рассрочка 0% на 12 месяцев',
        'text', 'Первый взнос от 30%. Без переплаты до сдачи дома.'
      ),
      jsonb_build_object(
        'badge', 'Подарок',
        'title', 'Машиноместо при покупке 3-комн.',
        'text', 'При покупке планировки Family или Premium — 1 м/м в паркинге в подарок.'
      )
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    about = EXCLUDED.about,
    subtype = 'apartment_developer',
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    verification_status = 'verified',
    verified_at = COALESCE(public.developers.verified_at, now()),
    verified_by = COALESCE(public.developers.verified_by, EXCLUDED.verified_by),
    promotions = EXCLUDED.promotions,
    updated_at = now();

  INSERT INTO public.developer_members (developer_id, user_id, role)
  VALUES (v_developer_id, v_user_id, 'owner')
  ON CONFLICT (user_id) DO UPDATE SET
    developer_id = EXCLUDED.developer_id,
    role = 'owner';

  INSERT INTO public.developer_projects (
    id,
    developer_id,
    title,
    slug,
    project_kind,
    status,
    housing_class,
    material,
    delivery_quarter,
    delivery_year,
    address,
    district,
    lat,
    lng,
    description,
    cover_photo,
    mortgage_terms,
    installment_terms,
    features,
    is_published,
    moderation_status,
    views_count
  )
  VALUES (
    v_project_id,
    v_developer_id,
    'ЖК «Байкальский берег»',
    'zhk-baykalskiy-bereg',
    'residential_complex',
    'under_construction',
    'Комфорт',
    'Монолит-кирпич',
    4,
    2026,
    v_address,
    v_district,
    v_lat,
    v_lng,
    'Жилой комплекс комфорт-класса у Байкальского тракта: 1 корпус, 16 этажей, закрытый двор без машин, подземный паркинг, коммерция на 1 этаже. В продаже квартиры от студии до 3-комнатных с чистовой отделкой. Дом сдаётся в IV квартале 2026 года.',
    v_cover,
    'Ипотека от 5,9% у банков-партнёров, материнский капитал принимается',
    'Рассрочка 0% на 12 месяцев от застройщика (первый взнос от 30%)',
    jsonb_build_array(
      'Закрытый двор',
      'Подземный паркинг',
      'Детская площадка',
      'Чистовая отделка',
      'Лифты OTIS',
      'Видеонаблюдение'
    ),
    true,
    'published',
    1280
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    status = EXCLUDED.status,
    housing_class = EXCLUDED.housing_class,
    material = EXCLUDED.material,
    delivery_quarter = EXCLUDED.delivery_quarter,
    delivery_year = EXCLUDED.delivery_year,
    address = EXCLUDED.address,
    district = EXCLUDED.district,
    description = EXCLUDED.description,
    cover_photo = EXCLUDED.cover_photo,
    mortgage_terms = EXCLUDED.mortgage_terms,
    installment_terms = EXCLUDED.installment_terms,
    features = EXCLUDED.features,
    is_published = true,
    moderation_status = 'published',
    updated_at = now();

  -- Очереди / корпуса
  INSERT INTO public.project_phases (
    id, project_id, name, sort_order, delivery_quarter, delivery_year, status
  ) VALUES (
    'd0000000-0000-4000-8000-000000000031',
    v_project_id,
    'Корпус 1',
    0,
    4,
    2026,
    'under_construction'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = now();

  -- Ход строительства
  INSERT INTO public.construction_stages (
    id, project_id, title, stage_date, description, sort_order, is_published
  ) VALUES
    (
      'd0000000-0000-4000-8000-000000000041',
      v_project_id,
      'Фундамент и подземный паркинг',
      '2025-06-15',
      'Завершены работы нулевого цикла, гидроизоляция паркинга.',
      0,
      true
    ),
    (
      'd0000000-0000-4000-8000-000000000042',
      v_project_id,
      'Монолит 1–8 этажи',
      '2025-12-01',
      'Возведён каркас до 8 этажа, начат монтаж окон.',
      1,
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_published = true,
    updated_at = now();

  -- Медиа проекта
  INSERT INTO public.project_media (id, project_id, kind, url, caption, sort_order)
  VALUES
    (
      'd0000000-0000-4000-8000-000000000051',
      v_project_id,
      'render',
      v_cover,
      'Рендер фасада',
      0
    ),
    (
      'd0000000-0000-4000-8000-000000000052',
      v_project_id,
      'photo',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      'Двор и входная группа',
      1
    )
  ON CONFLICT (id) DO UPDATE SET
    url = EXCLUDED.url,
    caption = EXCLUDED.caption;

  -- Планировки
  INSERT INTO public.project_unit_types (
    id, project_id, title, rooms, area_from, area_to, floors,
    price_from, price_to, plan_image_url, is_active
  ) VALUES
    (
      'd0000000-0000-4000-8000-000000000021',
      v_project_id,
      'Студия S',
      'Студия',
      28, 32, '3–16',
      4200000, 4800000,
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      true
    ),
    (
      'd0000000-0000-4000-8000-000000000022',
      v_project_id,
      '1-комнатная M',
      '1',
      38, 45, '2–15',
      5500000, 6400000,
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      true
    ),
    (
      'd0000000-0000-4000-8000-000000000023',
      v_project_id,
      '2-комнатная L',
      '2',
      58, 68, '2–14',
      7800000, 9200000,
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      true
    ),
    (
      'd0000000-0000-4000-8000-000000000024',
      v_project_id,
      '2-комнатная XL',
      '2',
      72, 78, '5–16',
      9500000, 10800000,
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      true
    ),
    (
      'd0000000-0000-4000-8000-000000000025',
      v_project_id,
      '3-комнатная Family',
      '3',
      88, 96, '4–12',
      11800000, 13500000,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      true
    ),
    (
      'd0000000-0000-4000-8000-000000000026',
      v_project_id,
      '3-комнатная Premium',
      '3',
      105, 112, '10–16',
      14800000, 16200000,
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    rooms = EXCLUDED.rooms,
    area_from = EXCLUDED.area_from,
    area_to = EXCLUDED.area_to,
    price_from = EXCLUDED.price_from,
    price_to = EXCLUDED.price_to,
    plan_image_url = EXCLUDED.plan_image_url,
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'Developer % / project % ready for user % (%)',
    v_developer_id, v_project_id, v_email, v_user_id;
END $$;

-- =============================================================================
-- Квартиры в каталоге (один дом, разная площадь)
-- =============================================================================

INSERT INTO public.properties (
  id,
  segment,
  type,
  class,
  deal_type,
  area,
  price,
  price_per_m2,
  address,
  district,
  floor,
  total_floors,
  ceiling_height,
  parking,
  condition,
  layout,
  deposit,
  contract_term,
  description,
  features,
  cover_photo,
  photos,
  photos_count,
  lat,
  lng,
  is_active,
  moderation_status,
  request_type,
  views_count,
  published_date,
  submitted_by,
  developer_id,
  developer_project_id,
  developer_unit_type_id,
  extras
) VALUES
-- 1) Студия 29.5 м²
(
  'd1000000-0000-4000-8000-000000000001',
  'residential',
  'Квартира',
  '-',
  'Продажа',
  29.5,
  4450000,
  150847,
  'г. Иркутск, ул. Байкальская, 280к1, кв. 12',
  'Свердловский',
  '4',
  16,
  2.7,
  'Подземный паркинг (опция)',
  'Чистовая отделка',
  'Студия',
  '',
  'ДДУ / эскроу',
  E'Компактная студия 29,5 м² в ЖК «Байкальский берег». Светлая планировка с кухней-гостиной, местом под спальню и санузлом. Чистовая отделка «под ключ»: ламинат, плитка в санузле, покраска стен, розетки и выключатели установлены.\n\nОкна на спокойный двор, этаж 4 из 16. В доме закрытый двор без машин, видеонаблюдение, два пассажирских лифта. Ипотека и материнский капитал — по согласованию с банками-партнёрами. Сдача корпуса — IV квартал 2026.',
  ARRAY['Чистовая отделка','Лифт','Закрытый двор','Видеонаблюдение','Новостройка','Ипотека'],
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1600&q=80'
  ],
  3,
  52.2558, 104.3352,
  true, 'published', 'free_listing', 340, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'wewa666@mail.ru' LIMIT 1),
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'd0000000-0000-4000-8000-000000000021',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', 'Студия',
    'building_type', 'Монолит-кирпич',
    'year_built', 2026,
    'balcony', 'Нет',
    'furniture', 'Без мебели',
    'bathroom', 'Совмещённый',
    'market', 'Новостройка',
    'window_view', 'Во двор',
    'living_area', 18,
    'kitchen_area', 8,
    'mortgage', true,
    'landlord_type', 'Застройщик',
    'agent_name', 'БайкалСтройИнвест',
    'agent_company', 'БайкалСтройИнвест',
    'agent_phone', '+7 (3952) 48-00-66',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', v_cover,
    'developer_id', 'd0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Застройщик ЖК «Байкальский берег» в Иркутске.'
  )
),
-- 2) 1-комн. 41 м²
(
  'd1000000-0000-4000-8000-000000000002',
  'residential',
  'Квартира',
  '-',
  'Продажа',
  41,
  5980000,
  145854,
  'г. Иркутск, ул. Байкальская, 280к1, кв. 47',
  'Свердловский',
  '7',
  16,
  2.7,
  'Подземный паркинг (опция)',
  'Чистовая отделка',
  '1-комнатная',
  '',
  'ДДУ / эскроу',
  E'Однокомнатная квартира 41 м² с отдельной спальней и просторной кухней-гостиной. Планировка удобна для молодой семьи или инвестора под сдачу.\n\nВ комплекте чистовая отделка, тёплый пол в санузле, место под стиральную машину. Ориентация окон — на восток, утреннее солнце. Этаж 7, два лифта, закрытая территория. До остановки общественного транспорта — 4 минуты пешком.',
  ARRAY['Чистовая отделка','Лифт','Закрытый двор','Тёплый пол','Новостройка','Ипотека','Рядом остановка'],
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80'
  ],
  3,
  52.2558, 104.3352,
  true, 'published', 'free_listing', 512, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'wewa666@mail.ru' LIMIT 1),
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'd0000000-0000-4000-8000-000000000022',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', '1',
    'building_type', 'Монолит-кирпич',
    'year_built', 2026,
    'balcony', 'Лоджия',
    'furniture', 'Без мебели',
    'bathroom', 'Раздельный',
    'market', 'Новостройка',
    'window_view', 'На улицу',
    'living_area', 16,
    'kitchen_area', 12,
    'mortgage', true,
    'landlord_type', 'Застройщик',
    'agent_name', 'БайкалСтройИнвест',
    'agent_company', 'БайкалСтройИнвест',
    'agent_phone', '+7 (3952) 48-00-66',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', v_cover,
    'developer_id', 'd0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Застройщик ЖК «Байкальский берег» в Иркутске.'
  )
),
-- 3) 2-комн. 62 м²
(
  'd1000000-0000-4000-8000-000000000003',
  'residential',
  'Квартира',
  '-',
  'Продажа',
  62,
  8450000,
  136290,
  'г. Иркутск, ул. Байкальская, 280к1, кв. 88',
  'Свердловский',
  '9',
  16,
  2.75,
  'Подземный паркинг (опция)',
  'Чистовая отделка',
  '2-комнатная',
  '',
  'ДДУ / эскроу',
  E'Двухкомнатная квартира 62 м²: две изолированные комнаты, кухня-гостиная 14 м², гардеробная ниша в прихожей. Подходит семье с ребёнком.\n\nДом комфорт-класса: бесшумные лифты, консьерж на входе, детская и спортивная площадки во дворе. Можно оформить семейную ипотеку. Показы в шоу-руме по записи.',
  ARRAY['Чистовая отделка','Лифт','Гардеробная','Закрытый двор','Детская площадка','Новостройка','Ипотека'],
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1600&q=80'
  ],
  3,
  52.2558, 104.3352,
  true, 'published', 'free_listing', 678, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'wewa666@mail.ru' LIMIT 1),
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'd0000000-0000-4000-8000-000000000023',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', '2',
    'building_type', 'Монолит-кирпич',
    'year_built', 2026,
    'balcony', 'Лоджия',
    'furniture', 'Без мебели',
    'bathroom', 'Раздельный',
    'market', 'Новостройка',
    'window_view', 'Во двор',
    'living_area', 28,
    'kitchen_area', 14,
    'mortgage', true,
    'landlord_type', 'Застройщик',
    'agent_name', 'БайкалСтройИнвест',
    'agent_company', 'БайкалСтройИнвест',
    'agent_phone', '+7 (3952) 48-00-66',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', v_cover,
    'developer_id', 'd0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Застройщик ЖК «Байкальский берег» в Иркутске.'
  )
),
-- 4) 2-комн. 75 м²
(
  'd1000000-0000-4000-8000-000000000004',
  'residential',
  'Квартира',
  '-',
  'Продажа',
  75,
  9980000,
  133067,
  'г. Иркутск, ул. Байкальская, 280к1, кв. 112',
  'Свердловский',
  '12',
  16,
  2.8,
  'Подземный паркинг (опция)',
  'Чистовая отделка',
  '2-комнатная евро',
  '',
  'ДДУ / эскроу',
  E'Просторная евро-двушка 75 м² с кухней-гостиной 22 м² и двумя спальнями. Панорамное остекление лоджии, вид на город с 12 этажа.\n\nВ отделке — ламинат 33 класса, керамогранит, скрытые люки ревизии. Рассрочка 0% на год при взносе от 30%. Машиноместо в паркинге можно купить отдельно.',
  ARRAY['Чистовая отделка','Лоджия','Панорамные окна','Лифт','Паркинг','Новостройка','Рассрочка','Ипотека'],
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80'
  ],
  3,
  52.2558, 104.3352,
  true, 'published', 'free_listing', 421, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'wewa666@mail.ru' LIMIT 1),
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'd0000000-0000-4000-8000-000000000024',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', '2',
    'building_type', 'Монолит-кирпич',
    'year_built', 2026,
    'balcony', 'Лоджия',
    'furniture', 'Без мебели',
    'bathroom', 'Раздельный',
    'market', 'Новостройка',
    'window_view', 'На город',
    'living_area', 32,
    'kitchen_area', 22,
    'mortgage', true,
    'landlord_type', 'Застройщик',
    'agent_name', 'БайкалСтройИнвест',
    'agent_company', 'БайкалСтройИнвест',
    'agent_phone', '+7 (3952) 48-00-66',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', v_cover,
    'developer_id', 'd0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Застройщик ЖК «Байкальский берег» в Иркутске.'
  )
),
-- 5) 3-комн. 92 м²
(
  'd1000000-0000-4000-8000-000000000005',
  'residential',
  'Квартира',
  '-',
  'Продажа',
  92,
  12450000,
  135326,
  'г. Иркутск, ул. Байкальская, 280к1, кв. 64',
  'Свердловский',
  '6',
  16,
  2.75,
  'Подземный паркинг (опция)',
  'Чистовая отделка',
  '3-комнатная',
  '',
  'ДДУ / эскроу',
  E'Трёхкомнатная семейная квартира 92 м²: мастер-спальня с гардеробом, две детские/кабинеты, кухня-гостиная, два санузла. Оптимально для семьи с двумя детьми.\n\nВо дворе — безопасная площадка и зоны отдыха без машин. Рядом школа и детский сад. Застройщик сопровождает сделку до получения ключей, помогает с ипотекой.',
  ARRAY['2 санузла','Гардеробная','Чистовая отделка','Закрытый двор','Детская площадка','Новостройка','Ипотека'],
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80'
  ],
  3,
  52.2558, 104.3352,
  true, 'published', 'free_listing', 289, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'wewa666@mail.ru' LIMIT 1),
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'd0000000-0000-4000-8000-000000000025',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', '3',
    'building_type', 'Монолит-кирпич',
    'year_built', 2026,
    'balcony', 'Лоджия',
    'furniture', 'Без мебели',
    'bathroom', '2 санузла',
    'market', 'Новостройка',
    'window_view', 'Во двор',
    'living_area', 48,
    'kitchen_area', 16,
    'mortgage', true,
    'landlord_type', 'Застройщик',
    'agent_name', 'БайкалСтройИнвест',
    'agent_company', 'БайкалСтройИнвест',
    'agent_phone', '+7 (3952) 48-00-66',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', v_cover,
    'developer_id', 'd0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Застройщик ЖК «Байкальский берег» в Иркутске.'
  )
),
-- 6) 3-комн. 108 м² premium
(
  'd1000000-0000-4000-8000-000000000006',
  'residential',
  'Квартира',
  '-',
  'Продажа',
  108,
  15590000,
  144352,
  'г. Иркутск, ул. Байкальская, 280к1, кв. 158',
  'Свердловский',
  '15',
  16,
  2.9,
  'Подземный паркинг (включён 1 м/м)',
  'Чистовая отделка premium',
  '3-комнатная premium',
  '',
  'ДДУ / эскроу',
  E'Премиальная трёхкомнатная квартира 108 м² на 15 этаже с видом на город. Высокие потолки 2,9 м, мастер-спальня с собственной ванной, кухня-гостиная 28 м², постирочная.\n\nВ цену входит одно машиноместо в подземном паркинге. Отделка премиум-класса: инженерная доска, скрытые двери, подготовленные выводы под кондиционеры. Ограниченное предложение — 4 квартиры этой серии в корпусе.',
  ARRAY['Premium отделка','Паркинг включён','Мастер-спальня','Высокие потолки','Панорамный вид','Новостройка','Ипотека'],
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80'
  ],
  4,
  52.2558, 104.3352,
  true, 'published', 'free_listing', 198, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'wewa666@mail.ru' LIMIT 1),
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'd0000000-0000-4000-8000-000000000026',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', '3',
    'building_type', 'Монолит-кирпич',
    'year_built', 2026,
    'balcony', 'Лоджия',
    'furniture', 'Без мебели',
    'bathroom', '2 санузла',
    'market', 'Новостройка',
    'window_view', 'На город',
    'living_area', 55,
    'kitchen_area', 28,
    'mortgage', true,
    'landlord_type', 'Застройщик',
    'agent_name', 'БайкалСтройИнвест',
    'agent_company', 'БайкалСтройИнвест',
    'agent_phone', '+7 (3952) 48-00-66',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', v_cover,
    'developer_id', 'd0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Застройщик ЖК «Байкальский берег» в Иркутске.'
  )
)
ON CONFLICT (id) DO UPDATE SET
  segment = EXCLUDED.segment,
  type = EXCLUDED.type,
  deal_type = EXCLUDED.deal_type,
  area = EXCLUDED.area,
  price = EXCLUDED.price,
  price_per_m2 = EXCLUDED.price_per_m2,
  address = EXCLUDED.address,
  district = EXCLUDED.district,
  floor = EXCLUDED.floor,
  total_floors = EXCLUDED.total_floors,
  ceiling_height = EXCLUDED.ceiling_height,
  parking = EXCLUDED.parking,
  condition = EXCLUDED.condition,
  layout = EXCLUDED.layout,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  cover_photo = EXCLUDED.cover_photo,
  photos = EXCLUDED.photos,
  photos_count = EXCLUDED.photos_count,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  is_active = true,
  moderation_status = 'published',
  submitted_by = EXCLUDED.submitted_by,
  developer_id = EXCLUDED.developer_id,
  developer_project_id = EXCLUDED.developer_project_id,
  developer_unit_type_id = EXCLUDED.developer_unit_type_id,
  extras = EXCLUDED.extras,
  updated_at = now();

-- Проверка
SELECT
  p.id,
  p.public_id,
  p.area,
  p.price,
  p.floor,
  p.address,
  p.developer_id IS NOT NULL AS has_developer,
  p.extras->>'rooms' AS rooms,
  p.extras->>'market' AS market
FROM public.properties p
WHERE p.id::text LIKE 'd1000000-0000-4000-8000-%'
ORDER BY p.area;

SELECT d.id, d.name, d.subtype, d.verification_status, m.user_id, u.email
FROM public.developers d
JOIN public.developer_members m ON m.developer_id = d.id
JOIN auth.users u ON u.id = m.user_id
WHERE d.id = 'd0000000-0000-4000-8000-000000000001';
