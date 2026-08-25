-- Иерархия локаций Иркутской области в dictionaries (category = district)
-- parent = город/узел-родитель; Китой → Ангарск (не отдельный город области)
-- Безопасно повторять: ON CONFLICT обновляет parent/sort_order

-- Города и узлы верхнего уровня
INSERT INTO dictionaries (category, value, label, parent, sort_order) VALUES
  ('district', 'Иркутск', 'Иркутск', NULL, 1),
  ('district', 'Ангарск', 'Ангарск', NULL, 2),
  ('district', 'Братск', 'Братск', NULL, 3),
  ('district', 'Усть-Илимск', 'Усть-Илимск', NULL, 4),
  ('district', 'Усолье-Сибирское', 'Усолье-Сибирское', NULL, 5),
  ('district', 'Черемхово', 'Черемхово', NULL, 6),
  ('district', 'Шелехов', 'Шелехов', NULL, 7),
  ('district', 'Тулун', 'Тулун', NULL, 8),
  ('district', 'Саянск', 'Саянск', NULL, 9),
  ('district', 'Нижнеудинск', 'Нижнеудинск', NULL, 10),
  ('district', 'Тайшет', 'Тайшет', NULL, 11),
  ('district', 'Зима', 'Зима', NULL, 12),
  ('district', 'Слюдянка', 'Слюдянка', NULL, 13),
  ('district', 'Байкальск', 'Байкальск', NULL, 14),
  ('district', 'Листвянка', 'Листвянка', NULL, 15),
  ('district', 'Маркова', 'Маркова', NULL, 16),
  ('district', 'Хомутово', 'Хомутово', NULL, 17),
  ('district', 'Мегет', 'Мегет', NULL, 18)
ON CONFLICT (category, value) DO UPDATE SET
  parent = EXCLUDED.parent,
  label = COALESCE(EXCLUDED.label, dictionaries.label),
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Районы г. Иркутска
INSERT INTO dictionaries (category, value, label, parent, sort_order) VALUES
  ('district', 'Кировский', 'Кировский', 'Иркутск', 100),
  ('district', 'Октябрьский', 'Октябрьский', 'Иркутск', 101),
  ('district', 'Свердловский', 'Свердловский', 'Иркутск', 102),
  ('district', 'Ленинский', 'Ленинский', 'Иркутск', 103),
  ('district', 'Куйбышевский', 'Куйбышевский', 'Иркутск', 104)
ON CONFLICT (category, value) DO UPDATE SET
  parent = EXCLUDED.parent,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Микрорайоны Иркутска (основные)
INSERT INTO dictionaries (category, value, label, parent, sort_order) VALUES
  ('district', 'Центр', 'Центр', 'Иркутск', 110),
  ('district', 'Солнечный', 'Солнечный', 'Иркутск', 111),
  ('district', 'Университетский', 'Университетский', 'Иркутск', 112),
  ('district', 'Ново-Ленино', 'Ново-Ленино', 'Иркутск', 113),
  ('district', 'Академгородок', 'Академгородок', 'Иркутск', 114),
  ('district', 'Студгородок', 'Студгородок', 'Иркутск', 115),
  ('district', 'Глазково', 'Глазково', 'Иркутск', 116),
  ('district', 'Лисиха', 'Лисиха', 'Иркутск', 117),
  ('district', 'Жилкино', 'Жилкино', 'Иркутск', 118),
  ('district', '130-й квартал', '130-й квартал', 'Иркутск', 119)
ON CONFLICT (category, value) DO UPDATE SET
  parent = EXCLUDED.parent,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Ангарск: Китой и др. (НЕ sibling города области)
INSERT INTO dictionaries (category, value, label, parent, sort_order) VALUES
  ('district', 'Китой', 'Китой', 'Ангарск', 200),
  ('district', 'Майск', 'Майск', 'Ангарск', 201),
  ('district', 'Юго-Западный', 'Юго-Западный', 'Ангарск', 202),
  ('district', 'Новый', 'Новый', 'Ангарск', 203),
  ('district', 'Старая Ангара', 'Старая Ангара', 'Ангарск', 204)
ON CONFLICT (category, value) DO UPDATE SET
  parent = EXCLUDED.parent,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Если «Центр» уже был под Иркутском, для Ангарска используем отдельную метку через value уникален —
-- Центр Ангарска храним как «Центр (Ангарск)» только если конфликт; иначе пропускаем дубль.
-- Уже вставленный «Центр» остаётся под Иркутском — это ок для справочника.
