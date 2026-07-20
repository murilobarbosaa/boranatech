-- Agendamento de notificacoes in-app. Adiciona o status 'scheduled' e a coluna
-- scheduled_for; um cron (publish-scheduled-notifications) varre a cada 5 min e
-- promove scheduled -> published quando scheduled_for <= now(). Precisao de
-- 5 min e aceitavel para o produto.
--
-- Por que NAO reusar 'published' com published_at futuro: a visibleQuery
-- (server/lib/notificationAudience.ts) filtra apenas status = 'published' e NAO
-- compara published_at <= now(), entao uma linha published com data futura
-- VAZARIA imediatamente no feed. 'scheduled' e um status a parte, excluido da
-- visibleQuery por natureza (so 'published' e visivel ao usuario), e nunca
-- aparece ate o cron promover.

BEGIN;

-- 1) Novo status 'scheduled' no check de status. O check de coluna original
-- (20260716120000) recebe o nome padrao notifications_status_check.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_status_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- 2) Momento do disparo agendado. null fora de 'scheduled'. published_at
-- continua sendo setado no MOMENTO do disparo (pelo cron ou pelo publish
-- imediato), nunca no agendamento, para o feed ordenar por published_at desc e
-- o "ha X" ficar correto.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

COMMENT ON COLUMN public.notifications.scheduled_for IS
  'Momento do disparo agendado (status = scheduled). O cron publish-scheduled-notifications promove scheduled -> published quando scheduled_for <= now(), setando published_at no momento do disparo. scheduled e excluido da visibleQuery e nunca vaza no feed do usuario.';

-- 3) Indice parcial para o cron varrer so as agendadas (conjunto pequeno).
CREATE INDEX IF NOT EXISTS notifications_scheduled_for_idx
  ON public.notifications (scheduled_for)
  WHERE status = 'scheduled';

-- 4) Agenda o cron a cada 5 min. Reusa public.call_cron_endpoint e o secret
-- 'cron_secret' do vault ja criados em 20260518003955_schedule_cron_jobs.sql.
-- Mesmo padrao aditivo/idempotente de 20260715120100 (unschedule por nome +
-- cron.schedule). Sem CREATE EXTENSION: pg_cron ja existe.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'publish-scheduled-notifications';

SELECT cron.schedule(
  'publish-scheduled-notifications',
  '*/5 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/publish-scheduled-notifications')$$
);

COMMIT;
