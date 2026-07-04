-- Analises de curriculo pronto (Analisador de Curriculo Pro), espelhando
-- linkedin_analyses: colunas de resumo para lista/pool + input/result jsonb.
-- score/faixa vem do calculo DETERMINISTICO do servidor (a IA so comenta).
-- Aplicada MANUALMENTE no SQL Editor e versionada aqui; nunca via db push.
-- Entra no checklist de publicacao em ordem cronologica, com
-- supabase migration repair --status applied depois.
--
-- A RLS abaixo e DEFESA EM PROFUNDIDADE (leitura own-row). Nao ha policy de
-- insert/update/delete de proposito: a escrita acontece SO via service role no
-- backend, que bypassa a RLS e filtra por user_id explicitamente.

create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null,
  faixa text not null,
  target_role text,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists resume_analyses_user_idx
  on public.resume_analyses (user_id, created_at desc);

alter table public.resume_analyses enable row level security;

create policy "resume_analyses_select_own" on public.resume_analyses
  for select to authenticated using (auth.uid() = user_id);
