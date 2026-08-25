-- Жилые справочники: расширение до уровня Avito / ЦИАН
-- Выполнить в self-hosted каталоге после create_dictionaries.sql
-- Безопасно повторять: INSERT ... ON CONFLICT DO NOTHING

-- Новые типы жилья
INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('property_type', 'Апартаменты', 'residential', 15),
  ('property_type', 'Дача', 'residential', 16),
  ('property_type', 'Коттедж', 'residential', 17),
  ('property_type', 'Гараж', 'residential', 19),
  ('property_type', 'Машиноместо', 'residential', 20),
  ('property_type', 'Доля', 'residential', 21)
ON CONFLICT (category, value) DO NOTHING;

INSERT INTO public.dictionaries (category, value, parent, sort_order) VALUES
  ('property_type', 'Земля', 'land', 40),
  ('property_type', 'Участок', 'land', 41)
ON CONFLICT (category, value) DO NOTHING;

-- «Новостройка» — это рынок, не тип объекта
UPDATE dictionaries
SET is_active = false
WHERE category = 'property_type' AND value = 'Новостройка';

-- Рынок (вторичка / новостройка)
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('market', 'Вторичка', 1),
  ('market', 'Новостройка', 2)
ON CONFLICT (category, value) DO NOTHING;

-- Тип сделки: посуточно
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('deal_type', 'Посуточно', 3)
ON CONFLICT (category, value) DO NOTHING;

-- Комнаты
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('rooms', '5', 5),
  ('rooms', '6+', 6)
ON CONFLICT (category, value) DO NOTHING;

-- Тип дома
INSERT INTO dictionaries (category, value, sort_order) VALUES
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

-- Балкон
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('balcony', 'Нет', 1),
  ('balcony', 'Балкон', 2),
  ('balcony', 'Лоджия', 3),
  ('balcony', 'Балкон и лоджия', 4),
  ('balcony', '2 балкона', 5)
ON CONFLICT (category, value) DO NOTHING;

-- Мебель
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('furniture', 'С мебелью', 1),
  ('furniture', 'Без мебели', 2),
  ('furniture', 'Частично', 3)
ON CONFLICT (category, value) DO NOTHING;

-- Санузел
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('bathroom', 'Совмещённый', 1),
  ('bathroom', 'Раздельный', 2),
  ('bathroom', '2 санузла', 3),
  ('bathroom', 'Несколько санузлов', 4)
ON CONFLICT (category, value) DO NOTHING;

-- Вид из окон
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('window_view', 'Во двор', 1),
  ('window_view', 'На улицу', 2),
  ('window_view', 'На парк', 3),
  ('window_view', 'На реку', 4),
  ('window_view', 'На горы', 5)
ON CONFLICT (category, value) DO NOTHING;

-- Состояние жилья
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

-- Особенности жилья
INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('residential_feature', 'Балкон', 'comfort', 1),
  ('residential_feature', 'Лоджия', 'comfort', 2),
  ('residential_feature', 'Гардеробная', 'comfort', 3),
  ('residential_feature', 'Кондиционер', 'comfort', 4),
  ('residential_feature', 'Тёплый пол', 'comfort', 5),
  ('residential_feature', 'Кухня', 'comfort', 6),
  ('residential_feature', 'Мебель', 'comfort', 7),
  ('residential_feature', 'Техника', 'comfort', 8),
  ('residential_feature', 'Стиральная машина', 'appliances', 10),
  ('residential_feature', 'Холодильник', 'appliances', 11),
  ('residential_feature', 'Посудомоечная машина', 'appliances', 12),
  ('residential_feature', 'Телевизор', 'appliances', 13),
  ('residential_feature', 'Интернет', 'appliances', 14),
  ('residential_feature', 'Лифт', 'yard', 20),
  ('residential_feature', 'Грузовой лифт', 'yard', 21),
  ('residential_feature', 'Консьерж', 'yard', 22),
  ('residential_feature', 'Закрытый двор', 'yard', 23),
  ('residential_feature', 'Детская площадка', 'yard', 24),
  ('residential_feature', 'Парковка', 'yard', 25),
  ('residential_feature', 'Подземная парковка', 'yard', 26),
  ('residential_feature', 'Охрана', 'yard', 27),
  ('residential_feature', 'Рядом школа', 'location', 30),
  ('residential_feature', 'Рядом детский сад', 'location', 31),
  ('residential_feature', 'Рядом парк', 'location', 32),
  ('residential_feature', 'Рядом остановка', 'location', 33),
  ('residential_feature', 'Центр города', 'location', 34),
  ('residential_feature', 'Вид на реку', 'location', 35),
  ('residential_feature', 'Тихий двор', 'location', 36),
  ('residential_feature', 'Баня', 'house', 40),
  ('residential_feature', 'Гараж на участке', 'house', 41),
  ('residential_feature', 'Сад', 'house', 42),
  ('residential_feature', 'Огород', 'house', 43)
ON CONFLICT (category, value) DO NOTHING;
