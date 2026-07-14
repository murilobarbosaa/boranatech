-- Agenda o job diario de sync financeiro (/api/cron/sync-finance).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados
-- em 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'sync-finance';

-- sync-finance: uma vez por dia, 04:20 (rede de seguranca do webhook Stripe).
SELECT cron.schedule(
  'sync-finance',
  '20 4 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/sync-finance')$$
);

COMMIT;
