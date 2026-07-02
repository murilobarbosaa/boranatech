-- Persistencia da analise de GitHub, espelhando linkedin_analyses.
-- Aplicada MANUALMENTE no SQL Editor e versionada aqui; nunca via db push.
--
-- level fica nullable: a analise de GitHub nao produz nivel (so nota e faixa);
-- a coluna existe para manter o shape de resumo compartilhado com o LinkedIn.
--
-- A RLS abaixo e DEFESA EM PROFUNDIDADE (leitura own-row). Nao ha policy de
-- insert/update/delete de proposito: a escrita acontece SO via service role no
-- backend, que bypassa a RLS e filtra por user_id explicitamente.

create table if not exists public.github_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text,
  level text,
  score int,
  faixa text,
  input jsonb,
  result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists github_analyses_user_idx
  on public.github_analyses (user_id, created_at desc);

alter table public.github_analyses enable row level security;

create policy "github_analyses_select_own" on public.github_analyses
  for select to authenticated using (auth.uid() = user_id);
