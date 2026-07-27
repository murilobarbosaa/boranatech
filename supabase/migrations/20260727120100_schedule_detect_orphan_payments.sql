-- Agenda a deteccao de pagamento orfao (/api/cron/detect-orphan-payments).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'detect-orphan-payments';

-- A cada 6 horas, no minuto 50: mesma cadencia do reconcile-subscriptions e 5
-- minutos DEPOIS dele (:45), de proposito. O reconcile conserta o que ainda tem
-- linha; o que sobrar depois dele e orfao de verdade, nao corrida. Escalonado dos
-- demais (process-cancellations :05, sync-news :15, sync-jobs :30).
--
-- Por que 6h e nao diario: a janela de retry da Stripe e de ~3 dias, entao 6h
-- detecta o problema ainda dentro do prazo em que um resend manual resolve.
-- Por que nao mais frequente: a carencia de 15 minutos do job ja absorve a
-- latencia normal do webhook, e cada execucao e uma listagem paginada da Stripe.
SELECT cron.schedule(
  'detect-orphan-payments',
  '50 */6 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/detect-orphan-payments')$$
);

COMMIT;
