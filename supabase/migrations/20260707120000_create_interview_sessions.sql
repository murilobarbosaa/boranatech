-- Sessoes de entrevista simulada (feature Pro de entrevistas).
--
-- Escrita EXCLUSIVA do service role (server), que bypassa a RLS: de proposito
-- NAO ha policy de insert/update/delete, espelhando o padrao de
-- agent_conversations/agent_messages (migration 20260628130000). As policies de
-- SELECT own-row existem como defesa em profundidade para leitura via anon key;
-- a barreira real e o filtro explicito por user_id nas queries do server.

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('job', 'general')),
  area text,
  level text,
  -- null para kind general; para job: {source: 'url'|'text', url?, extractedText}
  job_context jsonb,
  status text not null default 'active' check (status in ('active', 'completed')),
  question_count int not null default 0,
  good_count int not null default 0,
  good_streak int not null default 0,
  verdict jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  role text not null check (role in ('assistant', 'user')),
  content text not null,
  -- preenchido so em turnos assistant que avaliam uma resposta; null nos demais
  evaluation jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_user_idx
  on public.interview_sessions (user_id, updated_at desc);

create index if not exists interview_turns_session_idx
  on public.interview_turns (session_id, created_at);

alter table public.interview_sessions enable row level security;
alter table public.interview_turns enable row level security;

create policy "interview_sessions_select_own" on public.interview_sessions
  for select using (auth.uid() = user_id);

create policy "interview_turns_select_own" on public.interview_turns
  for select using (
    exists (
      select 1
      from public.interview_sessions s
      where s.id = interview_turns.session_id
        and s.user_id = auth.uid()
    )
  );
