-- Справочники для управления полями объектов недвижимости
-- Выполнить в Supabase SQL Editor
-- Безопасно повторять: индексы/политики/значения не дублируются

CREATE TABLE IF NOT EXISTS dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  value text NOT NULL,
  label text,
  parent text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, value)
);

CREATE INDEX IF NOT EXISTS idx_dict_category ON dictionaries(category);
CREATE INDEX IF NOT EXISTS idx_dict_category_active ON dictionaries(category, is_active);

ALTER TABLE dictionaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dictionaries' AND policyname = 'dictionaries_select'
  ) THEN
    CREATE POLICY "dictionaries_select" ON dictionaries
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dictionaries' AND policyname = 'dictionaries_insert'
  ) THEN
    CREATE POLICY "dictionaries_insert" ON dictionaries
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dictionaries' AND policyname = 'dictionaries_update'
  ) THEN
    CREATE POLICY "dictionaries_update" ON dictionaries
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dictionaries' AND policyname = 'dictionaries_delete'
  ) THEN
    CREATE POLICY "dictionaries_delete" ON dictionaries
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
      );
  END IF;
END$$;

-- Типы объектов
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('property_type', 'Офис', 1),
  ('property_type', 'Торговая', 2),
  ('property_type', 'Склад', 3),
  ('property_type', 'Производство', 5)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('property_type', 'Павильон', 'commercial', 6),
  ('property_type', 'ПСН', 'commercial', 7),
  ('property_type', 'Общепит', 'commercial', 8),
  ('property_type', 'Автосервис', 'commercial', 9)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('property_type', 'Квартира', 'residential', 10),
  ('property_type', 'Дом', 'residential', 11),
  ('property_type', 'Дом на заказ', 'residential', 18),
  ('property_type', 'Комната', 'residential', 12),
  ('property_type', 'Таунхаус', 'residential', 13),
  ('property_type', 'Апартаменты', 'residential', 15),
  ('property_type', 'Дача', 'residential', 16),
  ('property_type', 'Коттедж', 'residential', 17),
  ('property_type', 'Гараж', 'residential', 19),
  ('property_type', 'Машиноместо', 'residential', 20),
  ('property_type', 'Доля', 'residential', 21)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('property_type', 'Земля', 'land', 40),
  ('property_type', 'Участок', 'land', 41)
ON CONFLICT (category, value) DO NOTHING;

-- Классы объектов
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('property_class', 'A+', 1),
  ('property_class', 'A', 2),
  ('property_class', 'B+', 3),
  ('property_class', 'B', 4),
  ('property_class', 'C', 5),
  ('property_class', '-', 6)
ON CONFLICT (category, value) DO NOTHING;

