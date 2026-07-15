-- Agenda a limpeza de boletos pendentes orfaos (/api/cron/expire-pending-boletos).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'expire-pending-boletos';

-- Uma vez por dia: a janela do orfao e em DIAS (boleto 3d + 1d de folga) e orfaos
-- sao raros (so webhook perdido), entao diario basta. 04:30 UTC, horario de
-- housekeeping (este cron nao manda e-mail, ao contrario do lembrete as 12:00).
SELECT cron.schedule(
  'expire-pending-boletos',
  '30 4 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/expire-pending-boletos')$$
);

COMMIT;
