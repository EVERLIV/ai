-- =============================================================================
-- Словарь: коммерческий тип «Киоск»
--
-- В базе есть активные объекты с type = 'Киоск', но записи в словаре не было,
-- поэтому тип не попадал в фильтры каталога и в плитку подкатегории.
-- Коммерческие типы хранятся с parent = NULL (см. Офис/Склад/Павильон).
-- =============================================================================

INSERT INTO public.dictionaries (category, value, parent, sort_order, is_active)
SELECT 'property_type', 'Киоск', NULL, 22, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.dictionaries
  WHERE category = 'property_type' AND value = 'Киоск'
);

-- Если запись уже есть, но выключена — включаем
UPDATE public.dictionaries
SET is_active = true, updated_at = now()
WHERE category = 'property_type'
  AND value = 'Киоск'
  AND is_active = false;
