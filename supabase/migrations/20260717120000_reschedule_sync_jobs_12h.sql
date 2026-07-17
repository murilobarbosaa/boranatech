-- Reativa o cron sync-jobs no schedule de 12h (front VAGAS).
--
-- APLICACAO MANUAL: aplicar no SQL Editor e carimbar com
--   supabase migration repair --status applied 20260717120000
-- junto do lote. NAO via db push (padrao das migrations de pg_cron do projeto,
-- ex. 20260518003955 e 20260702120000).
--
-- Contexto: o sync-jobs foi agendado a cada 6h (20260518003955) e pausado
-- (20260518233658, active=false, ainda o estado atual em prod: jobid 3). O
-- pipeline multi-fonte (runVagasSync: adzuna/github/jooble-us/ats_boards) esta
-- pronto e cabeado em POST /api/cron/sync-jobs. Esta migration reativa o job
-- num tick de 12h. A cadencia POR FONTE continua no runVagasSync via Redis; o
-- tick e so o gatilho. Substitui e torna obsoleta a 20260712210000 (unpause
-- file-only nunca aplicada; ver nota de remocao no lote).
--
-- Pre-req externo (nao versionavel): vault.secrets 'cron_secret' ja existe
-- (os outros 8 jobs usam public.call_cron_endpoint com ele).

BEGIN;

-- Idempotente: desagenda o sync-jobs atual se existir; se nao houver linha, o
-- SELECT nao retorna nada e nenhum unschedule roda (nao explode em re-run).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'sync-jobs';

-- Reagenda ativo, a cada 12h no minuto 30 (00:30 e 12:30 UTC). Longe do
-- reindex-search (04:45) e dos syncs de conteudo (minutos 15/30 a cada 6h).
SELECT cron.schedule(
  'sync-jobs',
  '30 */12 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/sync-jobs')$$
);

-- Fontes de vagas em content_sources: recordSync (server/routes/cron.ts:246)
-- so loga fontes cadastradas (getSource por code). Herdado da 20260712210000.
-- jooble INCLUIDO aqui de proposito: nao ha INSERT versionado dele (a linha
-- atual foi criada a mao), entao a migration nao pode depender desse estado.
-- ON CONFLICT (code) DO NOTHING = no-op nas ja existentes. type 'jobs-api' e
-- status 'active' conforme os CHECK constraints de content_sources.
INSERT INTO public.content_sources (code, name, type, base_url, status)
VALUES
  ('jooble', 'Jooble Jobs API', 'jobs-api', 'https://jooble.org', 'active'),
  ('adzuna', 'Adzuna Jobs API', 'jobs-api', 'https://api.adzuna.com', 'active'),
  ('github', 'GitHub vagas repos', 'jobs-api', 'https://api.github.com', 'active'),
  ('ats_boards', 'ATS boards (Greenhouse/Lever)', 'jobs-api', null, 'active')
ON CONFLICT (code) DO NOTHING;

COMMIT;
