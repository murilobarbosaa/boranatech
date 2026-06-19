-- Incremento atomico do contador de cliques de afiliado.
-- Substitui o read-then-write do endpoint publico POST /api/affiliates/:code/click,
-- que perdia atualizacoes concorrentes (lost update). So conta codigos ativos.
-- A tabela affiliates e service-role-only (RLS deny-all pra anon/authenticated),
-- entao o backend chama via supabaseAdmin (service role).
-- Idempotente.

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(p_code text)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  UPDATE public.affiliates
  SET clicks = clicks + 1
  WHERE code = p_code
    AND status = 'active';
$$;

REVOKE ALL ON FUNCTION public.increment_affiliate_clicks(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_affiliate_clicks(text) TO service_role;

COMMIT;
