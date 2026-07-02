-- Roadmaps gerados por IA (Roadmap Pro), um por geracao, dono unico.
-- Aplicada MANUALMENTE no SQL Editor e versionada aqui; nunca via db push.
-- Entra no checklist de publicacao em ordem cronologica, com
-- supabase migration repair --status applied depois.
--
-- Modelo: a coluna roadmap guarda o objeto RoadmapV2 completo (mesmo shape de
-- shared/roadmapV2/types.ts) e e preenchida INCREMENTALMENTE pela geracao
-- (esqueleto primeiro, children de cada secao depois). status acompanha o
-- ciclo: generating (em curso), partial (falhou no meio, retomavel), ready
-- (completo), failed (nem o esqueleto persistiu). inputs guarda o intake do
-- usuario que parametrizou a geracao.
--
-- O slug e gerado SEMPRE no servidor (ia-<8 chars [a-z0-9]>) e e unico global
-- (vira caminho de pagina e prefixo de item_key em user_progress). O unique
-- composto (user_id, slug) e redundante com unique (slug) e existe como
-- indice de acesso do dono + defesa em profundidade.
--
-- A RLS abaixo e DEFESA EM PROFUNDIDADE (leitura own-row). Nao ha policy de
-- insert/update/delete de proposito: a escrita acontece SO via service role no
-- backend, que bypassa a RLS e filtra por user_id explicitamente.

create table if not exists public.ai_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  status text not null default 'generating'
    check (status in ('generating', 'partial', 'ready', 'failed')),
  inputs jsonb not null default '{}'::jsonb,
  roadmap jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  unique (user_id, slug)
);

create index if not exists ai_roadmaps_user_idx
  on public.ai_roadmaps (user_id, created_at desc);

alter table public.ai_roadmaps enable row level security;

create policy "ai_roadmaps_select_own" on public.ai_roadmaps
  for select to authenticated using (auth.uid() = user_id);
