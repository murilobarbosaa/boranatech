-- BACKFILL DOS EVENTOS DE VENDA DE CREATOR, a partir das assinaturas pagas.
--
-- O QUE RECONSTROI. `creator_events` existe desde o deploy do lote 01
-- (2026-09-14, 05:10 UTC). Venda anterior a isso nao virou evento, e a serie do
-- painel mostra menos vendas que o contador `affiliates.sales`. Esta migration
-- grava UM evento `sale` por assinatura paga que tenha codigo de afiliado e
-- ainda nao tenha evento `sale`. Cliques NAO sao reconstruidos: nunca houve
-- registro por clique antes da tabela.
--
-- O QUE CONTA COMO VENDA. Assinatura com `affiliate_code` de um afiliado que
-- existe (igualdade exata: os codigos sao gravados normalizados em maiusculas,
-- e a leitura de producao de 2026-09-15 achou zero diferencas so de caixa) e
-- com `current_period_start` preenchido. Nao ha coluna de ativacao em
-- `subscriptions`; `current_period_start` so e preenchido quando o provedor
-- confirma pagamento, e a leitura de producao mostrou que ele separa
-- exatamente as pagas (active, past_due e as canceladas que pagaram) das que
-- nunca pagaram (pending e as canceladas sem pagamento). Assinatura com codigo
-- que nao existe em affiliates fica de fora: o evento exige `affiliate_id`.
--
-- INSTANTE (`occurred_at`). A PRIMEIRA cobranca real da assinatura em
-- `finance_transactions` (type = 'charge'), e nao `created_at` (que existe antes
-- do pagamento) nem `current_period_start` (que anda a cada renovacao):
--   - asaas: a cobranca cujo `raw_payload->>'externalReference'` e o id da
--     assinatura (o checkout do Pix grava o id da linha ali);
--   - stripe: a cobranca mais antiga do MESMO usuario e do MESMO plano entre uma
--     hora antes da criacao da assinatura e sete dias depois (a maior distancia
--     medida em producao foi de 72 horas, num boleto).
-- Sem cobranca encontrada, o instante cai para `current_period_start` e
-- `metadata.occurred_at_fonte` diz isso.
--
-- VALOR (`revenue_cents`). O `gross_cents` dessa cobranca: o valor pago pela
-- pessoa, ja com desconto, antes da taxa do provedor. E a mesma definicao que o
-- server grava na venda ao vivo (`invoice.amount_paid` na Stripe,
-- `payment.value` no Asaas): o unico evento `sale` de producao antes deste
-- backfill tem revenue_cents 2242, igual ao gross_cents da cobranca dele (o
-- liquido seria 2043). Sem cobranca, `revenue_cents` e `commission_cents` ficam
-- null e `metadata.revenue_unknown` e true: a serie nao soma o que nao sabe.
--
-- COMISSAO. A mesma conta do SQL de conversao (increment_affiliate_conversion):
-- round(receita * commission_percent / 100.0), com o percentual ATUAL do
-- afiliado, como a venda ao vivo faz no instante em que acontece.
--
-- MEIO DE PAGAMENTO. `subscriptions.payment_method` quando e card, boleto ou
-- pix. As assinaturas Stripe anteriores a coluna (2026-07-14) nao tem o meio:
-- gravam null e `metadata.payment_method_unknown` true, sem deduzir.
--
-- NAO TOCA NOS CONTADORES. affiliates.sales, revenue_cents e
-- commission_due_cents continuam iguais: so insere eventos.
--
-- NAO DUPLICA. `not exists` por `subscription_id` contra qualquer `sale` ja
-- gravado, e a tabela e travada no inicio da transacao contra insercao
-- concorrente (o webhook gravando a venda de uma ativacao que acontecesse no
-- meio da migration). A trava e SHARE ROW EXCLUSIVE: leituras seguem livres,
-- insercoes esperam o fim da transacao. Rodar a migration de novo insere zero.
--
-- MARCADOR E REVERSAO. Todo evento reconstruido leva
-- `metadata.backfill = 'subscriptions-2026-09'` e `metadata.backfill_at`.
-- Reversao completa (ver o bloco ROLLBACK no fim do arquivo):
--   delete from public.creator_events
--   where metadata->>'backfill' = 'subscriptions-2026-09';
--
-- ADITIVA: so insere linhas novas, nao altera nem remove dado existente, e a
-- reversao e o delete pelo marcador. Isenta da janela de migration destrutiva
-- (CLAUDE.md). Nao muda tabela, funcao, indice nem policy: os EXPECTED_* do
-- checkMigrationsApplied nao mudam.

