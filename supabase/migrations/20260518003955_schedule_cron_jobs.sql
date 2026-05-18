-- Agenda jobs HTTP para /api/cron/* via pg_cron + pg_net.
-- Autenticação via secret armazenado em vault.secrets ('cron_secret').
--
-- Pré-requisito externo (não versionável): vault.secrets row 'cron_secret'
-- precisa ter sido criada via:
--   SELECT vault.create_secret('<value>', 'cron_secret', '...');

-- Extensions são CREATE EXTENSION IF NOT EXISTS pra a migration ser
-- auto-contida e funcionar no shadow DB do `supabase db diff`.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

BEGIN;

-- Helper: chama um endpoint /api/cron/<path> no backend com header x-cron-secret.
CREATE OR REPLACE FUNCTION public.call_cron_endpoint(endpoint_path text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $fn$
DECLARE
  v_secret text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'cron_secret not found in vault';
  END IF;

  SELECT net.http_post(
    url := 'https://api.boranatech.com.br' || endpoint_path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$fn$;

COMMENT ON FUNCTION public.call_cron_endpoint(text) IS
  'Helper for pg_cron to call /api/cron/* endpoints with x-cron-secret header from vault.';

REVOKE ALL ON FUNCTION public.call_cron_endpoint(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.call_cron_endpoint(text) TO postgres;

-- Limpa schedules anteriores se já existirem (migration idempotente)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('process-cancellations', 'sync-news', 'sync-jobs');

-- process-cancellations: a cada hora, no minuto 5
SELECT cron.schedule(
  'process-cancellations',
  '5 * * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/process-cancellations')$$
);

-- sync-news: a cada 6 horas, no minuto 15 (escalonado)
SELECT cron.schedule(
  'sync-news',
  '15 */6 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/sync-news')$$
);

-- sync-jobs: a cada 6 horas, no minuto 30 (escalonado)
SELECT cron.schedule(
  'sync-jobs',
  '30 */6 * * *',
  $$SELECT public.call_cron_endpoint('/api/cron/sync-jobs')$$
);

COMMIT;
