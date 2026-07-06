-- Incrementos atomicos dos contadores de afiliado (auditoria de
-- escalabilidade, secao 7.2: lost update no read-then-write de
-- billing.ts). Duas funcoes, mesmo padrao do increment_affiliate_clicks
-- (SECURITY DEFINER, search_path fixado, service-role-only):
--
-- increment_affiliate_conversion: webhook de ativacao. Soma 1 venda, soma a
-- receita e calcula a comissao DENTRO do UPDATE usando o commission_percent
-- corrente da linha, eliminando tambem o drift do percent lido antes da
-- escrita. round() do Postgres em cents positivos coincide com o Math.round
-- do JS que fazia essa conta.
--
-- increment_affiliate_trials: checkout com cupom em primeira compra.
--
-- Ambas filtram apenas por id: a checagem de status/existencia continua no
-- caller (comportamento identico ao update anterior). Idempotente (CREATE OR
-- REPLACE); aplicar via SQL Editor + migration repair (fluxo manual do repo).

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_affiliate_conversion(
  p_affiliate_id uuid,
  p_revenue_cents integer
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  UPDATE public.affiliates
  SET sales = sales + 1,
      revenue_cents = revenue_cents + p_revenue_cents,
      commission_due_cents = commission_due_cents
        + round(p_revenue_cents * commission_percent / 100.0)::integer
  WHERE id = p_affiliate_id;
$$;

REVOKE ALL ON FUNCTION public.increment_affiliate_conversion(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_affiliate_conversion(uuid, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.increment_affiliate_trials(
  p_affiliate_id uuid
)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  UPDATE public.affiliates
  SET trials = trials + 1
  WHERE id = p_affiliate_id;
$$;

REVOKE ALL ON FUNCTION public.increment_affiliate_trials(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_affiliate_trials(uuid)
  TO service_role;

COMMIT;
