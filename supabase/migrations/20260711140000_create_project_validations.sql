-- Validacoes de projeto Pro pelo leitor de GitHub (fase 5c).
--
-- Escrita EXCLUSIVA do service role (server), que bypassa a RLS: de proposito
-- NAO ha policy de insert/update/delete, espelhando career_plans e
-- roadmap_completions. A policy de SELECT own-row e defesa em profundidade; a
-- barreira real e o filtro explicito por user_id nas queries do server.
--
-- Camada VALIDADA, separada da autodeclarada (project_progress em
-- user_progress): o registro so nasce depois de o pipeline de analise avaliar
-- os requisitos do projeto e o computeValidationOutcome decidir. Uma unica
-- aprovacao por (user_id, project_id) via unique PARCIAL; reprovacoes ficam
-- ilimitadas como historico de tentativas. requisitos_result guarda a
-- avaliacao requisito a requisito devolvida pela analise.

create table if not exists public.project_validations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  analysis_id uuid not null references public.github_analyses(id) on delete cascade,
  status text not null check (status in ('aprovado', 'reprovado')),
  requisitos_result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists project_validations_user_idx
  on public.project_validations (user_id, project_id, created_at desc);

create unique index if not exists project_validations_one_approval
  on public.project_validations (user_id, project_id)
  where status = 'aprovado';

alter table public.project_validations enable row level security;

create policy "project_validations_select_own" on public.project_validations
  for select using ((select auth.uid()) = user_id);
