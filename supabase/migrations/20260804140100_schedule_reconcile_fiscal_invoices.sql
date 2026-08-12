-- Agenda a reconciliacao fiscal (/api/cron/reconcile-fiscal-invoices).
-- Reusa public.call_cron_endpoint e o secret 'cron_secret' do vault ja criados em
-- 20260518003955_schedule_cron_jobs.sql. Aditiva e idempotente.
--
-- Ha PRECEDENTE de agendar por migration neste projeto (a
-- 20260727120100_schedule_detect_orphan_payments.sql faz exatamente isto), entao
-- este arquivo segue o precedente em vez de virar um passo manual de painel.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'reconcile-fiscal-invoices';

-- A cada 6 horas, no minuto 55.
--
-- A POSICAO NA HORA NAO E ARBITRARIA. Os jobs de dinheiro ja ocupam :45
-- (reconcile-subscriptions) e :50 (detect-orphan-payments), e este precisa vir
-- DEPOIS dos dois: o reconcile arruma as assinaturas, o detect-orphan acusa
-- pagamento sem linha, e so entao faz sentido perguntar "que cobranca ficou sem
-- nota?". Rodar antes acusaria como faltante o que o job anterior ainda ia
-- criar, gerando alarme falso a cada ciclo.
--
-- Por que 6h e nao diario: uma nota bloqueada por cadastro incompleto e
-- destravada em ate 6 horas depois de a pessoa preencher, mesmo que o gancho
-- sincrono do PATCH /api/me tenha falhado. Por que nao mais frequente: o
-- caminho rapido (webhook e gancho de perfil) ja cobre o caso normal, e cada
-- execucao varre finance_transactions da janela.
SELECT cron.schedule(
  'reconcile-fiscal-invoices',
  '55 */6 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/reconcile-fiscal-invoices')$$
);

COMMIT;
