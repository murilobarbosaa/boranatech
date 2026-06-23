-- Perfil expandido: campos novos no profile (todos nullable) e tabela de skills declaradas.

alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists uf text;
alter table public.profiles add column if not exists career_goal text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists website_url text;

create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('tecnologia', 'area')),
  slug text not null,
  label text not null,
  level text not null check (level in ('aprendendo', 'uso', 'domino')),
  created_at timestamptz not null default now(),
  unique (user_id, kind, slug)
);
create index if not exists profile_skills_user_idx on public.profile_skills (user_id);
alter table public.profile_skills enable row level security;
create policy "profile_skills_select_own" on public.profile_skills for select using (auth.uid() = user_id);
