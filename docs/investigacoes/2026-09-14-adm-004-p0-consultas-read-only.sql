-- ADM-004-P0 — diagnóstico agregado e estritamente read-only.
-- Não retorna email, nome, documento, user_id ou identificador externo.
-- Executar somente por operador autorizado no ambiente correto.
-- Registrar externamente: ambiente, horário UTC, executor e hash desta versão.

begin transaction read only;
set local statement_timeout = '30s';
set local lock_timeout = '2s';
set local timezone = 'UTC';

-- 1. Cobertura temporal e moedas do ledger de caixa.
select
  provider,
  currency,
  type,
  count(*) as rows_count,
  min(occurred_at) as first_effective_at,
  max(occurred_at) as last_effective_at,
  max(created_at) as last_observed_at,
  sum(gross_cents) as gross_cents,
  sum(fee_cents) as fee_cents,
  sum(net_cents) as net_cents,
  count(*) filter (where provider_transaction_id is null) as missing_provider_tx_id,
  count(*) filter (where user_id is null) as unowned_rows,
  count(*) filter (where plan_code is null) as unattributed_plan_rows
from public.finance_transactions
group by provider, currency, type
order by provider, currency, type;

-- 2. Caixa mensal por provider/moeda/tipo. Não soma moedas entre si.
select
  date_trunc('month', occurred_at) as month_utc,
  provider,
  currency,
  type,
  count(*) as rows_count,
  sum(gross_cents) as gross_cents,
  sum(fee_cents) as fee_cents,
  sum(net_cents) as net_cents
from public.finance_transactions
group by date_trunc('month', occurred_at), provider, currency, type
order by month_utc, provider, currency, type;

-- 3. Estado operacional atual de assinaturas, separado por modalidade.
select
  coalesce(p.code, 'unmapped') as plan_code,
  s.provider,
  coalesce(s.payment_method, 'unknown') as payment_method,
  coalesce(s.renewal_type, 'unknown') as renewal_type,
  s.status,
  count(*) as subscription_rows,
  count(distinct s.user_id) as distinct_accounts,
  count(*) filter (where s.current_period_start is null) as missing_period_start,
  count(*) filter (where s.current_period_end is null) as missing_period_end,
  count(*) filter (where s.provider_subscription_id is null) as missing_external_link,
  min(s.created_at) as first_observed_at,
  max(s.updated_at) as last_observed_at
from public.subscriptions s
left join public.plans p on p.id = s.plan_id
group by p.code, s.provider, s.payment_method, s.renewal_type, s.status
order by plan_code, s.provider, payment_method, renewal_type, s.status;

-- 4. Teste agregado da suficiência contratual atual.
select
  count(*) as all_rows,
  count(*) filter (where status in ('active', 'trialing', 'past_due')) as current_candidate_rows,
  count(*) filter (where status in ('active', 'trialing', 'past_due') and plan_id is null) as missing_plan,
  count(*) filter (where status in ('active', 'trialing', 'past_due') and current_period_start is null) as missing_start,
  count(*) filter (where status in ('active', 'trialing', 'past_due') and current_period_end is null) as missing_end,
  count(*) filter (where status in ('active', 'trialing', 'past_due') and payment_method is null) as missing_method,
  count(*) filter (where status in ('active', 'trialing', 'past_due') and provider_subscription_id is null) as missing_provider_id,
  count(*) filter (where status = 'active' and renewal_type = 'manual') as active_manual,
  count(*) filter (where status = 'active' and renewal_type = 'auto') as active_auto,
  count(*) filter (where cancel_at_period_end) as cancel_scheduled
from public.subscriptions;

-- 5. Recebimento/processamento de eventos. Tipos são categorias, não ids.
select
  provider,
  event_type,
  count(*) as events_count,
  count(*) filter (where processed_at is null) as unfinished_count,
  min(event_created_at) as first_effective_at,
  max(event_created_at) as last_effective_at,
  max(received_at) as last_received_at,
  max(processed_at) as last_processed_at
from public.billing_events
group by provider, event_type
order by provider, event_type;

-- 6. Latência agregada de entrega/processamento; sem payload.
select
  provider,
  count(*) filter (where event_created_at is not null) as comparable_events,
  percentile_cont(0.5) within group (
    order by extract(epoch from (received_at - event_created_at))
  ) filter (where event_created_at is not null) as receive_lag_p50_seconds,
  percentile_cont(0.95) within group (
    order by extract(epoch from (received_at - event_created_at))
  ) filter (where event_created_at is not null) as receive_lag_p95_seconds,
  max(extract(epoch from (received_at - event_created_at)))
    filter (where event_created_at is not null) as receive_lag_max_seconds
from public.billing_events
group by provider
order by provider;

-- 7. Snapshots: cobertura, frescor e gaps por calendário UTC.
with bounds as (
  select min(snapshot_date) as first_date, max(snapshot_date) as last_date
  from public.subscription_snapshots
), expected as (
  select generate_series(first_date, last_date, interval '1 day')::date as d
  from bounds
), missing as (
  select e.d
  from expected e
  left join public.subscription_snapshots s on s.snapshot_date = e.d
  where s.snapshot_date is null
)
select
  (select first_date from bounds) as first_snapshot_date,
  (select last_date from bounds) as last_snapshot_date,
  (select count(*) from public.subscription_snapshots) as snapshot_count,
  (select count(*) from missing) as missing_days,
  current_date - (select last_date from bounds) as calendar_days_since_last;

-- 8. Últimos totais derivados, sem fingir que são MRR contratual.
select
  snapshot_date,
  active_count,
  trialing_count,
  past_due_count,
  canceled_count,
  mrr_cents as catalog_run_rate_cents
from public.subscription_snapshots
order by snapshot_date desc
limit 31;

-- 9. Cancelamentos por status/motivo. reason_text é deliberadamente omitido.
select
  status,
  coalesce(reason_code, 'not_collected') as reason_code,
  count(*) as rows_count,
  min(canceled_at) as first_canceled_at,
  max(canceled_at) as last_canceled_at,
  count(*) filter (where effective_at is null) as missing_effective_at
from public.subscription_cancellations
group by status, reason_code
order by status, reason_code;

-- 10. Refunds declarados/resultantes, separados por settlement e provider.
select
  provider,
  settlement,
  currency,
  coalesce(provider_status, 'unknown') as provider_status,
  count(*) as refunds_count,
  sum(amount_cents) as amount_cents,
  min(created_at) as first_observed_at,
  max(created_at) as last_observed_at,
  count(*) filter (where provider_refund_id is null) as missing_provider_refund_id
from public.admin_refunds
group by provider, settlement, currency, provider_status
order by provider, settlement, currency, provider_status;

-- 11. Afiliados: totais agregados; não retorna código, dono ou contato.
select
  status,
  count(*) as affiliate_rows,
  sum(clicks) as clicks,
  sum(trials) as trials,
  sum(sales) as sales,
  sum(revenue_cents) as attributed_revenue_cents,
  sum(commission_due_cents) as commission_due_cents,
  sum(commission_paid_cents) as commission_paid_cents
from public.affiliates
group by status
order by status;

-- 12. Cupons agregados sem expor códigos.
select
  status,
  discount_percent,
  count(*) as coupon_count,
  sum(times_redeemed) as times_redeemed,
  count(*) filter (where valid_until is not null and valid_until < now()) as expired_count,
  count(*) filter (where max_redemptions is not null and times_redeemed >= max_redemptions) as exhausted_count
from public.coupons
group by status, discount_percent
order by status, discount_percent;

rollback;
