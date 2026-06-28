-- Historico de conversas do agente de IA.
-- Aplicado MANUALMENTE no SQL Editor e versionado depois; nunca via db push.
--
-- Modelo: agent_conversations (uma por conversa) + agent_messages (uma por
-- mensagem). Acesso de leitura/listagem e beneficio Pro (gated no endpoint);
-- apagar e livre ao dono (obrigacao de exclusao). Retencao enquanto a conta
-- existir; sem job de expiracao nesta fase.
--
-- Cascata dupla: deletar a conta (auth.users) apaga agent_conversations, que por
-- sua vez apaga agent_messages. title e category ficam nulos no primeiro marco
-- (a geracao de titulo e a classificacao por categoria/icone vem depois).
--
-- A RLS abaixo e DEFESA EM PROFUNDIDADE. A barreira real e o filtro explicito por
-- user_id nos endpoints: o backend usa service role, que bypassa a RLS.

create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists agent_conversations_user_idx
  on public.agent_conversations (user_id, updated_at desc);
create index if not exists agent_messages_conversation_idx
  on public.agent_messages (conversation_id, created_at);

alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;

-- agent_conversations: own-row por user_id, uma policy por operacao.
create policy "agent_conversations_select_own" on public.agent_conversations
  for select using (auth.uid() = user_id);
create policy "agent_conversations_insert_own" on public.agent_conversations
  for insert with check (auth.uid() = user_id);
create policy "agent_conversations_update_own" on public.agent_conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agent_conversations_delete_own" on public.agent_conversations
  for delete using (auth.uid() = user_id);

-- agent_messages: nao tem user_id direto; amarra na conversa dona via exists.
-- SELECT e DELETE checam no using; INSERT checa no with check (a linha nova
-- precisa pertencer a uma conversa do proprio usuario).
create policy "agent_messages_select_own" on public.agent_messages
  for select using (
    exists (
      select 1 from public.agent_conversations c
      where c.id = agent_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
create policy "agent_messages_insert_own" on public.agent_messages
  for insert with check (
    exists (
      select 1 from public.agent_conversations c
      where c.id = agent_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
create policy "agent_messages_delete_own" on public.agent_messages
  for delete using (
    exists (
      select 1 from public.agent_conversations c
      where c.id = agent_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
