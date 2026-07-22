-- Agenda o watchdog de liveness das campanhas (/api/cron/campaign-liveness).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados
-- em 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.
--
-- Por que: complementa o reconcile-email-campaigns (que TENTA curar) com um
-- alerta quando uma campanha sending para de progredir por >=15min. So observa
-- (Sentry + log); a recuperacao automatica ja vem do socketTimeout da
-- queueConnection. Depende do RPC email_campaign_find_stuck (migration
-- 20260721160000).
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicada ANTES do deploy, o cron bate em
-- 404 a cada 5min ate o codigo subir (inofensivo). Preferir aplicar DEPOIS do
-- deploy. O RPC (160000) pode ser aplicado antes ou junto, sem risco.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente). Sem linha em cron.job, o
-- SELECT retorna zero linhas e cron.unschedule nem e chamado.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'campaign-liveness';

-- campaign-liveness: a cada 5 minutos. Alert-only; deteccao via Postgres.
SELECT cron.schedule(
  'campaign-liveness',
  '*/5 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/campaign-liveness')$$
);

COMMIT;
