-- Agenda o job de reconciliacao de assinaturas (/api/cron/reconcile-subscriptions).
-- Aditiva: reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja
-- criados em 20260518003955_schedule_cron_jobs.sql. Nao reescreve aquela migration.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'reconcile-subscriptions';

-- reconcile-subscriptions: a cada 6 horas, no minuto 45 (escalonado de
-- process-cancellations :05, sync-news :15, sync-jobs :30).
SELECT cron.schedule(
  'reconcile-subscriptions',
  '45 */6 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/reconcile-subscriptions')$$
);

COMMIT;
