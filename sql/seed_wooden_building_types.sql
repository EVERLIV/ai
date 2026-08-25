-- Деревянные типы дома (каркас, брус, бревно, СИП, CLT…)
-- Выполнить в self-hosted каталоге после create_dictionaries.sql
-- Безопасно повторять: INSERT ... ON CONFLICT DO NOTHING

INSERT INTO dictionaries (category, value, sort_order) VALUES
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
