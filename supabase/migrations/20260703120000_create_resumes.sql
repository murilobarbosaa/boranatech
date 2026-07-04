-- Curriculos criados pelo gerador com IA (/curriculo/gerar), um por linha,
-- dono unico. Persistencia da frente "criar do zero": o objeto CurriculoSchema
-- inteiro vive no jsonb e reabre identico no preview, sem regerar nada.
-- Aplicada MANUALMENTE no SQL Editor e versionada aqui; nunca via db push.
-- Entra no checklist de publicacao em ordem cronologica, com
-- supabase migration repair --status applied depois.
--
-- A RLS abaixo e DEFESA EM PROFUNDIDADE (leitura own-row). Nao ha policy de
-- insert/update/delete de proposito: a escrita acontece SO via service role no
-- backend, que bypassa a RLS e filtra por user_id explicitamente.

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  curriculo jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_idx
  on public.resumes (user_id, created_at desc);

alter table public.resumes enable row level security;

create policy "resumes_select_own" on public.resumes
  for select to authenticated using (auth.uid() = user_id);
