-- Entregas de projeto (frente projetos-v2, lote 04): os links que a pessoa
-- envia ao terminar um projeto e o resultado das checagens automaticas.
--
-- Escrita EXCLUSIVA do service role (server): sem policy de insert, update ou
-- delete, espelhando project_validations. O SELECT own-row e defesa em
-- profundidade; a barreira real e o filtro por user_id nas queries do server.
--
-- Uma entrega por (user_id, project_id): reenviar substitui os links e zera a
-- verificacao. `status` so tem dois valores aqui; `validado` (avaliacao por IA)
-- continua em project_validations, e a UI combina os dois.
--
-- Migration puramente aditiva: isenta da janela de backup.

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  tipo_entrega text not null check (tipo_entrega in ('repo_deploy', 'repo', 'figma', 'notebook', 'documento', 'dashboard')),
  deploy_url text,
  repo_url text,
  artifact_url text,
  retro jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  public_code text not null,
  status text not null default 'entregue' check (status in ('entregue', 'verificado')),
  auto_check jsonb,
  auto_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_submissions_user_project_unique unique (user_id, project_id),
  constraint project_submissions_public_code_unique unique (public_code)
);

create index if not exists project_submissions_user_idx
  on public.project_submissions (user_id, updated_at desc);

create index if not exists project_submissions_public_idx
  on public.project_submissions (project_id, is_public)
  where is_public = true;

alter table public.project_submissions enable row level security;

create policy "project_submissions_select_own" on public.project_submissions
  for select using ((select auth.uid()) = user_id);
