-- Мок-квартира для проверки жилого раздела
-- Агент: Анастасия Романова · АрендаСити
-- Выполнить в SQL Editor self-hosted каталога одним запуском
--
-- Удалить потом:
--   DELETE FROM public.properties WHERE id = 'a1111111-1111-4111-8111-111111111101';

-- 1) Добавляем segment, если его ещё нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'property_segment'
  ) THEN
    CREATE TYPE public.property_segment AS ENUM ('commercial', 'residential');
  END IF;
END$$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS segment public.property_segment NOT NULL DEFAULT 'commercial';

CREATE INDEX IF NOT EXISTS idx_properties_segment_active
  ON public.properties (segment, is_active, created_at DESC);

-- 2) Мок-квартира
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
  extras
) VALUES (
  'a1111111-1111-4111-8111-111111111101',
  'residential',
  'Квартира',
  '-',
  'Аренда',
  58,
  42000,
  724,
  'г. Иркутск, ул. Карла Маркса, 35',
  'Кировский',
  '5',
  9,
  2.7,
  'Наземный, 1 м/м',
  'Евроремонт',
  '-',
  '1 месяц',
  'от 11 мес',
  'Светлая 2-комнатная квартира в центре Иркутска. Свежий евроремонт, мебель и техника, рядом остановка и парк. Объект ведёт Анастасия Романова, агентство АрендаСити. Можно с детьми. Показы ежедневно.',
  ARRAY[
    'Мебель',
    'Техника',
    'Кондиционер',
    'Стиральная машина',
    'Холодильник',
    'Интернет',
    'Лифт',
    'Рядом остановка',
    'Рядом парк',
    'Центр города'
  ],
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80'
  ],
  3,
  52.286974,
  104.305018,
  true,
  'published',
  'management',
  512,
  now(),
  jsonb_build_object(
    'segment', 'residential',
    'property_types', jsonb_build_array('Квартира'),
    'rooms', '2',
    'building_type', 'Кирпичный',
    'year_built', 1986,
    'balcony', 'Лоджия',
    'furniture', 'С мебелью',
    'bathroom', 'Раздельный',
    'market', 'Вторичка',
    'window_view', 'Во двор',
    'living_area', 34,
    'kitchen_area', 9,
    'pets_allowed', false,
    'children_allowed', true,
    'mortgage', false,
    'landlord_type', 'Агентство',
    'utilities_included', 'По счётчикам',
    'agent_name', 'Анастасия Романова',
    'agent_phone', '+7 (908) 658-19-19',
    'agent_company', 'АрендаСити',
    'agent_account_type', 'realtor',
    'agent_verified', true,
    'agent_rating', 4.9,
    'agent_response_min', 12,
    'agent_objects_count', 190,
    'agent_agency_about', 'Агентство недвижимости АрендаСити. Подбор жилья и коммерции в Иркутске и области.'
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
  condition = EXCLUDED.condition,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  cover_photo = EXCLUDED.cover_photo,
  photos = EXCLUDED.photos,
  photos_count = EXCLUDED.photos_count,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  is_active = EXCLUDED.is_active,
  moderation_status = EXCLUDED.moderation_status,
  extras = EXCLUDED.extras,
  updated_at = now();

-- Проверка
SELECT id, public_id, segment, type, deal_type, price, address, district, is_active, moderation_status
FROM public.properties
WHERE id = 'a1111111-1111-4111-8111-111111111101';
