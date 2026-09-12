-- Agenda o lembrete de Pix pendente (/api/cron/pix-pending-reminders). Reusa
-- public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.
--
-- CADENCIA: de hora em hora, no minuto 20, longe do minuto 5 do
-- process-cancellations e das horas cheias. A cobranca Pix vive dois dias e o
-- primeiro lembrete sai a partir de duas horas de vida; uma rodada diaria
-- gastaria metade da janela util.
--
-- A EXPRESSAO E EM UTC E NAO CARREGA A JANELA DE ENVIO. O horario permitido
-- (09h a 21h de Brasilia) e checado no codigo, em decidirLembretePix, porque
-- regra de horario precisa ser testavel e expressao cron nao e. Fora da janela
-- a rodada roda, le e pula tudo com o motivo `fora_do_horario`, contado no
-- cron_run_logs. Na pratica saem 12 rodadas uteis por dia, de 09h20 a 20h20 de
-- Brasilia.
--
-- CABE NO INTERVALO: o lock distribuido do job tem TTL de 600s (server/routes/cron.ts,
-- withCronLock("pix-pending-reminders", 600)), bem menor que os 3600s entre
-- duas rodadas.
--
-- O ENDPOINT NASCE DESLIGADO: sem PIX_REMINDERS_ENABLED=true no Railway, cada
-- rodada so observa e grava no cron_run_logs quantos lembretes enviaria.
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicada antes, o cron bate em 404
-- (inofensivo) ate o codigo subir. Preferir aplicar DEPOIS do deploy.
--
-- O checkMigrationsApplied NAO verifica jobs do pg_cron. Depois de aplicar,
-- conferir a mao:
--   select jobname, schedule from cron.job where jobname = 'pix-pending-reminders';
--
-- Aplicada manualmente no SQL Editor pela Ana.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'pix-pending-reminders';

-- pix-pending-reminders: de hora em hora, no minuto 20 (UTC). Ver CADENCIA.
SELECT cron.schedule(
  'pix-pending-reminders',
  '20 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/pix-pending-reminders')$$
);

COMMIT;
