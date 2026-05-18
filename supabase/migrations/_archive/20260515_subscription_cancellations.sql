-- Cancelamento de assinatura: agendamento ao fim do período + analítica de motivos

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

create index if not exists subscriptions_cancel_at_period_end_idx
  on public.subscriptions (cancel_at_period_end)
  where cancel_at_period_end = true;

create table if not exists public.subscription_cancellations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_subscription_id text,
  reason_code text check (reason_code in ('expensive', 'unused', 'missing_feature', 'paused', 'other')),
  reason_text text,
  canceled_at timestamptz not null default now(),
  effective_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'reverted'))
);

create index if not exists subscription_cancellations_user_id_idx
  on public.subscription_cancellations (user_id);

create index if not exists subscription_cancellations_canceled_at_idx
  on public.subscription_cancellations (canceled_at desc);

create index if not exists subscription_cancellations_status_idx
  on public.subscription_cancellations (status);

alter table public.subscription_cancellations enable row level security;

-- Toda escrita/leitura passa pelo backend (supabaseAdmin com service_role bypassa RLS).
-- Para frontend, usuário pode ler suas próprias linhas (futuro: histórico de cancelamento).
create policy "subscription_cancellations_owner_select"
  on public.subscription_cancellations
  for select
  using (auth.uid() = user_id);
