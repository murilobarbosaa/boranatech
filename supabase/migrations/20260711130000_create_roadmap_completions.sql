-- Conclusoes de roadmap validadas pelo server (trilhas estaticas v2).
--
-- Escrita EXCLUSIVA do service role (server), que bypassa a RLS: de proposito
-- NAO ha policy de insert/update/delete, espelhando career_plans e
-- interview_sessions. A policy de SELECT own-row e defesa em profundidade; a
-- barreira real e o filtro explicito por user_id nas queries do server.
--
-- O registro so nasce depois do endpoint validar que TODAS as required leaves
-- do roadmap estao em user_progress (context course_progress). required_count
-- congela quantas leaves obrigatorias a trilha tinha no momento da conclusao,
-- pra detectar depois "trilha ganhou conteudo novo desde que voce concluiu".

create table if not exists public.roadmap_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_slug text not null,
  completed_at timestamptz not null default now(),
  required_count integer not null,
  unique (user_id, roadmap_slug)
);

create index if not exists roadmap_completions_user_idx
  on public.roadmap_completions (user_id, completed_at desc);

alter table public.roadmap_completions enable row level security;

create policy "roadmap_completions_select_own" on public.roadmap_completions
  for select using ((select auth.uid()) = user_id);
