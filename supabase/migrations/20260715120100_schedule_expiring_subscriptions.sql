-- Agenda o lembrete de renovacao de boleto (/api/cron/expiring-subscriptions).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'expiring-subscriptions';

-- Uma vez por dia: os marcos da regua sao por DIA (anual D-30/D-7/D-1, semestral
-- D-15/D-7/D-1), entao cadencia diaria basta e mais que isso so gastaria. 12:00
-- UTC = 09:00 BRT, horario diurno para melhor abertura. renewal_reminders_sent
-- torna run duplicada/atrasada segura: cada marco sai uma unica vez.
SELECT cron.schedule(
  'expiring-subscriptions',
  '0 12 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/expiring-subscriptions')$$
);

COMMIT;
