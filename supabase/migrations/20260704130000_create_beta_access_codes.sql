-- Portao de beta: codigos de acesso por pessoa e log de uso.
--
-- IMPORTANTE: os codigos de acesso sao SEGREDOS DE CONVITE. Eles sao inseridos
-- manualmente via SQL Editor (script one-off, nunca versionado no repo) e nunca
-- entram no controle de versao. Esta migration cria apenas o SCHEMA, sem seed.
--
-- Acesso e exclusivamente pelo service role (backend). RLS habilitado sem
-- nenhuma policy (deny-all) nas duas tabelas: anon e authenticated nao leem nem
-- escrevem. Por causa do baseline de seguranca SEG-05, o REVOKE ALL abaixo e
-- explicito, alem do deny-all implicito do RLS.
--
-- Nota de seguranca: o label "admin" (ou qualquer outro) e apenas um rotulo de
-- log. Codigo de convite JAMAIS concede papel de admin. Admin continua resolvido
-- server-side por requireAuth + RPC is_user_admin sobre JWT verificado.

create table public.beta_access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.beta_unlock_logs (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references public.beta_access_codes(id),
  label text,
  success boolean not null,
  attempted_code text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index beta_unlock_logs_created_at_idx
  on public.beta_unlock_logs (created_at desc);
create index beta_unlock_logs_code_id_idx
  on public.beta_unlock_logs (code_id);

alter table public.beta_access_codes enable row level security;
alter table public.beta_unlock_logs enable row level security;

revoke all on public.beta_access_codes from anon, authenticated;
revoke all on public.beta_unlock_logs from anon, authenticated;
