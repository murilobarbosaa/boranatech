-- Generaliza billing_events para multiplos providers de pagamento.
-- Default 'asaas' preserva as linhas existentes (todas do Asaas) sem backfill.
-- O webhook Stripe grava provider = 'stripe' explicitamente; o Asaas confia no default.

alter table public.billing_events
  add column if not exists provider text not null default 'asaas';
