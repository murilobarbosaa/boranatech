-- Prova auditavel de consentimento LGPD (Termos de Uso e Politica de
-- Privacidade). Escrita somente pelo servidor via service role; o client nunca
-- grava. Identidade e versoes vem do backend, nunca de metadata do client.

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null check (document in ('terms', 'privacy')),
  version text not null,
  accepted_at timestamptz not null default now(),
  ip inet,
  user_agent text
);

-- Uma linha por (usuario, documento, versao): reenvio do mesmo aceite nao
-- duplica prova, e o upsert do servidor casa neste alvo.
create unique index if not exists user_consents_user_document_version_key
  on public.user_consents (user_id, document, version);

create index if not exists user_consents_user_id_idx
  on public.user_consents (user_id);

alter table public.user_consents enable row level security;

-- Leitura: usuario ve apenas as proprias linhas. (select auth.uid()) segue o
-- padrao de initplan ja usado nas outras policies do projeto.
drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own"
  on public.user_consents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Sem policy de insert/update/delete de proposito: nenhum papel autenticado ou
-- anonimo pode gravar. O service role usado pelo servidor ignora RLS, entao so
-- o backend registra consentimento.
