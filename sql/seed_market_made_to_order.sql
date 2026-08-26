-- Рынок «На заказ» — дома индивидуальной сборки (ещё нет готового объекта)
INSERT INTO dictionaries (category, value, sort_order) VALUES
  ('market', 'На заказ', 3)
ON CONFLICT (category, value) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    is_active = true;

-- Тип объекта «Дом на заказ»
INSERT INTO dictionaries (category, value, parent, sort_order) VALUES
  ('property_type', 'Дом на заказ', 'residential', 18)
ON CONFLICT (category, value) DO UPDATE
SET parent = EXCLUDED.parent,
    sort_order = EXCLUDED.sort_order,
    is_active = true;
