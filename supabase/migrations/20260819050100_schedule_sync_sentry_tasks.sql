-- Agenda o sync do Sentry para o quadro de tarefas
-- (/api/cron/sync-sentry-tasks). Reusa public.call_cron_endpoint e o secret
-- 'cron_secret' do vault ja criados em 20260518003955_schedule_cron_jobs.sql.
-- Aditiva e idempotente.
--
-- E a M8 do docs/plano-unificar-bugs-tarefas.md, a ultima migration do plano e a
-- que faltava: ate aqui o endpoint existia e so era disparado a mao, entao a
-- ingestao, a reabertura, a poda e o retry de push so aconteciam quando alguem
-- lembrava.
--
-- O QUE PASSA A RODAR SOZINHO, e cada item e um buraco que existia:
--
--   ingestao     issue nova do Sentry vira card sem ninguem disparar nada;
--   reabertura   card concluido cujo erro voltou (lastSeen > completed_at) volta
--                para a etapa inicial com completed_at limpo. Sem o agendamento,
--                fechar um bug no CRM significava ficar CEGO para a recorrencia;
--   poda         card nunca triado, sem evento ha 21 dias, e arquivado;
--   retry        push de resolucao que o Sentry recusou e reenviado (Fase 0 do
--                job, antes da resolucao de quadro). Sem o agendamento, uma
--                pendencia gravada em admin_tasks.sentry_sync_pending NUNCA era
--                reenviada, e a issue ficava aberta para sempre em silencio.
--
-- CADENCIA: 15 minutos, e o numero vem do plano, nao de conveniencia. A secao
-- "Onde mora o retry, e por que" (por volta da linha 1234) justifica hospedar o
-- retry aqui dizendo que "o job ja roda a cada 15 minutos", ou seja, o desenho
-- do retry foi decidido supondo esta cadencia. Mudar para 30 minutos dobraria a
-- pior espera de uma pendencia sem que nada no plano peca isso.
--
-- CABE NA JANELA: o lock distribuido do job tem TTL de 600s (server/routes/cron.ts,
-- withCronLock("sync-sentry-tasks", 600)), que e menor que o intervalo de 900s.
-- Uma run pendurada solta o lock antes de a proxima chegar, entao nao ha
-- sobreposicao nem fila crescente.
--
-- ORCAMENTO DE RATE LIMIT: pior caso por run e uma listagem, ate 25 detalhes de
-- issue nova (TETO_CRIACAO_POR_RUN), ate 10 recoletas (TETO_RECOLETA_POR_RUN) e
-- ate 25 pushes de retry (TETO_RETRY_POR_RUN), mais as buscas em lote. Todos os
-- tetos sao por run e o relatorio nunca trunca em silencio: o que sobra do teto
-- sai em `foraDoTeto`. A 15 minutos isso e folgado, e o job que dividia esse
-- orcamento (reconcile-sentry-bugs) esta sendo desagendado na migration vizinha.
--
-- ORDEM DE DEPLOY: esta migration agenda um cron que chama um endpoint que so
-- existe DEPOIS do deploy do codigo. Aplicada ANTES do deploy, o cron bate em 404
-- (inofensivo) ate o codigo subir. Preferir aplicar DEPOIS do deploy. Mesmo
-- motivo escrito em 20260723120100_schedule_reconcile_sentry_bugs.sql.
--
-- APLICAR DEPOIS DE 20260819050000_unschedule_reconcile_sentry_bugs.sql.

BEGIN;

-- Limpa schedule anterior se ja existir (idempotente).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'sync-sentry-tasks';

-- sync-sentry-tasks: a cada 15 minutos. Ver CADENCIA acima.
SELECT cron.schedule(
  'sync-sentry-tasks',
  '*/15 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/sync-sentry-tasks')$$
);

COMMIT;
