-- Support tickets: user LK + admin replies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'answered', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('user', 'staff')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id
  ON public.support_tickets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON public.support_tickets(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id
  ON public.support_ticket_messages(ticket_id, created_at ASC);

-- Ticket number: DT-XXXXXX (6 chars A-Z0-9)
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code TEXT;
  v_i INT;
  v_attempt INT := 0;
BEGIN
  LOOP
    v_code := 'DT-';
    FOR v_i IN 1..6 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.support_tickets WHERE ticket_number = v_code) THEN
      RETURN v_code;
    END IF;
    v_attempt := v_attempt + 1;
    IF v_attempt > 50 THEN
      RAISE EXCEPTION 'Не удалось сгенерировать номер тикета';
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_support_tickets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_support_tickets_updated_at();

-- User creates ticket + first message
CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_category TEXT,
  p_message TEXT
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_uid UUID;
  v_account_type TEXT;
  v_category TEXT;
  v_message TEXT;
  v_ticket public.support_tickets;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Войдите в личный кабинет';
  END IF;

  v_category := trim(COALESCE(p_category, ''));
  IF length(v_category) < 2 THEN
    RAISE EXCEPTION 'Выберите тип обращения';
  END IF;

  v_message := trim(COALESCE(p_message, ''));
  IF length(v_message) < 5 THEN
    RAISE EXCEPTION 'Опишите проблему подробнее (минимум 5 символов)';
  END IF;
  IF length(v_message) > 4000 THEN
    RAISE EXCEPTION 'Сообщение слишком длинное (макс. 4000 символов)';
  END IF;

  SELECT account_type::text INTO v_account_type
  FROM public.profiles
  WHERE id = v_uid;

  INSERT INTO public.support_tickets (
    ticket_number,
    user_id,
    account_type,
    category,
    status
  )
  VALUES (
    public.generate_ticket_number(),
    v_uid,
    v_account_type,
    v_category,
    'open'
  )
  RETURNING * INTO v_ticket;

  INSERT INTO public.support_ticket_messages (
    ticket_id,
    author_type,
    author_id,
    body
  )
  VALUES (
    v_ticket.id,
    'user',
    v_uid,
    v_message
  );

  RETURN v_ticket;
END;
$$;

-- Staff reply (admin/manager via authenticated JWT)
CREATE OR REPLACE FUNCTION public.reply_support_ticket(
  p_ticket_id UUID,
  p_body TEXT
)
RETURNS public.support_ticket_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_uid UUID;
  v_text TEXT;
  v_ticket public.support_tickets;
  v_msg public.support_ticket_messages;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Войдите в систему';
  END IF;

  IF NOT public.has_role(v_uid, 'admin')
     AND NOT public.has_role(v_uid, 'manager') THEN
    RAISE EXCEPTION 'Нет доступа';
  END IF;

  v_text := trim(COALESCE(p_body, ''));
  IF length(v_text) < 2 THEN
    RAISE EXCEPTION 'Напишите ответ подробнее';
  END IF;
  IF length(v_text) > 4000 THEN
    RAISE EXCEPTION 'Ответ слишком длинный (макс. 4000 символов)';
  END IF;

  SELECT * INTO v_ticket
  FROM public.support_tickets
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Тикет не найден';
  END IF;

  INSERT INTO public.support_ticket_messages (
    ticket_id,
    author_type,
    author_id,
    body
  )
  VALUES (
    p_ticket_id,
    'staff',
    v_uid,
    v_text
  )
  RETURNING * INTO v_msg;

  UPDATE public.support_tickets
  SET status = 'answered'
  WHERE id = p_ticket_id;

  RETURN v_msg;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_support_ticket_status(
  p_ticket_id UUID,
  p_status TEXT
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_uid UUID;
  v_row public.support_tickets;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Войдите в систему';
  END IF;

  IF NOT public.has_role(v_uid, 'admin')
     AND NOT public.has_role(v_uid, 'manager') THEN
    RAISE EXCEPTION 'Нет доступа';
  END IF;

  IF p_status NOT IN ('open', 'in_progress', 'answered', 'closed') THEN
    RAISE EXCEPTION 'Недопустимый статус';
  END IF;

  UPDATE public.support_tickets
  SET status = p_status
  WHERE id = p_ticket_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Тикет не найден';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_support_ticket(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reply_support_ticket(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_support_ticket_status(UUID, TEXT) TO authenticated;

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own tickets" ON public.support_tickets;
CREATE POLICY "Users read own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Staff update tickets" ON public.support_tickets;
CREATE POLICY "Staff update tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

DROP POLICY IF EXISTS "Users read ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Users read ticket messages"
  ON public.support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (
          t.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

DROP POLICY IF EXISTS "Staff insert messages" ON public.support_ticket_messages;
CREATE POLICY "Staff insert messages"
  ON public.support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    author_type = 'staff'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
    )
  );

GRANT SELECT ON public.support_tickets TO authenticated;
GRANT SELECT ON public.support_ticket_messages TO authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;
GRANT INSERT ON public.support_ticket_messages TO authenticated;
