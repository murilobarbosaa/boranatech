create table if not exists public.linkedin_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null,
  level text not null,
  score int not null,
  faixa text not null,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists linkedin_analyses_user_idx on public.linkedin_analyses (user_id, created_at desc);
alter table public.linkedin_analyses enable row level security;
create policy "linkedin_analyses_select_own" on public.linkedin_analyses for select using (auth.uid() = user_id);
