-- Planos de carreira gerados por IA (feature Pro).
--
-- Escrita EXCLUSIVA do service role (server), que bypassa a RLS: de proposito
-- NAO ha policy de insert/update/delete, espelhando interview_sessions e
-- agent_conversations. A policy de SELECT own-row e defesa em profundidade; a
-- barreira real e o filtro explicito por user_id nas queries do server.
--
-- result guarda o plano estruturado (incluindo o checklist derivado pelo
-- server) e catalog_version registra a versao do catalogo curado usada na
-- geracao (o preco exibido depois vem sempre do catalogo, nunca do texto).

create table if not exists public.career_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  intake jsonb not null,
  result jsonb not null,
  catalog_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_plans_user_idx
  on public.career_plans (user_id, updated_at desc);

alter table public.career_plans enable row level security;

create policy "career_plans_select_own" on public.career_plans
  for select using (auth.uid() = user_id);
