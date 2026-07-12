-- Reativa o cron sync-jobs e cadastra as fontes novas de vagas (front VAGAS,
-- fase 3).
--
-- APLICACAO MANUAL PENDENTE: file-only, NAO aplicada via db push. Aplicar no
-- SQL Editor no checklist do push do lote, junto do supabase migration
-- repair das migrations pendentes.
--
-- O sync-jobs foi pausado pela migration 20260518233658 quando a Jooble nao
-- cobria Brasil. O pipeline multi-fonte da fase 2 (adzuna, github,
-- ats_boards, jooble/us) substitui aquele fluxo; o agendamento original (a
-- cada 6 horas, minuto 30; migration 20260518003955) volta a valer. A
-- cadencia POR FONTE e controlada dentro do runVagasSync via Redis, entao o
-- tick de 6h e apenas o gatilho.

DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'sync-jobs';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id := v_jobid, active := true);
  END IF;
END $$;

-- Fontes novas em content_sources (recordSync no cron so loga fontes
-- cadastradas). Idempotente pelo unique de code; type 'jobs-api' e o valor
-- permitido pelo check constraint para fontes de vagas.
INSERT INTO public.content_sources (code, name, type, base_url, status)
VALUES
  ('adzuna', 'Adzuna Jobs API', 'jobs-api', 'https://api.adzuna.com', 'active'),
  ('github', 'GitHub vagas repos', 'jobs-api', 'https://api.github.com', 'active'),
  ('ats_boards', 'ATS boards (Greenhouse/Lever)', 'jobs-api', null, 'active')
ON CONFLICT (code) DO NOTHING;
