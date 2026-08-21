-- Agenda a regua de recuperacao de pagamento recusado
-- (/api/cron/payment-recovery). Reusa public.call_cron_endpoint e o secret
-- 'cron_secret' do vault, criados em 20260518003955_schedule_cron_jobs.sql.
-- Aditiva e idempotente.
--
-- ============================================================================
-- NAO APLICAR ANTES DA COPY DA ANA ESTAR APROVADA.
--
-- O template `sendPaymentRecoveryEmail` (server/lib/email.ts, RECOVERY_COPY) esta
-- com TODO(Ana) em todas as 5 variantes. Agendar isto antes da revisao de copy
-- manda texto provisorio para cliente real, e e-mail enviado nao volta.
--
-- Enquanto este agendamento NAO existir em cron.job, NENHUM e-mail sai: nada
-- chama POST /api/cron/payment-recovery, entao runPaymentRecovery() nunca roda e
-- enqueueEmail() nunca e alcancado. O codigo pode estar em producao com seguranca.
-- ============================================================================
--
-- CADENCIA: 15 minutos, deslocada em 7 (7, 22, 37, 52).
--
-- Por que 15 e nao 5: o debounce da regua e de 30 minutos de silencio
-- (shared/paymentRecovery.ts, DEBOUNCE_MS), entao varrer de 5 em 5 nao antecipa
-- nada e so triplica consulta. Por que nao 30: com a varredura de 30 min o atraso
-- do primeiro e-mail seria de 30 a 60 min depois da ultima tentativa; com 15 fica
-- entre 30 e 45.
--
-- Por que DESLOCADA e nao */15: os jobs de */5
-- (publish-scheduled-notifications, reconcile-email-campaigns,
-- campaign-liveness) e o de */15 (reconcile-sentry-bugs) todos caem no minuto 0,
-- 15, 30 e 45. Rodar junto empilharia quatro a cinco chamadas no mesmo instante
-- contra o mesmo backend. Os minutos 7/22/37/52 nao colidem com nenhum dos 15
-- jobs existentes.
--
-- TTL do lock (300s, em server/routes/cron.ts) e MENOR que o intervalo (900s), de
-- proposito: uma execucao travada nao bloqueia a proxima indefinidamente.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'payment-recovery';

SELECT cron.schedule(
  'payment-recovery',
  '7,22,37,52 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/payment-recovery')$$
);

COMMIT;
