-- Agenda a reindexacao completa e diaria do search_documents via pg_cron,
-- no mesmo padrao dos jobs de conteudo (20260518003955): pg_cron chama o
-- endpoint do Railway via public.call_cron_endpoint (header x-cron-secret).
-- Aplicada MANUALMENTE no SQL Editor e versionada aqui; nunca via db push.
-- Entra no checklist de publicacao junto com a 20260701120000, em ordem
-- cronologica, com supabase migration repair --status applied depois.

BEGIN;

-- Limpa schedule anterior se ja existir (migration idempotente)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'reindex-search';

-- reindex-search: diaria, 04:45 UTC (madrugada no Brasil, fora dos horarios
-- dos syncs de conteudo, que rodam nos minutos 15 e 30 a cada 6 horas)
SELECT cron.schedule(
  'reindex-search',
  '45 4 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/reindex-search')$$
);

COMMIT;