-- Типы сделок
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('deal_type', 'Аренда', 1),
  ('deal_type', 'Продажа', 2),
  ('deal_type', 'Посуточно', 3)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('market', 'Вторичка', 1),
  ('market', 'Новостройка', 2),
  ('market', 'На заказ', 3)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('rooms', 'Студия', 0),
  ('rooms', '1', 1),
  ('rooms', '2', 2),
  ('rooms', '3', 3),
  ('rooms', '4+', 4),
  ('rooms', '5', 5),
  ('rooms', '6+', 6),
  ('building_type', 'Панельный', 1),
  ('building_type', 'Кирпичный', 2),
  ('building_type', 'Монолит', 3),
  ('building_type', 'Деревянный', 4),
  ('building_type', 'Блочный', 5),
  ('building_type', 'Монолит-кирпич', 6),
  ('building_type', 'Каркасный', 7),
  ('building_type', 'Каркасно-щитовой', 8),
  ('building_type', 'Каркас с кирпичом', 9),
  ('building_type', 'Клееный брус', 10),
  ('building_type', 'Профилированный брус', 11),
  ('building_type', 'Брус', 12),
  ('building_type', 'Двойной брус', 13),
  ('building_type', 'Брус с утеплением', 14),
  ('building_type', 'Оцилиндрованное бревно', 15),
  ('building_type', 'Рубленое бревно', 16),
  ('building_type', 'Лафет', 17),
  ('building_type', 'СИП-панели', 18),
  ('building_type', 'Фахверк', 19),
  ('building_type', 'CLT', 20),
  ('building_type', 'Баня (дерево)', 21),
  ('building_type', 'Дачный деревянный', 22)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('balcony', 'Нет', 1),
  ('balcony', 'Балкон', 2),
  ('balcony', 'Лоджия', 3),
  ('balcony', 'Балкон и лоджия', 4),
  ('balcony', '2 балкона', 5),
  ('furniture', 'С мебелью', 1),
  ('furniture', 'Без мебели', 2),
  ('furniture', 'Частично', 3),
  ('bathroom', 'Совмещённый', 1),
  ('bathroom', 'Раздельный', 2),
  ('bathroom', '2 санузла', 3),
  ('bathroom', 'Несколько санузлов', 4)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('window_view', 'Во двор', 1),
  ('window_view', 'На улицу', 2),
  ('window_view', 'На парк', 3),
  ('window_view', 'На реку', 4),
  ('window_view', 'На горы', 5)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('residential_condition', 'Евроремонт', 1),
  ('residential_condition', 'Дизайнерский', 2),
  ('residential_condition', 'Хороший ремонт', 3),
  ('residential_condition', 'Косметический ремонт', 4),
  ('residential_condition', 'Требуется ремонт', 5),
  ('residential_condition', 'Черновая отделка', 6),
  ('residential_condition', 'Под чистовую отделку', 7),
  ('residential_condition', 'Без отделки', 8),
  ('residential_condition', 'Новое', 9)
ON CONFLICT (category, value) DO NOTHING;

-- Районы (с группировкой по городу)
INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('district', 'Кировский', 'Иркутск', 1),
  ('district', 'Октябрьский', 'Иркутск', 2),
  ('district', 'Свердловский', 'Иркутск', 3),
  ('district', 'Ленинский', 'Иркутск', 4),
  ('district', 'Куйбышевский', 'Иркутск', 5),
  ('district', 'Ангарск', 'Ангарск', 10),
  ('district', 'Шелехов', 'Шелехов', 11),
  ('district', 'Усолье-Сибирское', 'Усолье-Сибирское', 12),
  ('district', 'Братск', 'Братск', 13),
  ('district', 'Усть-Илимск', 'Усть-Илимск', 14)
ON CONFLICT (category, value) DO NOTHING;

-- Состояние
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('condition', 'Евроремонт', 1),
  ('condition', 'Хороший ремонт', 2),
  ('condition', 'Косметический ремонт', 3),
  ('condition', 'Рабочее состояние', 4),
  ('condition', 'Под чистовую отделку', 5),
  ('condition', 'Shell & Core', 6),
  ('condition', 'Требуется ремонт', 7),
  ('condition', 'Без отделки', 8),
  ('condition', 'Новое', 9),
  ('condition', 'Без строений', 10)
ON CONFLICT (category, value) DO NOTHING;

-- Планировка
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('layout', 'Open-space', 1),
  ('layout', 'Open-space + кабинеты', 2),
  ('layout', 'Кабинетная', 3),
  ('layout', 'Свободная планировка', 4),
  ('layout', '2 кабинета + приёмная', 5),
  ('layout', 'Open-space + 2 кабинета', 6),
  ('layout', 'Open-space + 3 кабинета', 7),
  ('layout', 'Единое пространство', 8),
  ('layout', 'Единое пространство + офис', 9),
  ('layout', 'Студия', 10),
  ('layout', 'Прямоугольная', 11),
  ('layout', 'Г-образная', 12),
  ('layout', 'Кабинеты + open-space', 13),
  ('layout', 'Смешанная', 14)
ON CONFLICT (category, value) DO NOTHING;

