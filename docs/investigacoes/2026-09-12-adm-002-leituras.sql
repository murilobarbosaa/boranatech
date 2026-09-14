-- ADM-002-P0 — leituras agregadas do painel "Atenção necessária"
-- Revisão: 2026-09-12
-- SOMENTE LEITURA. Não executa funções, RPCs, DML, DDL ou bloqueios.
--
-- Uso recomendado:
--   1. executar numa sessão/read replica com credencial explicitamente read-only;
--   2. substituir a literal de corte em todas as consultas pelo mesmo instante;
--   3. guardar início/fim da consulta como metadados externos;
--   4. revisar o plano e a existência das colunas antes de executar.
--
-- As consultas não demonstram cobertura histórica integral ou uma fotografia
-- transacional entre provedores. Resultados ausentes significam "zero observado
-- nesta leitura", não "nunca aconteceu". Nenhuma consulta retorna e-mail, nome,
-- CPF, payload bruto ou identificador completo de cliente/pagamento.

-- Instante de corte preparado: 2026-09-12T02:45:00-03:00. A repetição literal
-- evita criar tabela temporária ou depender de variável específica do cliente.

-- 1. Estados locais de acesso que hoje alimentam past_due, saídas e vencimentos.
-- O valor abaixo é contagem de linhas/usuários, não dívida nem recebimento.
SELECT
  s.status,
  COALESCE(s.renewal_type, 'nao_identificado') AS renewal_type,
  COALESCE(s.payment_method, 'nao_identificado') AS payment_method,
  count(*) AS subscription_rows,
  count(DISTINCT s.user_id) FILTER (WHERE s.user_id IS NOT NULL) AS identified_users,
  count(*) FILTER (WHERE s.user_id IS NULL) AS rows_without_user,
  count(*) FILTER (WHERE s.current_period_end IS NULL) AS rows_without_period_end,
  count(*) FILTER (WHERE s.current_period_end < c.cutoff) AS expired_period_rows,
  min(s.last_event_at) AS oldest_last_event_at,
  max(s.last_event_at) AS newest_last_event_at
FROM subscriptions s
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE s.status IN ('active', 'trialing', 'past_due', 'pending')
GROUP BY s.status, COALESCE(s.renewal_type, 'nao_identificado'),
         COALESCE(s.payment_method, 'nao_identificado')
ORDER BY s.status, renewal_type, payment_method;

-- 2. Past_due local cruzado apenas com recebimento registrado positivo.
-- Não afirma obrigação aberta. Mostra se há movimento de caixa posterior ao
-- último evento local, sem considerar isso prova automática de recuperação.
SELECT
  count(*) AS past_due_rows,
  count(*) FILTER (WHERE s.user_id IS NULL) AS without_user,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1
    FROM finance_transactions ft
    WHERE ft.user_id = s.user_id
      AND ft.type = 'charge'
      AND ft.gross_cents > 0
      AND ft.occurred_at > s.last_event_at
      AND ft.occurred_at <= c.cutoff
  )) AS with_later_positive_registered_charge
FROM subscriptions s
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE s.status = 'past_due';

-- 3. Movimentos de caixa registrados na janela móvel de 30 dias.
-- Eixos separados; não mistura provedor, meio e natureza.
SELECT
  ft.provider,
  COALESCE(ft.plan_code, 'nao_identificado') AS plan_code,
  ft.type,
  count(*) AS ledger_rows,
  count(DISTINCT ft.user_id) FILTER (WHERE ft.user_id IS NOT NULL) AS identified_users,
  count(*) FILTER (WHERE ft.user_id IS NULL) AS rows_without_user,
  sum(ft.gross_cents) AS gross_amount_cents,
  min(ft.occurred_at) AS oldest_occurred_at,
  max(ft.occurred_at) AS newest_occurred_at
FROM finance_transactions ft
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE ft.occurred_at >= c.cutoff - interval '30 days'
  AND ft.occurred_at <= c.cutoff
GROUP BY ft.provider, COALESCE(ft.plan_code, 'nao_identificado'), ft.type
ORDER BY ft.provider, plan_code, ft.type;

