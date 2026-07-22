-- Watchdog de liveness das campanhas de e-mail (alert-only, Rodada 2).
-- RPC de LEITURA: retorna campanhas em 'sending' com destinatarios pending que
-- pararam de progredir ha >= p_stale_minutes. Nenhuma escrita, nenhum efeito na
-- fila; e so o insumo do cron /api/cron/campaign-liveness, que apenas alerta.
--
-- Progresso e medido por MAX(sent_at) dos recipients; o coalesce usa
-- started_at e, por fim, created_at (NOT NULL) como piso, para uma campanha
-- recem-iniciada (ainda sem nenhum send) nao ser flagada dentro da janela.
-- O HAVING pending_count > 0 exclui campanhas ja drenadas/fechadas.
--
-- LIMITACAO CONHECIDA (decisao de produto): falhas NAO carimbam timestamp
-- (email_campaign_record_result grava sent_at = NULL na falha), entao uma cauda
-- 100%-falha aparece como "travada" mesmo progredindo em falhas. E um cenario
-- anormal (o Resend rejeitando em massa) que merece alerta de qualquer forma;
-- por isso a versao simples via MAX(sent_at) foi escolhida de proposito, em vez
-- de um snapshot stateful.
--
-- Indice: reusa email_campaign_recipients_pending_idx (campaign_id, status,
-- position); campaign_id lidera o indice, servindo o join e o count filtrado. A
-- consulta so toca recipients de campanhas 'sending' (tipicamente 0-1 por vez).
--
-- RLS/grants no padrao das outras RPCs de campanha: apenas service_role.

BEGIN;

CREATE OR REPLACE FUNCTION public.email_campaign_find_stuck(
  p_stale_minutes int DEFAULT 15
)
  RETURNS TABLE (
    campaign_id uuid,
    subject text,
    started_at timestamptz,
    pending_count bigint,
    sent_count int,
    failed_count int,
    total_recipients int,
    last_sent_at timestamptz
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT
    c.id,
    c.subject,
    c.started_at,
    count(*) FILTER (WHERE r.status = 'pending') AS pending_count,
    c.sent_count,
    c.failed_count,
    c.total_recipients,
    max(r.sent_at) AS last_sent_at
  FROM public.email_campaigns c
  JOIN public.email_campaign_recipients r ON r.campaign_id = c.id
  WHERE c.status = 'sending'
  GROUP BY c.id
  HAVING count(*) FILTER (WHERE r.status = 'pending') > 0
     AND coalesce(max(r.sent_at), c.started_at, c.created_at)
         < now() - make_interval(mins => p_stale_minutes);
$$;

REVOKE ALL ON FUNCTION public.email_campaign_find_stuck(int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_campaign_find_stuck(int) TO service_role;

COMMENT ON FUNCTION public.email_campaign_find_stuck(int) IS
  'Watchdog alert-only: campanhas sending com pending>0 sem progresso (MAX(sent_at), piso started_at/created_at) ha >= p_stale_minutes. Limitacao: falhas nao carimbam timestamp, entao cauda 100%-falha aparece como travada.';

COMMIT;
