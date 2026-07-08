-- Limpeza atomica do cancelamento de lote. Causa raiz do incidente dos 100
-- e-mails: dispatch que falha DEPOIS de inserir recipients deixava os pending
-- orfaos no banco quando o lote era cancelado; a reconciliacao do boot nao
-- distinguia esses orfaos e os reenfileirava no deploy seguinte.
--
-- email_campaign_cleanup_canceled_batch(p_batch_id):
-- 1. So age se o lote esta canceled (chamada com lote em outro status e no-op).
-- 2. Deleta os recipients daquele batch_id ainda pending (NUNCA sent/failed:
--    o que ja foi resolvido e historico e permanece).
-- 3. Decrementa total_recipients da campanha pelo que deletou, na mesma
--    transacao, com lock na linha da campanha (mesma serializacao do
--    email_campaign_add_recipients).
-- 4. Campanha sending que ficou sem NENHUM recipient e sem lote pending volta
--    pra draft (permite corrigir e recomecar); caso contrario reavalia o
--    fechamento via email_campaign_try_complete.

BEGIN;

CREATE OR REPLACE FUNCTION public.email_campaign_cleanup_canceled_batch(p_batch_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_campaign_id uuid;
  v_deleted integer;
  v_remaining integer;
BEGIN
  SELECT b.campaign_id INTO v_campaign_id
  FROM public.email_campaign_batches b
  WHERE b.id = p_batch_id
    AND b.status = 'canceled';

  IF v_campaign_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM 1 FROM public.email_campaigns c WHERE c.id = v_campaign_id FOR UPDATE;

  DELETE FROM public.email_campaign_recipients r
  WHERE r.batch_id = p_batch_id
    AND r.status = 'pending';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    UPDATE public.email_campaigns
    SET total_recipients = GREATEST(COALESCE(total_recipients, 0) - v_deleted, 0)
    WHERE id = v_campaign_id;
  END IF;

  SELECT COUNT(*)::integer INTO v_remaining
  FROM public.email_campaign_recipients r
  WHERE r.campaign_id = v_campaign_id;

  IF v_remaining = 0
     AND NOT EXISTS (
       SELECT 1
       FROM public.email_campaign_batches b
       WHERE b.campaign_id = v_campaign_id
         AND b.status = 'pending'
     ) THEN
    UPDATE public.email_campaigns
    SET status = 'draft',
        total_recipients = NULL,
        started_at = NULL
    WHERE id = v_campaign_id
      AND status = 'sending';
  ELSE
    PERFORM public.email_campaign_try_complete(v_campaign_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.email_campaign_cleanup_canceled_batch(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_campaign_cleanup_canceled_batch(uuid) TO service_role;

COMMIT;
