-- Фикс: админ видит объекты на модерации + клиент может подавать заявки
-- Запускайте если очередь модерации пуста, а объекты у пользователей есть.

DROP POLICY IF EXISTS "Authenticated can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own submitted properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and managers can view all properties" ON public.properties;

CREATE POLICY "Anyone can view active properties"
  ON public.properties FOR SELECT
  USING (is_active = true AND moderation_status = 'published');

CREATE POLICY "Users can view own submitted properties"
  ON public.properties FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "Admins and managers can view all properties"
  ON public.properties FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

-- Проверка: сколько объектов на модерации
SELECT id, address, moderation_status, submitted_by, created_at
FROM public.properties
WHERE moderation_status = 'on_moderation'
ORDER BY created_at DESC;
