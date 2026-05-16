-- Tabela de badges desbloqueadas por usuário.
-- Catálogo de badges (id, nome, critérios) vive em código (shared/badges.ts).
-- Aqui só guardamos qual badge_id cada usuário já desbloqueou + quando.

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  constraint unique_user_badge unique (user_id, badge_id)
);

create index if not exists idx_user_badges_user_id
  on public.user_badges(user_id);

create index if not exists idx_user_badges_badge_id
  on public.user_badges(badge_id);

alter table public.user_badges enable row level security;

-- Usuário lê apenas as próprias badges. Insert/update/delete só via service_role (backend).
create policy "users_can_read_own_badges"
  on public.user_badges
  for select
  using (auth.uid() = user_id);

grant select on public.user_badges to authenticated;
grant all on public.user_badges to service_role;