-- 4. Entregas/processamentos de webhook Stripe e Asaas, agregados por evento.
-- billing_events é histórico de processamento, não estado atual da cobrança.
SELECT
  be.provider,
  be.event_type,
  count(*) AS event_rows,
  count(*) FILTER (WHERE be.processed_at IS NULL) AS unprocessed_rows,
  count(*) FILTER (WHERE be.provider_subscription_id IS NULL) AS without_subscription_link,
  count(*) FILTER (WHERE be.payment_id IS NULL) AS without_payment_link,
  min(be.event_created_at) AS oldest_provider_event_at,
  max(be.event_created_at) AS newest_provider_event_at,
  max(be.processed_at) AS newest_processed_at
FROM billing_events be
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE be.event_created_at >= c.cutoff - interval '30 days'
  AND be.event_created_at <= c.cutoff
GROUP BY be.provider, be.event_type
ORDER BY be.provider, be.event_type;

-- 5. Falha de invoice Stripe versus evento posterior pago da MESMA assinatura.
-- É uma aproximação agregada por provider_subscription_id, não reconciliação da mesma
-- invoice/obrigação; a API atual não persiste invoice_id em coluna normalizada.
WITH failed AS (
  SELECT provider_subscription_id, event_created_at
  FROM billing_events
  CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
  WHERE provider = 'stripe'
    AND event_type = 'invoice.payment_failed'
    AND event_created_at >= c.cutoff - interval '30 days'
    AND event_created_at <= c.cutoff
), classified AS (
  SELECT
    f.provider_subscription_id,
    f.event_created_at,
    EXISTS (
      SELECT 1 FROM billing_events paid
      CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
      WHERE paid.provider = 'stripe'
        AND paid.event_type = 'invoice.paid'
        AND paid.provider_subscription_id = f.provider_subscription_id
        AND paid.event_created_at > f.event_created_at
        AND paid.event_created_at <= c.cutoff
    ) AS later_paid_same_subscription
  FROM failed f
)
SELECT
  count(*) AS failed_event_rows,
  count(*) FILTER (WHERE provider_subscription_id IS NULL) AS without_subscription_link,
  count(*) FILTER (WHERE later_paid_same_subscription) AS with_later_paid_same_subscription,
  count(*) FILTER (WHERE NOT later_paid_same_subscription) AS without_later_paid_same_subscription
FROM classified;

-- 6. Órfãos persistidos. A consulta inclui as duas famílias conhecidas; o painel
-- atual só materializa linhas com expected_provider_subscription_id.
SELECT
  CASE
    WHEN resolved_at IS NOT NULL THEN 'resolved'
    WHEN expected_provider_subscription_id IS NOT NULL THEN 'open_with_expected_subscription'
    WHEN stripe_charge_id IS NOT NULL THEN 'open_charge_without_expected_subscription'
    ELSE 'open_without_supported_identity'
  END AS orphan_class,
  count(*) AS rows,
  count(*) FILTER (
    WHERE supabase_user_id IS NULL AND candidate_user_id IS NULL
  ) AS rows_without_user_or_candidate,
  count(*) FILTER (WHERE amount_total_cents IS NULL) AS rows_without_known_amount,
  sum(amount_total_cents) FILTER (
    WHERE amount_total_cents IS NOT NULL
  ) AS known_session_amount_cents,
  min(COALESCE(session_created_at, detected_at)) AS oldest_evidence_at,
  max(COALESCE(session_created_at, detected_at)) AS newest_evidence_at
FROM billing_orphan_payments
GROUP BY orphan_class
ORDER BY orphan_class;

-- 7. Cobertura técnica das linhas ainda abertas, sem expor IDs.
SELECT
  count(*) FILTER (WHERE resolved_at IS NULL) AS open_rows,
  count(*) FILTER (WHERE resolved_at IS NULL AND expected_provider_subscription_id IS NULL) AS open_without_expected_subscription,
  count(*) FILTER (WHERE resolved_at IS NULL AND stripe_charge_id IS NULL AND stripe_session_id IS NULL) AS open_without_charge_or_session,
  count(*) FILTER (
    WHERE resolved_at IS NULL
      AND supabase_user_id IS NULL
      AND candidate_user_id IS NULL
  ) AS open_without_user_or_candidate,
  min(detected_at) FILTER (WHERE resolved_at IS NULL) AS oldest_open_detected_at,
  max(detected_at) FILTER (WHERE resolved_at IS NULL) AS newest_open_detected_at
