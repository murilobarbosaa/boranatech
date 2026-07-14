-- Listas de contatos importadas de fora da plataforma (colar/CSV/XLSX/PDF).
-- IMPORTAR e ENVIAR sao acoes SEPARADAS: estas tabelas so guardam a lista e o
-- retrato da validacao no momento do import. A tabela de supressao existente
-- (email_suppressions) continua sendo a autoridade final: no ENVIO, a supressao
-- e reconsultada; o snapshot 'suppressed' aqui NUNCA vale como autorizacao.

create table if not exists public.contact_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  source text not null check (source in ('paste', 'csv', 'xlsx', 'pdf')),
  original_filename text,
  lgpd_basis text not null,   -- base legal declarada pelo admin no import
  lgpd_note text,             -- de onde veio a lista / como o consentimento foi obtido
  total_rows int not null,
  valid_count int not null,
  invalid_count int not null,
  duplicate_count int not null,
  suppressed_count int not null,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.contact_lists(id) on delete cascade not null,
  email text not null,
  name text,
  -- retrato do import; no envio a supressao e reconsultada
  status text not null check (
    status in ('valid', 'invalid', 'duplicate', 'suppressed')
  ),
  invalid_reason text,
  -- preenchido quando o email JA e usuario da plataforma (evita duplicar envio)
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (list_id, email)
);

create index if not exists contact_list_members_list_id_idx
  on public.contact_list_members (list_id);
create index if not exists contact_list_members_email_idx
  on public.contact_list_members (email);
create index if not exists contact_list_members_status_idx
  on public.contact_list_members (status);

-- RLS: sem NENHUMA policy, nega tudo por padrao. So o service role (supabaseAdmin,
-- que bypassa RLS) le e escreve. Nenhum acesso via anon/authenticated.
alter table public.contact_lists enable row level security;
alter table public.contact_list_members enable row level security;
