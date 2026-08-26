-- =============================================================================
-- Seed: застройщик деревянных домов для vanandrey.smi@mail.ru
-- subtype = frame_house_builder, 4 серии домов + объявления в каталоге
--
-- Порядок на VPS:
--   1) supabase/self_hosted_developers.sql
--   2) supabase/self_hosted_signup_roles.sql
--   3) Зарегистрируйте vanandrey.smi@mail.ru на сайте (если нет в auth.users)
--   4) Задеплойте static: public/mock/wooden-houses/*.jpg
--   5) этот файл
--
-- UUID (идемпотентно):
--   developer:  e0000000-0000-4000-8000-000000000001
--   projects:   e0000000-0000-4000-8000-00000000001{1-4}
--   unit types: e0000000-0000-4000-8000-00000000002{1-4}
--   properties: e1000000-0000-4000-8000-00000000000{1-4}
-- =============================================================================

ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS promotions JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
DECLARE
  v_email TEXT := 'vanandrey.smi@mail.ru';
  v_user_id UUID;
  v_developer_id UUID := 'e0000000-0000-4000-8000-000000000001';
  v_company TEXT := 'ТайгаДом';
  v_about TEXT :=
    'Строим деревянные и каркасные дома под ключ в Иркутске и области: каркас, клееный брус, оцилиндрованное бревно и модульные SIP-комплекты. Свой цех, понятные сметы, гарантия на конструкцию и сопровождение до заселения.';
  v_phone TEXT := '+7 (3952) 55-17-90';
  v_base TEXT := 'https://arendacity.com';
  v_logo TEXT;
  v_img1 TEXT;
  v_img2 TEXT;
  v_img3 TEXT;
  v_img4 TEXT;
  v_p1 UUID := 'e0000000-0000-4000-8000-000000000011';
  v_p2 UUID := 'e0000000-0000-4000-8000-000000000012';
  v_p3 UUID := 'e0000000-0000-4000-8000-000000000013';
  v_p4 UUID := 'e0000000-0000-4000-8000-000000000014';
BEGIN
  v_logo := v_base || '/mock/wooden-houses/01-karkas-baikal.jpg';
  v_img1 := v_base || '/mock/wooden-houses/01-karkas-baikal.jpg';
  v_img2 := v_base || '/mock/wooden-houses/02-kleeny-brus.jpg';
  v_img3 := v_base || '/mock/wooden-houses/03-brevno-angara.jpg';
  v_img4 := v_base || '/mock/wooden-houses/04-modul-sip.jpg';

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'Пользователь % не найден в auth.users. Сначала зарегистрируйте аккаунт на сайте.',
      v_email;
  END IF;

  DELETE FROM public.agency_members WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET
    account_type = 'developer',
    agency_name = v_company,
    agency_about = v_about,
    verification_status = 'verified',
    verified_at = COALESCE(verified_at, now()),
    full_name = COALESCE(NULLIF(trim(full_name), ''), 'Андрей Смирнов'),
    phone = COALESCE(NULLIF(trim(phone), ''), v_phone)
  WHERE id = v_user_id;

  INSERT INTO public.developers (
    id, name, logo_url, about, subtype, city, region, phone, website,
    verification_status, verified_at, verified_by, promotions
  ) VALUES (
    v_developer_id,
    v_company,
    v_logo,
    v_about,
    'frame_house_builder',
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
        'title', 'Фундамент в подарок',
        'text', 'При договоре «под ключ» до 30 сентября — свайно-винтовой фундамент за наш счёт (до 24 свай).'
      ),
      jsonb_build_object(
        'badge', 'Рассрочка',
        'title', '0% на 6 месяцев',
        'text', 'Первый взнос от 40%, остаток равными платежами без процентов банку.'
      )
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    about = EXCLUDED.about,
    subtype = EXCLUDED.subtype,
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    phone = EXCLUDED.phone,
    verification_status = 'verified',
    verified_at = COALESCE(public.developers.verified_at, now()),
    promotions = EXCLUDED.promotions,
    updated_at = now();

  INSERT INTO public.developer_members (developer_id, user_id, role)
  VALUES (v_developer_id, v_user_id, 'owner')
  ON CONFLICT (developer_id, user_id) DO UPDATE SET role = 'owner';

  -- ─── Проект 1: каркасный «Байкал-120» ───────────────────────────────────
  INSERT INTO public.developer_projects (
    id, developer_id, title, slug, project_kind, status, housing_class, material,
    delivery_quarter, delivery_year, address, district, lat, lng, description,
    cover_photo, mortgage_terms, installment_terms, features,
    is_published, moderation_status, views_count
  ) VALUES (
    v_p1, v_developer_id,
    'Серия «Байкал-120» — каркасный дом',
    'baykal-120-karkas',
    'house_series',
    'completed',
    'Комфорт',
    'Каркас + минвата 200 мм',
    NULL, NULL,
    'Иркутский район, показ на базе ТайгаДом',
    'Иркутский',
    52.3120, 104.2480,
    E'Каркасный дом для постоянного проживания площадью около 120 м². Стойки 200 мм, утепление минеральной ватой, ветро- и парозащита, обшивка имитацией бруса.\n\nПланировка: кухня-гостиная с панорамным окном, 3 спальни, 2 санузла, техническое помещение, терраса. Срок сборки коробки на готовом фундаменте — от 6 недель. Комплектации: «тёплый контур», «под чистовую», «под ключ».\n\nПодходит для участков ИЖС и СНТ в Иркутске и области. Проект адаптируем под рельеф и розу ветров.',
    v_img1,
    'Ипотека на ИЖС у банков-партнёров (по согласованию)',
    'Рассрочка 0% на 6 месяцев от 40% взноса',
    jsonb_build_array('Каркас 200 мм','3 спальни','Терраса','Под ключ','Гарантия 5 лет'),
    true, 'published', 420
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description,
    cover_photo = EXCLUDED.cover_photo, material = EXCLUDED.material,
    delivery_quarter = EXCLUDED.delivery_quarter,
    delivery_year = EXCLUDED.delivery_year,
    features = EXCLUDED.features, is_published = true,
    moderation_status = 'published', updated_at = now();

  -- ─── Проект 2: клееный брус «Кедр-150» ──────────────────────────────────
  INSERT INTO public.developer_projects (
    id, developer_id, title, slug, project_kind, status, housing_class, material,
    delivery_quarter, delivery_year, address, district, lat, lng, description,
    cover_photo, mortgage_terms, installment_terms, features,
    is_published, moderation_status, views_count
  ) VALUES (
    v_p2, v_developer_id,
    'Серия «Кедр-150» — клееный брус',
    'kedr-150-kleeny-brus',
    'house_series',
    'under_construction',
    'Бизнес',
    'Клееный брус 200×180',
    NULL, NULL,
    'пос. Патроны, демо-участок ТайгаДом',
    'Иркутский',
    52.3485, 104.1980,
    E'Двухэтажный дом из клееного бруса ~150 м². Камерная сушка, минимальная усадка, тёплые швы, панорамная терраса на юг.\n\nНа первом этаже — гостиная с каминной зоной, кухня, санузел и кабинет; на втором — 3 спальни и ванная. Кровля металлочерепица, окна энергосберегающие.\n\nСрок изготовления домокомплекта 8–12 недель, монтаж на участке 3–5 недель. Отделка внутри — по смете: масло/лак по дереву или комбинированная.',
    v_img2,
    'Ипотека / сельская ипотека — консультация в офисе',
    'Этапы оплаты: 40% / 30% / 30%',
    jsonb_build_array('Клееный брус','2 этажа','Каминная зона','Панорамная терраса','Низкая усадка'),
    true, 'published', 310
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description,
    cover_photo = EXCLUDED.cover_photo, material = EXCLUDED.material,
    delivery_quarter = EXCLUDED.delivery_quarter,
    delivery_year = EXCLUDED.delivery_year,
    features = EXCLUDED.features, is_published = true,
    moderation_status = 'published', updated_at = now();

  -- ─── Проект 3: бревно «Ангара-сруб» ─────────────────────────────────────
  INSERT INTO public.developer_projects (
    id, developer_id, title, slug, project_kind, status, housing_class, material,
    delivery_quarter, delivery_year, address, district, lat, lng, description,
    cover_photo, mortgage_terms, installment_terms, features,
    is_published, moderation_status, views_count
  ) VALUES (
    v_p3, v_developer_id,
    'Серия «Ангара-сруб» — оцилиндрованное бревно',
    'angara-srub-brevno',
    'house_series',
    'completed',
    'Комфорт',
    'Оцилиндрованное бревно Ø220–240',
    NULL, NULL,
    'Слюдянский район, база отдыха (показ по записи)',
    'Слюдянка',
    51.6590, 103.7060,
    E'Классический сруб из оцилиндрованного бревна с современной инженерией. Диаметр 220–240 мм, чаши заводской обработки, межвенцовый утеплитель.\n\nПлощадь ~95–110 м² в зависимости от комплектации: 1 этаж + мансарда, крыльцо, баня-пристрой опционально. Идеален для дачи и сезонного/постоянного проживания после утепления мансарды.\n\nУсадка учитывается в проекте (скользящие крепления окон, компенсаторы). Полный пакет: сруб, кровля, окна, черновые полы.',
    v_img3,
    'Рассрочка от производителя',
    'Оплата по этапам изготовления сруба',
    jsonb_build_array('Оцилиндровка','Мансарда','Традиционный вид','Баня опция','Своя заготовка'),
    true, 'published', 265
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description,
    cover_photo = EXCLUDED.cover_photo, material = EXCLUDED.material,
    delivery_quarter = EXCLUDED.delivery_quarter,
    delivery_year = EXCLUDED.delivery_year,
    features = EXCLUDED.features, is_published = true,
    moderation_status = 'published', updated_at = now();

  -- ─── Проект 4: модульный SIP «Модуль-90» ────────────────────────────────
  INSERT INTO public.developer_projects (
    id, developer_id, title, slug, project_kind, status, housing_class, material,
    delivery_quarter, delivery_year, address, district, lat, lng, description,
    cover_photo, mortgage_terms, installment_terms, features,
    is_published, moderation_status, views_count
  ) VALUES (
    v_p4, v_developer_id,
    'Серия «Модуль-90» — каркасно-щитовой / SIP',
    'modul-90-sip',
    'house_series',
    'planned',
    'Эконом / комфорт',
    'SIP / щиты с утеплителем 150+ мм',
    NULL, NULL,
    'Доставка и монтаж по Иркутской области',
    'Иркутск',
    52.2869, 104.3050,
    E'Компактный модульный дом ~90 м² заводской сборки. Стеновые и кровельные щиты приезжают готовыми — монтаж на свайном фундаменте за несколько дней.\n\nПланировка open-space: кухня-гостиная, 2 спальни, санузел, постирочная, просторная терраса. Тёмная вертикальная обшивка, энергоэффективные окна.\n\nВарианты: гостевой дом, дача выходного дня или стартовый дом для молодой семьи. Можно масштабировать вторым модулем позже.',
    v_img4,
    'Рассрочка / кредит на ИЖС',
    'Фикс-смета домокомплекта',
    jsonb_build_array('Быстрый монтаж','SIP/щиты','2 спальни','Терраса','Фикс-смета'),
    true, 'published', 188
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description,
    cover_photo = EXCLUDED.cover_photo, material = EXCLUDED.material,
    delivery_quarter = EXCLUDED.delivery_quarter,
    delivery_year = EXCLUDED.delivery_year,
    features = EXCLUDED.features, is_published = true,
    moderation_status = 'published', updated_at = now();

  -- Типы (1 модель = 1 unit type на серию)
  INSERT INTO public.project_unit_types (
    id, project_id, title, rooms, area_from, area_to, floors,
    price_from, price_to, plan_image_url, is_active
  ) VALUES
    ('e0000000-0000-4000-8000-000000000021', v_p1, 'Байкал-120', '4', 118, 125, '1+мансарда', 6800000, 9200000, v_img1, true),
    ('e0000000-0000-4000-8000-000000000022', v_p2, 'Кедр-150', '5', 145, 155, '2', 11200000, 14800000, v_img2, true),
    ('e0000000-0000-4000-8000-000000000023', v_p3, 'Ангара-сруб', '3', 95, 110, '1+мансарда', 5400000, 7800000, v_img3, true),
    ('e0000000-0000-4000-8000-000000000024', v_p4, 'Модуль-90', '3', 88, 95, '1', 4200000, 6100000, v_img4, true)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, area_from = EXCLUDED.area_from, area_to = EXCLUDED.area_to,
    price_from = EXCLUDED.price_from, price_to = EXCLUDED.price_to,
    plan_image_url = EXCLUDED.plan_image_url, is_active = true;

  -- Медиа обложек
  INSERT INTO public.project_media (id, project_id, kind, url, caption, sort_order) VALUES
    ('e0000000-0000-4000-8000-000000000051', v_p1, 'render', v_img1, 'Каркасный «Байкал-120»', 0),
    ('e0000000-0000-4000-8000-000000000052', v_p2, 'render', v_img2, 'Клееный брус «Кедр-150»', 0),
    ('e0000000-0000-4000-8000-000000000053', v_p3, 'render', v_img3, 'Сруб «Ангара»', 0),
    ('e0000000-0000-4000-8000-000000000054', v_p4, 'render', v_img4, 'Модуль SIP-90', 0)
  ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, caption = EXCLUDED.caption;

  RAISE NOTICE 'Wooden developer % ready for % (%)', v_developer_id, v_email, v_user_id;
END $$;

-- =============================================================================
-- Объявления в каталоге (4 дома)
-- =============================================================================

INSERT INTO public.properties (
  id, segment, type, class, deal_type, area, price, price_per_m2,
  address, district, floor, total_floors, ceiling_height, parking, condition,
  layout, deposit, contract_term, description, features, cover_photo, photos,
  photos_count, lat, lng, is_active, moderation_status, request_type,
  views_count, published_date, submitted_by, developer_id, developer_project_id,
  developer_unit_type_id, extras
) VALUES
(
  'e1000000-0000-4000-8000-000000000001',
  'residential', 'Дом на заказ', '-', 'Продажа', 120, 7900000, 65833,
  'Иркутский район, проект «Байкал-120» (строительство на вашем участке)',
  'Иркутский', '1', 2, 2.7, 'На участке', 'Под ключ', 'Свободная',
  '', 'Договор подряда / купли домокомплекта',
  E'Каркасный дом серии «Байкал-120» от застройщика ТайгаДом. Около 120 м²: кухня-гостиная, 3 спальни, 2 санузла, терраса.\n\nСтены — каркас 200 мм с минеральной ватой, имитация бруса снаружи. Фундамент свайно-винтовой или УШП — по геологии участка. Срок коробки от 6 недель после готовности фундамента.\n\nЦена указана за комплектацию «под ключ» на типовом участке Иркутского района; итоговая смета считается после выезда инженера. Ипотека на ИЖС и рассрочка 0% — по запросу.',
  ARRAY['Каркасный','Под ключ','3 спальни','Терраса','ИЖС','Застройщик'],
  'https://arendacity.com/mock/wooden-houses/01-karkas-baikal.jpg',
  ARRAY['https://arendacity.com/mock/wooden-houses/01-karkas-baikal.jpg'],
  1, 52.3120, 104.2480, true, 'published', 'free_listing', 156, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'vanandrey.smi@mail.ru' LIMIT 1),
  'e0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000011',
  'e0000000-0000-4000-8000-000000000021',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Дом на заказ'),
    'rooms', '4',
    'building_type', 'Каркасный',
    'market', 'На заказ',
    'wood_config', 'frame_insulated',
    'wood_wall', 'Каркас 200 мм + утеплитель',
    'wood_floors', '1 этаж + мансарда',
    'wood_foundation', 'Свайно-винтовой',
    'wood_roof', 'Двускатная, металлочерепица',
    'wood_finish', 'Под ключ',
    'landlord_type', 'Застройщик',
    'agent_name', 'ТайгаДом',
    'agent_company', 'ТайгаДом',
    'agent_phone', '+7 (3952) 55-17-90',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', 'https://arendacity.com/mock/wooden-houses/01-karkas-baikal.jpg',
    'developer_id', 'e0000000-0000-4000-8000-000000000001',
    'agent_agency_about', 'Деревянные и каркасные дома под ключ в Иркутске и области.'
  )
),
(
  'e1000000-0000-4000-8000-000000000002',
  'residential', 'Дом на заказ', '-', 'Продажа', 150, 12900000, 86000,
  'Иркутский район, серия «Кедр-150» из клееного бруса',
  'Иркутский', '1', 2, 2.8, 'На участке', 'Под чистовую отделку', 'Свободная',
  '', 'Договор подряда',
  E'Дом из клееного бруса серии «Кедр-150» (~150 м²). Два полноценных этажа, панорамная терраса, каминная зона в гостиной, 3 спальни на втором этаже.\n\nБрус камерной сушки 200×180, низкая усадка, тёплый контур. Кровля — металлочерепица, окна — двухкамерный стеклопакет.\n\nЦена — ориентир комплектации «под чистовую». Возможен полный «под ключ». Показ демо-дома в Патронах — по записи.',
  ARRAY['Клееный брус','2 этажа','Терраса','Камин','Бизнес-класс'],
  'https://arendacity.com/mock/wooden-houses/02-kleeny-brus.jpg',
  ARRAY['https://arendacity.com/mock/wooden-houses/02-kleeny-brus.jpg'],
  1, 52.3485, 104.1980, true, 'published', 'free_listing', 98, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'vanandrey.smi@mail.ru' LIMIT 1),
  'e0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000012',
  'e0000000-0000-4000-8000-000000000022',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Дом на заказ'),
    'rooms', '5',
    'building_type', 'Клееный брус',
    'market', 'На заказ',
    'wood_config', 'glulam',
    'wood_wall', 'Клееный брус 200×180',
    'wood_floors', '2 этажа',
    'wood_foundation', 'Лента / УШП',
    'wood_roof', 'Двускатная, металлочерепица',
    'wood_finish', 'Под чистовую',
    'landlord_type', 'Застройщик',
    'agent_name', 'ТайгаДом',
    'agent_company', 'ТайгаДом',
    'agent_phone', '+7 (3952) 55-17-90',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'agent_avatar_url', 'https://arendacity.com/mock/wooden-houses/02-kleeny-brus.jpg',
    'developer_id', 'e0000000-0000-4000-8000-000000000001'
  )
),
(
  'e1000000-0000-4000-8000-000000000003',
  'residential', 'Дом на заказ', '-', 'Продажа', 105, 6500000, 61905,
  'Слюдянский район / ваш участок — сруб «Ангара»',
  'Слюдянка', '1', 2, 2.5, 'На участке', 'Черновая отделка', 'Свободная',
  '', 'Договор на домокомплект',
  E'Сруб из оцилиндрованного бревна Ø220–240 мм, серия «Ангара-сруб». Площадь около 105 м²: первый этаж + мансарда, крыльцо, возможность пристроить баню.\n\nЗаводская чаша, межвенцовый утеплитель, компенсаторы усадки. В комплекте — кровля, окна, черновые полы. Постоянное проживание — после утепления мансарды и инженерии.\n\nПоказ готового объекта в Слюдянке по записи. Доставка комплекта по области.',
  ARRAY['Бревно','Сруб','Мансарда','Дача / ИЖС','Традиционный вид'],
  'https://arendacity.com/mock/wooden-houses/03-brevno-angara.jpg',
  ARRAY['https://arendacity.com/mock/wooden-houses/03-brevno-angara.jpg'],
  1, 51.6590, 103.7060, true, 'published', 'free_listing', 74, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'vanandrey.smi@mail.ru' LIMIT 1),
  'e0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000013',
  'e0000000-0000-4000-8000-000000000023',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Дом на заказ','Дача'),
    'rooms', '3',
    'building_type', 'Бревно',
    'market', 'На заказ',
    'wood_config', 'round_log',
    'wood_wall', 'Оцилиндрованное бревно Ø220–240',
    'wood_floors', '1 этаж + мансарда',
    'wood_foundation', 'Свайно-винтовой',
    'wood_roof', 'Двускатная',
    'wood_finish', 'Черновая',
    'landlord_type', 'Застройщик',
    'agent_name', 'ТайгаДом',
    'agent_company', 'ТайгаДом',
    'agent_phone', '+7 (3952) 55-17-90',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'developer_id', 'e0000000-0000-4000-8000-000000000001'
  )
),
(
  'e1000000-0000-4000-8000-000000000004',
  'residential', 'Дом на заказ', '-', 'Продажа', 90, 5200000, 57778,
  'Иркутск и область — модульный «Модуль-90»',
  'Иркутск', '1', 1, 2.7, 'На участке', 'Под чистовую отделку', 'Open-space',
  '', 'Фикс-смета домокомплекта',
  E'Модульный каркасно-щитовой дом «Модуль-90» (~90 м²). Заводские щиты, монтаж на сваях за несколько дней. Open-space гостиная, 2 спальни, санузел, терраса.\n\nПодходит как дача, гостевой дом или стартовый дом. Можно добавить второй модуль позже. Фиксированная смета комплекта до подписания договора.\n\nДоставка по Иркутской области. Консультация и расчёт фундамента — бесплатно.',
  ARRAY['Модульный','SIP','Быстрый монтаж','2 спальни','Фикс-смета'],
  'https://arendacity.com/mock/wooden-houses/04-modul-sip.jpg',
  ARRAY['https://arendacity.com/mock/wooden-houses/04-modul-sip.jpg'],
  1, 52.2869, 104.3050, true, 'published', 'free_listing', 61, now(),
  (SELECT id FROM auth.users WHERE lower(email) = 'vanandrey.smi@mail.ru' LIMIT 1),
  'e0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000014',
  'e0000000-0000-4000-8000-000000000024',
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Дом на заказ'),
    'rooms', '3',
    'building_type', 'Каркасно-щитовой',
    'market', 'На заказ',
    'wood_config', 'frame_sip',
    'wood_wall', 'Щиты с утеплителем 150+ мм',
    'wood_floors', '1 этаж',
    'wood_foundation', 'Свайно-винтовой',
    'wood_roof', 'Двускатная',
    'wood_finish', 'Под чистовую',
    'landlord_type', 'Застройщик',
    'agent_name', 'ТайгаДом',
    'agent_company', 'ТайгаДом',
    'agent_phone', '+7 (3952) 55-17-90',
    'agent_account_type', 'developer',
    'agent_verified', true,
    'developer_id', 'e0000000-0000-4000-8000-000000000001'
  )
)
  ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  cover_photo = EXCLUDED.cover_photo,
  photos = EXCLUDED.photos,
  price = EXCLUDED.price,
  type = EXCLUDED.type,
  extras = EXCLUDED.extras,
  is_active = true,
  moderation_status = 'published',
  developer_id = EXCLUDED.developer_id,
  developer_project_id = EXCLUDED.developer_project_id,
  developer_unit_type_id = EXCLUDED.developer_unit_type_id,
  submitted_by = EXCLUDED.submitted_by,
  updated_at = now();
