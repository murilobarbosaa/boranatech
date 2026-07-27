-- Registro de PAGAMENTO ORFAO: Checkout Session paga na Stripe que NAO tem linha
-- correspondente em public.subscriptions. Nasceu de uma investigacao real: os
-- returns mudos de providers/stripe.ts (sem supabase_user_id, sem plano
-- resolvivel, session sem subscription) respondem 200 para a Stripe e nao criam
-- linha nenhuma, entao o reconcile-subscriptions -- que so itera linhas que JA
-- existem -- fica cego aquele pagamento para sempre. Nenhum job partia da Stripe
-- para o banco; este e o lado que faltava.
--
-- Preenchida pelo cron detect-orphan-payments. O job so DETECTA: nao promove
-- ninguem, nao mexe em subscriptions. Auto-cura e decisao separada.
--
-- stripe_session_id UNIQUE: o job varre uma janela deslizante e reencontra o
-- mesmo orfao a cada execucao. O UNIQUE torna a deteccao idempotente
-- (detected_at = primeira vez, last_seen_at = ultima).
--
-- supabase_user_id e text, NAO uuid, de proposito: o valor vem de
-- session.metadata e pode estar ausente ou malformado -- que e exatamente o caso
-- que gera o orfao. Uma tabela de diagnostico nao pode falhar ao registrar o
-- diagnostico.
--
-- RLS deny-all para anon/authenticated (padrao de 20260611120000): so o backend
-- via service role escreve e le. Aditiva e idempotente.

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_orphan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE NOT NULL,
  -- Chave que DEVERIA existir em subscriptions.provider_subscription_id:
  -- sub_... no cartao, cs_... no boleto (que nao gera subscription na Stripe).
  expected_provider_subscription_id text,
  supabase_user_id text,
  customer_email text,
  plan_id text,
  amount_total_cents integer,
  currency text,
  payment_status text,
  session_mode text,
  session_created_at timestamptz,
  detected_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  -- Preenchido a mao quando o caso for tratado (promocao manual, reembolso,
  -- falso positivo). O job NUNCA resolve sozinho.
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- O acesso normal e "o que ainda esta em aberto, mais recente primeiro".
CREATE INDEX IF NOT EXISTS billing_orphan_payments_unresolved_idx
  ON public.billing_orphan_payments(detected_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.billing_orphan_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_orphan_payments
  FROM PUBLIC, anon, authenticated;

COMMIT;
