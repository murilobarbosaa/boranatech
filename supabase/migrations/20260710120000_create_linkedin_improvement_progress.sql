-- Progresso das melhorias aplicadas por ANALISE do Analisador de LinkedIn
-- (checklist marcavel do estado de resultado), espelho da tabela do GitHub
-- (20260709190000). Uma linha por melhoria marcada, unica por
-- usuario+analise+indice: o indice do array melhorias no result jsonb e
-- estavel (o result e persistido inteiro no insert e nunca reescrito).
-- Reanalise cria OUTRA analise: o checklist novo nasce zerado e o da analise
-- antiga preserva as marcas, comportamento esperado.
create table if not exists public.linkedin_improvement_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.linkedin_analyses(id) on delete cascade,
  improvement_index int not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, analysis_id, improvement_index)
);

alter table public.linkedin_improvement_progress enable row level security;

-- Leitura: so as proprias linhas, com (select auth.uid()) pro initplan avaliar
-- uma vez por query (padrao da 20260709150000). Escrita: nenhuma policy, so o
-- service role grava (o server valida a posse da analise antes).
--
-- IDEMPOTENTE: create table e alter ... enable rls ja toleram reexecucao, mas
-- create policy NAO tem "if not exists" no Postgres. Sem o drop antes, rodar
-- este arquivo duas vezes falha com "policy already exists". O drop e seguro:
-- o nome e exclusivo desta tabela (a irma do GitHub usa
-- github_improvement_progress_select_own) e policy name tem escopo por tabela.
drop policy if exists "linkedin_improvement_progress_select_own"
  on public.linkedin_improvement_progress;

create policy "linkedin_improvement_progress_select_own"
  on public.linkedin_improvement_progress
  for select
  using ((select auth.uid()) = user_id);
