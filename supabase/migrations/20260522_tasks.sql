-- Таблица задач для сотрудников АрендаСити
-- Выполнить в Supabase SQL Editor: Dashboard → SQL Editor → New query

create type task_status as enum ('todo', 'in_progress', 'done');
create type task_priority as enum ('low', 'medium', 'high');

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  notes       text,
  assignee    text,
  status      task_status not null default 'todo',
  priority    task_priority not null default 'medium',
  due_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Автообновление updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- RLS
alter table tasks enable row level security;

-- Политика: только авторизованные пользователи
create policy "tasks_authenticated"
  on tasks for all
  using (auth.role() = 'authenticated');

-- Для разработки: разрешить anon (убрать в продакшне если не нужно)
create policy "tasks_anon_read"
  on tasks for select
  using (true);

create policy "tasks_anon_write"
  on tasks for all
  using (true);
