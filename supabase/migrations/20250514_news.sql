create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_url text,
  category text not null default 'Новости',
  tags text[] default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  author_name text default 'Анастасия Романова',
  views int default 0
);

alter table public.news_posts enable row level security;

create policy "public read published" on public.news_posts
  for select using (status = 'published');

create policy "admin full access" on public.news_posts
  for all using (auth.role() = 'authenticated');
