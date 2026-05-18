-- Pausa o cron sync-jobs até decisão sobre fonte de vagas BR
-- (Jooble não cobre Brasil; sub-projeto Vagas Marketplace planejado)

DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'sync-jobs';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id := v_jobid, active := false);
  END IF;
END $$;
