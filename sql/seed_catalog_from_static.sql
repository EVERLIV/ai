-- Базовый сид локаций (полный импорт — кнопка «Импорт из справочника» в админке)
-- Безопасно повторять

INSERT INTO dictionaries (category, value, label, parent, sort_order, metadata) VALUES
  ('district', 'Иркутская область', 'Иркутская область', NULL, 1, '{"kind":"region"}'),
  ('district', 'Иркутск', 'Иркутск', 'Иркутская область', 2, '{"kind":"city","lat":52.2869,"lng":104.305}'),
  ('district', 'Ангарск', 'Ангарск', 'Иркутская область', 3, '{"kind":"city","lat":52.5444,"lng":103.8882}'),
  ('district', 'Кировский', 'Кировский', 'Иркутск', 100, '{"kind":"district"}'),
  ('district', 'Октябрьский', 'Октябрьский', 'Иркутск', 101, '{"kind":"district"}'),
  ('district', 'Свердловский', 'Свердловский', 'Иркутск', 102, '{"kind":"district"}'),
  ('district', 'Ленинский', 'Ленинский', 'Иркутск', 103, '{"kind":"district"}'),
  ('district', 'Куйбышевский', 'Куйбышевский', 'Иркутск', 104, '{"kind":"district"}'),
  ('district', 'Китой', 'Китой', 'Ангарск', 200, '{"kind":"settlement"}')
ON CONFLICT (category, value) DO UPDATE SET
  parent = EXCLUDED.parent,
  label = COALESCE(EXCLUDED.label, dictionaries.label),
  sort_order = EXCLUDED.sort_order,
  metadata = dictionaries.metadata || EXCLUDED.metadata,
  is_active = true;
