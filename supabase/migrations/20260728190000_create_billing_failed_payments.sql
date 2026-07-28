-- Registro de PAGAMENTO RECUSADO: tentativa de cobranca que a Stripe nao
-- aprovou (emissor recusou, Radar bloqueou, dados invalidos).
--
-- Nasceu de uma medicao: em 90 dias houve 53 charges com falha, 20 pessoas
-- distintas, 12 que nunca conseguiram pagar, e NENHUMA delas deixou rastro do
-- nosso lado. O motivo e estrutural: `charge.failed` e
-- `payment_intent.payment_failed` nao estavam inscritos no endpoint nem no
-- switch de handleWebhook, e `invoice.payment_failed` (que esta) so dispara em
-- fatura de assinatura -- ou seja, so em RENOVACAO. A primeira cobranca recusada
-- nao gera invoice nem subscription no Checkout hospedado, entao ela nao existia
-- em lugar nenhum a nao ser no painel da Stripe.
--
-- ESTA TABELA NAO CONCEDE NEM REVOGA ACESSO. E diagnostico e insumo da regua de
-- recuperacao. Nada em is_user_pro olha para ca.
--
-- provider_object_id UNIQUE: o id do objeto que falhou (ch_... ou pi_...). E a
-- chave de idempotencia -- a Stripe reentrega evento, e cada tentativa nova gera
-- um objeto NOVO, entao o UNIQUE dedupe reentrega sem colapsar tentativas
-- distintas da mesma pessoa (que e justamente o dado que interessa).
--
-- supabase_user_id e text, NAO uuid, pelo mesmo motivo da
-- billing_orphan_payments: o valor vem de metadata e pode faltar ou vir
-- malformado. Tabela de diagnostico nao pode falhar ao registrar o diagnostico.
--
-- RLS deny-all para anon/authenticated (padrao de 20260611120000): so o backend
-- via service role escreve e le. PURAMENTE ADITIVA (tabela nova e vazia): isenta
-- da janela de migration destrutiva, rollback e DROP TABLE.

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_failed_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'stripe',
  provider_object_id text UNIQUE NOT NULL,
  -- 'charge' ou 'payment_intent': o mesmo evento de recusa chega pelos dois
  -- caminhos e os dois sao gravados, porque nem toda recusa gera charge (Radar
  -- bloqueia antes da rede em alguns casos) e nem todo PI falho gera charge.
  object_type text NOT NULL,
  payment_intent_id text,
  customer_id text,
  supabase_user_id text,
  email text,
  amount_cents integer,
  currency text,
  plan_id text,
  -- Motivo, cru como a Stripe entregou. Sem traducao aqui: o vocabulario de
  -- decline_code muda do lado deles e uma tabela de mapeamento no banco
  -- apodrece. A leitura amigavel e da UI.
  failure_code text,
  decline_code text,
  -- advice_code: a Stripe diz se vale retentar ('try_again_later') ou nao
  -- ('do_not_try_again'). E o campo que decide se a regua de recuperacao deve
  -- sugerir "tente de novo" ou "use outro cartao".
  advice_code text,
  outcome_type text,
  outcome_reason text,
  risk_level text,
  seller_message text,
  failure_message text,
  attempted_at timestamptz NOT NULL,
  event_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- O acesso normal e "as recusas mais recentes".
CREATE INDEX IF NOT EXISTS billing_failed_payments_attempted_idx
  ON public.billing_failed_payments(attempted_at DESC);

-- "quantas vezes esta pessoa tentou": e a consulta da regua de recuperacao e do
-- corte anti-spam.
CREATE INDEX IF NOT EXISTS billing_failed_payments_email_idx
  ON public.billing_failed_payments(email, attempted_at DESC);

ALTER TABLE public.billing_failed_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_failed_payments
  FROM PUBLIC, anon, authenticated;

COMMIT;
