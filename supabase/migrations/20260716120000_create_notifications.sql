-- Sistema de notificacoes in-app. Modelagem broadcast SEM fan-out: a mensagem
-- vive em notifications (uma linha por notificacao, nao por destinatario) e o
-- estado de leitura por usuario vive em notification_reads (linha criada
-- apenas quando o usuario le). Audience e avaliada na LEITURA pelo server
-- (server/lib/notificationAudience.ts), reutilizando a semantica dos
-- USER_SEGMENTS das campanhas de email: 'active_pro' segue a definicao de
-- is_user_pro (plano pago, status active/trialing, periodo vigente); past_due
-- fica fora de active_pro e ex_pro e enxerga apenas audience = 'all'.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- Limites defensivos: title cabe numa linha do popover, body e texto curto
  -- de anuncio (nao e email). Valores folgados pro conteudo real.
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 2000),
  type text not null default 'announcement'
    check (type in ('announcement', 'coupon', 'optin', 'system')),
  -- Mesma semantica de email_campaigns.category: 'product' e comunicacao de
  -- produto (legitimo interesse, opt-out); 'promotional' so aparece para
  -- usuarios com profiles.marketing_opt_in = true.
  category text not null default 'product'
    check (category in ('product', 'promotional')),
  audience text not null default 'all'
    check (audience in ('all', 'never_pro', 'active_pro', 'ex_pro')),
  coupon_code text,
  discount_percent integer
    check (discount_percent is null or discount_percent between 1 and 100),
  cta_url text,
  cta_label text,
  -- Validade do cupom/anuncio. null = nao expira. A expiracao e imposta
  -- server-side; expirada continua visivel no historico (is_expired anotado
  -- no payload), o countdown e responsabilidade do front.
  expires_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Cupom sem codigo nao existe: o front renderiza o codigo copiavel.
  constraint notifications_coupon_requires_code
    check (type <> 'coupon' or coupon_code is not null)
);

-- Feed do usuario: published ordenado por published_at desc.
create index if not exists notifications_status_published_at_idx
  on public.notifications (status, published_at desc);

-- Varredura de expiracao/countdown so interessa nas publicadas com validade.
create index if not exists notifications_expires_at_published_idx
  on public.notifications (expires_at)
  where status = 'published' and expires_at is not null;

create table if not exists public.notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id uuid not null references public.notifications (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists notification_reads_user_read_at_idx
  on public.notification_reads (user_id, read_at);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

-- notifications: SEM policies de proposito. A leitura passa sempre pelo
-- server (service role), que aplica audience/opt-in por usuario; expor select
-- direto ao client vazaria notificacoes de segmentos alheios.

-- notification_reads: usuario ve apenas as proprias linhas. Sem policy de
-- insert/update/delete de proposito: nenhum papel autenticado ou anonimo
-- grava; so o service role usado pelo servidor registra leitura, como em
-- user_consents.
drop policy if exists "notification_reads_select_own" on public.notification_reads;
create policy "notification_reads_select_own"
  on public.notification_reads
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
