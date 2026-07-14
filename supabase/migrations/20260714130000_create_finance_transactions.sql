-- Receita sincronizada da Stripe em regime de CAIXA (fonte de verdade: balance
-- transactions da Stripe, nunca plans.price_cents). Tudo em centavos (bigint).
-- Idempotencia pelo stripe_balance_transaction_id (unique).

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_balance_transaction_id text unique not null,
  stripe_charge_id text,
  stripe_invoice_id text,
  -- charge | refund | adjustment | dispute | payout
  type text not null check (
    type in ('charge', 'refund', 'adjustment', 'dispute', 'payout')
  ),
  gross_cents bigint not null, -- bruto (NEGATIVO em refund/dispute)
  fee_cents bigint not null,   -- taxa da Stripe
  net_cents bigint not null,   -- o que efetivamente entrou (gross - fee)
  currency text not null,
  occurred_at timestamptz not null,
  -- Pode nao mapear para um usuario/plano: null e um estado legitimo, nao um erro.
  user_id uuid references auth.users(id) on delete set null,
  plan_code text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists finance_transactions_occurred_at_idx
  on public.finance_transactions (occurred_at);
create index if not exists finance_transactions_type_idx
  on public.finance_transactions (type);
create index if not exists finance_transactions_user_id_idx
  on public.finance_transactions (user_id);

-- RLS: sem NENHUMA policy, nega tudo por padrao. So o service role (supabaseAdmin,
-- que bypassa RLS) le e escreve. Nenhum acesso via anon/authenticated.
alter table public.finance_transactions enable row level security;
