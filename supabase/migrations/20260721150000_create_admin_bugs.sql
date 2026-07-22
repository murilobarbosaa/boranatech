-- Bug tracker manual do admin (aba Bugs & Erros). Uma linha por bug; o bug
-- pode nascer "do zero" ou a partir de um erro do Sentry (sentry_issue_id e
-- sentry_issue_url preenchidos na criacao, apenas referencia, sem sync). O
-- fluxo de status e open -> in_progress -> done; resolved_at e imposto pelo
-- server quando o status vira done (e limpo se o bug reabrir).

create table if not exists public.admin_bugs (
  id uuid primary key default gen_random_uuid(),
  -- Limites defensivos: title cabe no card da coluna, description e texto
  -- livre de contexto (nao e log). Valores folgados pro conteudo real.
  title text not null check (char_length(title) between 1 and 200),
  description text check (
    description is null or char_length(description) between 1 and 5000
  ),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done')),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  -- Referencia ao erro no Sentry quando o bug foi criado a partir de uma
  -- issue (id curto da API e permalink). Nulos em bug manual puro.
  sentry_issue_id text check (
    sentry_issue_id is null or char_length(sentry_issue_id) between 1 and 100
  ),
  sentry_issue_url text check (
    sentry_issue_url is null or char_length(sentry_issue_url) between 1 and 2048
  ),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Preenchido pelo server quando status vira done; base do "tempo ate
  -- resolver" do email de conclusao.
  resolved_at timestamptz
);

-- Listagem do admin: filtra por status e ordena por created_at desc.
create index if not exists admin_bugs_status_created_at_idx
  on public.admin_bugs (status, created_at desc);

alter table public.admin_bugs enable row level security;

-- SEM policies de proposito, como notifications: todo acesso passa pelo
-- server (service role) atras de requireAdmin. Expor select/insert direto ao
-- client vazaria dados internos de operacao pra usuarios autenticados.
