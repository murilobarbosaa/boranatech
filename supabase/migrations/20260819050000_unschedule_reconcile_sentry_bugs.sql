-- Desagenda o reconcile-sentry-bugs (/api/cron/reconcile-sentry-bugs).
-- Restritiva no agendamento, NAO destrutiva nos dados: nao dropa tabela, nao
-- apaga linha, nao altera coluna. Isenta da janela de 05h-09h.
--
-- POR QUE. O job opera sobre `admin_bugs` (server/lib/sentryBugReconcile.ts, sete
-- consultas, todas naquela tabela), e `admin_bugs` foi APOSENTADA na Fase 5:
-- os 25 bugs viraram cards em `admin_tasks`, e a tabela ficou de pe somente para
-- leitura historica (server/routes/adminBugs.ts:7, invariante 4). Desde entao ele
-- roda de 15 em 15 minutos sobre 25 linhas congeladas que nenhuma tela consome.
--
-- Pior que inutil: se ele voltasse a encontrar trabalho, mandaria e-mail e
-- notificacao sobre um bug cuja representacao viva agora e o card, produzindo
-- aviso duplicado e divergencia entre as duas copias. A recomendacao de
-- desagendar esta em docs/plano-unificar-bugs-tarefas.md (secao "O
-- `reconcile-sentry-bugs` deixou de fazer sentido", por volta da linha 1190), que
-- a coloca no roteiro da Fase 6 por ser acao de banco.
--
-- ORDEM: aplicar ANTES de agendar o sync-sentry-tasks. Os dois falam com a mesma
-- API do Sentry, e tirar o morto primeiro evita somar orcamento de rate limit com
-- um job que nao serve a ninguem.
--
-- O CODIGO NAO SAI. `sentryBugReconcile.ts`, `sentryBugSync.ts` e a rota
-- `/api/cron/reconcile-sentry-bugs` continuam existindo: desagendar e reversivel
-- (basta reagendar), remover codigo nao e. Se o job precisar voltar, o SQL do
-- agendamento original esta em 20260723120100_schedule_reconcile_sentry_bugs.sql.
--
-- IDEMPOTENTE: sem linha em cron.job, o SELECT nao devolve nada e nada acontece.

BEGIN;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'reconcile-sentry-bugs';

COMMIT;
