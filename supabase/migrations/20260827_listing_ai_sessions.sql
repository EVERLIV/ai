-- Smart listing AI chat sessions (memory + partial draft)
create table if not exists public.listing_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  segment text not null default 'commercial'
    check (segment in ('commercial', 'residential', 'land')),
  phase text not null default 'intake',
  messages jsonb not null default '[]'::jsonb,
  draft jsonb not null default '{}'::jsonb,
  property_id uuid null,
  corrections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_ai_sessions_user_id_idx
  on public.listing_ai_sessions(user_id);
create index if not exists listing_ai_sessions_updated_at_idx
  on public.listing_ai_sessions(updated_at desc);

alter table public.listing_ai_sessions enable row level security;

drop policy if exists listing_ai_sessions_select_own on public.listing_ai_sessions;
create policy listing_ai_sessions_select_own on public.listing_ai_sessions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists listing_ai_sessions_insert_own on public.listing_ai_sessions;
create policy listing_ai_sessions_insert_own on public.listing_ai_sessions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists listing_ai_sessions_update_own on public.listing_ai_sessions;
create policy listing_ai_sessions_update_own on public.listing_ai_sessions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists listing_ai_sessions_delete_own on public.listing_ai_sessions;
create policy listing_ai_sessions_delete_own on public.listing_ai_sessions
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.listing_ai_sessions to authenticated;
grant all on public.listing_ai_sessions to service_role;