FROM billing_orphan_payments;

-- 8. Renovações manuais próximas do fim. Isso mede estado de acesso; a existência
-- de pending não prova pagamento nem a ausência dele prova obrigação vencida.
SELECT
  count(*) AS active_manual_ending_in_7d,
  count(DISTINCT s.user_id) FILTER (WHERE s.user_id IS NOT NULL) AS identified_users,
  count(*) FILTER (WHERE s.user_id IS NULL) AS without_user,
  count(*) FILTER (WHERE s.payment_method IS NULL) AS without_payment_method,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM subscriptions p
    WHERE p.user_id = s.user_id
      AND p.status = 'pending'
      AND p.created_at >= s.current_period_start
      AND p.created_at <= c.cutoff
  )) AS with_pending_row_after_period_start
FROM subscriptions s
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE s.status = 'active'
  AND s.renewal_type = 'manual'
  AND s.current_period_end > c.cutoff
  AND s.current_period_end <= c.cutoff + interval '7 days';

-- 9. Evidência de lembrete: o array é marcado depois de enfileirar e antes de a
-- fila necessariamente entregar; portanto não é entrega comprovada.
SELECT
  count(*) FILTER (WHERE cardinality(renewal_reminders_sent) > 0) AS subscriptions_with_any_marker,
  count(*) FILTER (WHERE 'd7' = ANY(renewal_reminders_sent)) AS subscriptions_with_d7_marker,
  count(*) FILTER (WHERE 'd1' = ANY(renewal_reminders_sent)) AS subscriptions_with_d1_marker,
  count(*) FILTER (WHERE 'd0' = ANY(renewal_reminders_sent)) AS subscriptions_with_d0_marker
FROM subscriptions;

-- 10. Concessão de influencer x estado local de assinatura. Trialing é separado
-- porque não prova assinatura paga.
SELECT
  s.status,
  count(DISTINCT i.user_id) AS users_with_grant_and_subscription_state
FROM influencers i
JOIN subscriptions s ON s.user_id = i.user_id
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE i.revoked_at IS NULL
  AND s.status IN ('active', 'trialing')
  AND (s.current_period_end IS NULL OR s.current_period_end > c.cutoff)
GROUP BY s.status
ORDER BY s.status;

-- 11. Despesas do mês civil anterior de Brasília, agregadas.
WITH bounds AS (
  SELECT
    date_trunc('month', cutoff AT TIME ZONE 'America/Sao_Paulo')::date AS this_month,
    (date_trunc('month', cutoff AT TIME ZONE 'America/Sao_Paulo') - interval '1 month')::date AS previous_month
  FROM (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
)
SELECT count(*) AS expense_rows, sum(COALESCE(amount_cents, 0)) AS expense_cents
FROM expenses e, bounds b
WHERE e.incurred_on >= b.previous_month
  AND e.incurred_on < b.this_month;

-- 12. IA: custo por dia civil, inclusive cobertura de custo ausente/inválido.
SELECT
  (l.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS brasilia_day,
  count(*) AS log_rows,
  count(*) FILTER (WHERE l.cost_estimate IS NULL) AS without_cost,
  sum(l.cost_estimate) AS measured_cost_usd
FROM ai_usage_logs l
CROSS JOIN (VALUES (timestamptz '2026-09-12T02:45:00-03:00')) AS c(cutoff)
WHERE l.created_at >= c.cutoff - interval '15 days'
  AND l.created_at <= c.cutoff
GROUP BY brasilia_day
ORDER BY brasilia_day;

-- billing_failed_payments não recebe consulta preparada: na árvore main
-- inspecionada ela aparece nos tipos, mas não existe migration/escritor ativo.
-- Confirmar existência e contrato seria pré-condição para qualquer SELECT futuro.
