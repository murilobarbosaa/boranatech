-- Agenda o job diario de snapshot de assinaturas (/api/cron/snapshot-subscriptions).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicar esta migration ANTES do deploy faz o
-- cron bater em 404 diariamente (05:10 UTC) ate o codigo subir. Aplicar DEPOIS do
-- deploy: a primeira execucao ja encontra a rota. Preferir aplicar depois; se
-- aplicada antes, o unico efeito e um 404 diario inofensivo ate o deploy.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'snapshot-subscriptions';

-- snapshot-subscriptions: uma vez por dia, 05:10 UTC. Fora do cluster 04:20/04:30/
-- 04:45 e do :05 horario do process-cancellations; estado ja estabilizado pelos
-- webhooks e pela rede de seguranca financeira (04:20).
SELECT cron.schedule(
  'snapshot-subscriptions',
  '10 5 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/snapshot-subscriptions')$$
);

COMMIT;
