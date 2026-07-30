-- Resultado dos reembolsos emitidos pelo admin (Fatia 7).
--
-- POR QUE UMA TABELA, e não só a auditoria: content_audit_logs é append-only e
-- guarda a INTENÇÃO, escrita ANTES da chamada à Stripe (fail-closed). O `re_...`
-- é RESULTADO, e só existe depois. Sem esta tabela, o único rastro do que a
-- Stripe devolveu seria a linha que o sync reconstrói em finance_transactions,
-- que NÃO tem ator nem vínculo com a intenção — ou seja, ninguém consegue
-- responder "quem reembolsou isto" sem abrir o dashboard da Stripe.
--
-- É a única ação de toda a demanda sem desfazer. Poder reconstruir exatamente o
-- que aconteceu vale uma tabela de 8 colunas.
--
-- ORDEM DE DEPLOY: ANTES do código, pelas mesmas duas razões da 20260730140000:
-- audit fail-closed e código que escreve em tabela inexistente falha na hora.
--
-- ADITIVA e ISENTA da janela destrutiva: cria tabela nova e vazia e amplia uma
-- CHECK. Rollback é DROP do que acabou de ser criado.

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dono da cobrança reembolsada.
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Quem emitiu. NOT NULL: reembolso sem ator identificado não deve existir.
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  stripe_charge_id text NOT NULL,
  -- Id devolvido pela Stripe (re_...). Nullable porque a linha é gravada DEPOIS
  -- da chamada; se a escrita falhar e for retentada, o id já é conhecido.
  stripe_refund_id text UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'BRL',
  -- Texto livre do admin, íntegro. O enum que foi para a Stripe é derivado e
  -- vive em stripe_reason.
  reason text NOT NULL,
  stripe_reason text,
  -- Status devolvido pela Stripe no momento da criação (succeeded, pending...).
  stripe_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_refunds_user_id_idx
  ON public.admin_refunds(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_refunds_charge_idx
  ON public.admin_refunds(stripe_charge_id);

-- RLS ligado SEM policy: nega tudo por padrão. Só o service role (backend) lê e
-- escreve. Mesmo padrão de influencers e billing_orphan_payments.
ALTER TABLE public.admin_refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_refunds FROM PUBLIC, anon, authenticated;

-- Auditoria da INTENÇÃO de reembolso, com valor próprio.
ALTER TABLE "public"."content_audit_logs"
    DROP CONSTRAINT IF EXISTS "content_audit_logs_action_check";

ALTER TABLE "public"."content_audit_logs"
    ADD CONSTRAINT "content_audit_logs_action_check"
    CHECK (("action" = ANY (ARRAY[
        'create'::"text",
        'update'::"text",
        'delete'::"text",
        'publish'::"text",
        'unpublish'::"text",
        'reveal'::"text",
        'grant'::"text",
        'revoke'::"text",
        'update_profile'::"text",
        'update_email'::"text",
        'cancel_subscription'::"text",
        'refund'::"text"
    ])));

COMMIT;
