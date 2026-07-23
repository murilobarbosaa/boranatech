-- Agenda a reconciliacao periodica do bug tracker com o Sentry
-- (/api/cron/reconcile-sentry-bugs). Reusa public.call_cron_endpoint e o secret
-- 'cron_secret' do vault ja criados em 20260518003955_schedule_cron_jobs.sql.
-- Aditiva e idempotente.
--
-- Por que: backfill do id numerico de cards legados, retry das sincronizacoes de
-- status que falharam na transicao do card, e reabertura automatica de cards em
-- done cujo erro voltou a acontecer (lastSeen > resolved_at). O job e idempotente
-- e nao destrutivo, entao rodar de tempos em tempos so converge.
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicada ANTES do deploy, o cron bate em 404
-- (inofensivo) ate o codigo subir. Preferir aplicar DEPOIS do deploy.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'reconcile-sentry-bugs';

-- reconcile-sentry-bugs: a cada 15 minutos. Cadencia folgada; o sinal (erro
-- voltou a acontecer) nao e urgente e o job respeita o rate limit do Sentry.
SELECT cron.schedule(
  'reconcile-sentry-bugs',
  '*/15 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/reconcile-sentry-bugs')$$
);

COMMIT;
