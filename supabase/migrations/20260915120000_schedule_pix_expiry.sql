-- Agenda a expiracao de Pix vencido (/api/cron/expire-pending-pix). Reusa
-- public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.
--
-- CADENCIA: uma vez por dia, as 06h50 UTC, que sao 03h50 de Brasilia. Depois
-- da hora em que o PAYMENT_OVERDUE foi medido chegando (entre 03h e 04h do dia
-- seguinte ao vencimento) e antes da janela do lembrete de Pix (09h a 21h de
-- Brasilia). Diario e nao de hora em hora: excluir cobranca nao tem pressa, e
-- uma rodada por dia reduz a superficie de escrita remota.
--
-- A FOLGA NAO MORA NA EXPRESSAO CRON. O corte (vencimento anterior a ONTEM em
-- Brasilia, ou sem vencimento e criada ha mais de 4 dias) e checado no codigo,
-- em rodarExpiracaoPix, porque regra de prazo precisa ser testavel e expressao
-- cron nao e.
--
-- CABE NO INTERVALO: o lock distribuido do job tem TTL de 600s (server/routes/cron.ts,
-- withCronLock("expire-pending-pix", 600)), muito menor que as 24 horas entre
-- duas rodadas.
--
-- O ENDPOINT NASCE DESLIGADO: sem PIX_EXPIRY_ENABLED=true no Railway, cada
-- rodada le as cobrancas no Asaas e grava no cron_run_logs quantas cancelaria,
-- sem excluir nada no Asaas e sem tocar em linha nenhuma.
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicada antes, o cron bate em 404
-- (inofensivo) ate o codigo subir. Preferir aplicar DEPOIS do deploy.
--
-- O checkMigrationsApplied NAO verifica jobs do pg_cron. Depois de aplicar,
-- conferir a mao:
--   select jobname, schedule from cron.job where jobname = 'expire-pending-pix';
--
-- Aplicada manualmente no SQL Editor pela Ana.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'expire-pending-pix';

-- expire-pending-pix: uma vez por dia, 06h50 UTC (03h50 de Brasilia). Ver CADENCIA.
SELECT cron.schedule(
  'expire-pending-pix',
  '50 6 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/expire-pending-pix')$$
);

COMMIT;
