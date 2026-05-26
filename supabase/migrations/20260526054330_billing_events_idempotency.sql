-- Passo 3: idempotencia/ordenacao de webhooks de billing (Asaas).
-- billing_events: dedupe por event id do Asaas. last_event_at: ordenacao por assinatura.

create table if not exists public.billing_events (
  id text primary key,                 -- event.id do Asaas (evt_...); fallback = hash do payload
  event_type text not null,
  provider_subscription_id text,
  payment_id text,
  event_created_at timestamptz,        -- event.dateCreated do Asaas (ordenacao)
  received_at timestamptz not null default now(),
  raw jsonb
);

create index if not exists billing_events_subscription_idx
  on public.billing_events (provider_subscription_id);

alter table public.subscriptions
  add column if not exists last_event_at timestamptz;

-- Tabela so e acessada pelo backend (service role, que ignora RLS).
-- RLS habilitada sem policies bloqueia anon/authenticated via Data API.
alter table public.billing_events enable row level security;