BEGIN;

LOCK TABLE public.creator_events IN SHARE ROW EXCLUSIVE MODE;

WITH pagas AS (
  SELECT
    s.id AS subscription_id,
    s.user_id,
    s.plan_id,
    s.provider,
    s.payment_method,
    s.created_at,
    s.current_period_start,
    a.id AS affiliate_id,
    a.commission_percent,
    p.code AS plan_code
  FROM public.subscriptions s
  JOIN public.affiliates a ON a.code = s.affiliate_code
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE s.affiliate_code IS NOT NULL
    AND s.current_period_start IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.creator_events e
      WHERE e.event_type = 'sale'
        AND e.subscription_id = s.id
    )
),
com_cobranca AS (
  SELECT
    pg.*,
    c.id AS finance_transaction_id,
    c.occurred_at AS cobranca_em,
    c.gross_cents
  FROM pagas pg
  LEFT JOIN LATERAL (
    SELECT ft.id, ft.occurred_at, ft.gross_cents
    FROM public.finance_transactions ft
    WHERE ft.type = 'charge'
      AND ft.provider = pg.provider
      AND (
        (
          pg.provider = 'asaas'
          AND ft.raw_payload->>'externalReference' = pg.subscription_id::text
        )
        OR (
          pg.provider = 'stripe'
          AND ft.user_id = pg.user_id
          AND ft.plan_code = pg.plan_code
          AND ft.occurred_at >= pg.created_at - interval '1 hour'
          AND ft.occurred_at < pg.created_at + interval '7 days'
        )
      )
    ORDER BY ft.occurred_at ASC, ft.id ASC
    LIMIT 1
  ) c ON true
)
INSERT INTO public.creator_events (
  affiliate_id,
  event_type,
  occurred_at,
  user_id,
  subscription_id,
  plan_id,
  payment_method,
  revenue_cents,
  commission_cents,
  metadata
)
SELECT
  cc.affiliate_id,
  'sale',
  coalesce(cc.cobranca_em, cc.current_period_start),
  cc.user_id,
  cc.subscription_id,
  cc.plan_id,
  CASE
    WHEN cc.payment_method IN ('card', 'boleto', 'pix') THEN cc.payment_method
    ELSE NULL
  END,
  cc.gross_cents::integer,
  CASE
    WHEN cc.gross_cents IS NULL THEN NULL
    ELSE round(cc.gross_cents * cc.commission_percent / 100.0)::integer
  END,
  jsonb_strip_nulls(
    jsonb_build_object(
      'backfill', 'subscriptions-2026-09',
      'backfill_at', now(),
      'occurred_at_fonte',
        CASE
          WHEN cc.cobranca_em IS NULL THEN 'current_period_start'
          ELSE 'finance_transactions'
        END,
      'finance_transaction_id', cc.finance_transaction_id,
      'revenue_unknown', CASE WHEN cc.gross_cents IS NULL THEN true END,
      'payment_method_unknown',
        CASE
          WHEN cc.payment_method IN ('card', 'boleto', 'pix') THEN NULL
          ELSE true
        END
    )
  )
FROM com_cobranca cc;

COMMIT;

-- CONFERENCIA (rodar DEPOIS do commit, so leitura):
--
-- 1. Quantos eventos o backfill inseriu, quantos sem receita e sem meio.
--    Esperado pela leitura de producao de 2026-09-15: 78 / 1 / 13.
-- select count(*) as inseridos,
--        count(*) filter (where metadata ? 'revenue_unknown') as sem_receita,
--        count(*) filter (where metadata ? 'payment_method_unknown') as sem_meio
--   from public.creator_events
--  where metadata->>'backfill' = 'subscriptions-2026-09';
--
-- 2. OREIDOSITES: esperado 3 linhas; as duas primeiras (13/09 21:58 UTC e
--    14/09 01:35 UTC) com backfill = subscriptions-2026-09, a terceira (14/09
--    17:52 UTC) sem marcador, que e o evento gravado ao vivo.
-- select e.occurred_at, e.revenue_cents, e.commission_cents, e.payment_method,
--        e.metadata->>'backfill' as backfill
--   from public.creator_events e
--   join public.affiliates a on a.id = e.affiliate_id
--  where a.code = 'OREIDOSITES' and e.event_type = 'sale'
--  order by e.occurred_at;

-- ROLLBACK:
-- delete from public.creator_events
-- where metadata->>'backfill' = 'subscriptions-2026-09';
