-- Agenda a rede de seguranca periodica das campanhas de e-mail
-- (/api/cron/reconcile-email-campaigns). Reusa public.call_cron_endpoint e o
-- secret 'cron_secret' do vault ja criados em 20260518003955_schedule_cron_jobs.sql.
-- Aditiva e idempotente.
--
-- Por que: o worker da fila email-campaign tem concorrencia 1; um envio pendurado
-- ou um restart deixa recipients pending que so eram reenfileirados no boot. Este
-- cron chama a MESMA reconcileEmailCampaignBatches a cada 5min, curando campanhas
-- travadas sem depender de um restart do processo.
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicada ANTES do deploy, o cron bate em 404
-- a cada 5min ate o codigo subir (inofensivo). Aplicada DEPOIS do deploy, a
-- primeira execucao ja encontra a rota. Preferir aplicar depois.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente). Sem linha em cron.job, o
-- SELECT retorna zero linhas e cron.unschedule nem e chamado: seguro num banco
-- onde o job ainda nao existe.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'reconcile-email-campaigns';

-- reconcile-email-campaigns: a cada 5 minutos. Rede de seguranca do worker de
-- concorrencia 1; reenfileira pending de campanhas sending que ficaram parados.
SELECT cron.schedule(
  'reconcile-email-campaigns',
  '*/5 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/reconcile-email-campaigns')$$
);

COMMIT;
