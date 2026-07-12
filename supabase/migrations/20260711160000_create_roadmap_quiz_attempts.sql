-- Tentativas do quiz final de roadmap (fase 4.2).
--
-- Escrita EXCLUSIVA do service role (server), que bypassa a RLS: de proposito
-- NAO ha policy de insert/update/delete, espelhando project_validations e
-- roadmap_completions. A policy de SELECT own-row e defesa em profundidade; a
-- barreira real e o filtro explicito por user_id nas queries do server.
--
-- questions e o SNAPSHOT do sorteio: array ordenado de
--   { id, alternativas: ["c","a","d","b"] }
-- (id da pergunta no pool e a ordem de exibicao embaralhada das alternativas).
-- O snapshot NUNCA contem gabarito (correta/explicacao); esses campos vivem so
-- no pool server-only de server/data/roadmapQuizzes e a correcao e feita no
-- server contra o pool atual do disco.
--
-- answers guarda as respostas enviadas ({ questionId: "a".."d" }); fica null
-- enquanto a tentativa esta ativa e sem resposta parcial salva.
--
-- Unique PARCIAL duplo: no maximo UMA tentativa ativa por (user, trilha) e no
-- maximo UMA aprovada (aprovacao e unica e duravel); reprovacoes ficam
-- ilimitadas como historico.

create table if not exists public.roadmap_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_slug text not null,
  status text not null check (status in ('ativa', 'aprovada', 'reprovada')),
  questions jsonb not null,
  answers jsonb,
  score integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists roadmap_quiz_attempts_user_idx
  on public.roadmap_quiz_attempts (user_id, roadmap_slug, created_at desc);

create unique index if not exists roadmap_quiz_attempts_one_active
  on public.roadmap_quiz_attempts (user_id, roadmap_slug)
  where status = 'ativa';

create unique index if not exists roadmap_quiz_attempts_one_approval
  on public.roadmap_quiz_attempts (user_id, roadmap_slug)
  where status = 'aprovada';

alter table public.roadmap_quiz_attempts enable row level security;

create policy "roadmap_quiz_attempts_select_own" on public.roadmap_quiz_attempts
  for select using ((select auth.uid()) = user_id);