-- Парковка
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('parking', 'Нет', 1),
  ('parking', 'Наземный, 1 м/м', 2),
  ('parking', 'Наземный, 2 м/м', 3),
  ('parking', 'Наземный, 3 м/м', 4),
  ('parking', 'Наземный, 5 м/м', 5),
  ('parking', 'Наземный, 10 м/м', 6),
  ('parking', 'Подземный', 7),
  ('parking', 'Подземный, 1 м/м', 8),
  ('parking', 'Подземный, 2 м/м', 9),
  ('parking', 'Открытая, 5 м/м', 10),
  ('parking', 'Открытая, 8 м/м', 11),
  ('parking', 'Открытая, 10 м/м', 12),
  ('parking', 'Открытая, 20 м/м', 13),
  ('parking', 'Гостевая', 14),
  ('parking', 'Бесплатная для арендаторов', 15)
ON CONFLICT (category, value) DO NOTHING;

-- Назначение
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('purpose', 'Офис', 1),
  ('purpose', 'Коворкинг', 2),
  ('purpose', 'Торговля', 3),
  ('purpose', 'Общепит', 4),
  ('purpose', 'Услуги', 5),
  ('purpose', 'Медицина', 6),
  ('purpose', 'Образование', 7),
  ('purpose', 'Склад', 8),
  ('purpose', 'Производство', 9),
  ('purpose', 'Автосервис', 10),
  ('purpose', 'Спорт', 11),
  ('purpose', 'Красота', 12),
  ('purpose', 'HoReCa', 13),
  ('purpose', 'Свободное назначение', 14)
ON CONFLICT (category, value) DO NOTHING;

-- Залог
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('deposit', 'Нет', 1),
  ('deposit', '1 месяц', 2),
  ('deposit', '2 месяца', 3),
  ('deposit', '3 месяца', 4),
  ('deposit', '6 месяцев', 5),
  ('deposit', '50%', 6),
  ('deposit', '100%', 7),
  ('deposit', 'По договорённости', 8)
ON CONFLICT (category, value) DO NOTHING;

-- Срок договора
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('contract_term', 'от 1 мес', 1),
  ('contract_term', 'от 3 мес', 2),
  ('contract_term', 'от 6 мес', 3),
  ('contract_term', 'от 11 мес', 4),
  ('contract_term', '1 год', 5),
  ('contract_term', '2 года', 6),
  ('contract_term', '3 года', 7),
  ('contract_term', '4 года', 8),
  ('contract_term', '5 лет', 9),
  ('contract_term', '7 лет', 10),
  ('contract_term', '10 лет', 11),
  ('contract_term', 'Бессрочный', 12)
ON CONFLICT (category, value) DO NOTHING;

-- Коммунальные
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('utilities', 'Включены', 1),
  ('utilities', 'Отдельно', 2),
  ('utilities', 'По счётчикам', 3),
  ('utilities', 'Частично включены', 4),
  ('utilities', 'Не включены', 5)
ON CONFLICT (category, value) DO NOTHING;

-- НДС
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('vat', 'Не облагается', 1),
  ('vat', '20%', 2),
  ('vat', 'Включён в ставку', 3),
  ('vat', 'УСН', 4),
  ('vat', 'Без НДС', 5)
ON CONFLICT (category, value) DO NOTHING;

-- Тип арендодателя
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('landlord_type', 'Собственник', 1),
  ('landlord_type', 'Физ. лицо', 2),
  ('landlord_type', 'ИП', 3),
  ('landlord_type', 'Юр. лицо', 4),
  ('landlord_type', 'Управляющая компания', 5),
  ('landlord_type', 'Застройщик', 6),
  ('landlord_type', 'Банк', 7),
  ('landlord_type', 'Государство', 8)
ON CONFLICT (category, value) DO NOTHING;

-- «Новостройка» больше не тип объекта
UPDATE dictionaries
SET is_active = false
WHERE category = 'property_type' AND value = 'Новостройка';
