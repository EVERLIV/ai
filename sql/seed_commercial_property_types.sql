-- Доп. коммерческие типы объектов (павильон, ПСН и т.д.)
INSERT INTO public.dictionaries (category, value, parent, sort_order, is_active)
VALUES
  ('property_type', 'Офис', 'commercial', 1, true),
  ('property_type', 'Торговая', 'commercial', 2, true),
  ('property_type', 'Склад', 'commercial', 3, true),
  ('property_type', 'Производство', 'commercial', 5, true),
  ('property_type', 'Павильон', 'commercial', 6, true),
  ('property_type', 'ПСН', 'commercial', 7, true),
  ('property_type', 'Общепит', 'commercial', 8, true),
  ('property_type', 'Автосервис', 'commercial', 9, true)
ON CONFLICT (category, value) DO UPDATE
SET parent = COALESCE(NULLIF(dictionaries.parent, ''), 'commercial'),
    is_active = true,
    sort_order = EXCLUDED.sort_order
WHERE dictionaries.category = 'property_type'
  AND dictionaries.value IN (
    'Офис', 'Торговая', 'Склад', 'Производство',
    'Павильон', 'ПСН', 'Общепит', 'Автосервис'
  );

-- Не трогаем землю — у неё parent=land
UPDATE public.dictionaries
SET parent = 'commercial'
WHERE category = 'property_type'
  AND value IN (
    'Офис', 'Торговая', 'Склад', 'Производство',
    'Павильон', 'ПСН', 'Общепит', 'Автосервис'
  )
  AND (parent IS NULL OR parent = '' OR parent = 'commercial');
