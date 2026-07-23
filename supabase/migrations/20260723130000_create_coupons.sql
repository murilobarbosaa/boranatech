-- Cupons de desconto de marketing, SEPARADOS dos afiliados: sem comissao nem
-- atribuicao, com janela de validade, limite de usos e restricao opcional de
-- planos. O desconto (percentual, primeira cobranca) e aplicado no checkout
-- Stripe via coupon deterministico bnt_promo_<percent>_once, mesmo mecanismo do
-- desconto de afiliado (providers/stripe.ts).
-- code sempre uppercase, mesmo padrao dos afiliados (CHECK com o regex da rota).
-- RLS deny-all para anon/authenticated (padrao corrigido em 20260611120000):
-- a tabela so e acessada pelo backend via service role, que faz bypass de RLS.
-- Ao contrario da migration original de afiliados (arquivada sem rodar em prod,
-- ver nota em 20260529120000), esta entra no fluxo normal de migrations.
-- Idempotente.

BEGIN;

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL
    CHECK (code ~ '^[A-Z0-9]{3,32}$'),
  description text,
  discount_percent integer NOT NULL
    CHECK (discount_percent BETWEEN 1 AND 100),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'inactive')),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  max_redemptions integer
    CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  times_redeemed integer NOT NULL DEFAULT 0,
  applicable_plans text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_status_idx ON public.coupons(status);

DROP TRIGGER IF EXISTS coupons_updated_at ON public.coupons;
CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coupons FROM PUBLIC, anon, authenticated;

-- Contador atomico de resgates, chamado pelo webhook de ativacao (mesmo padrao
-- dos increment_affiliate_*: SECURITY DEFINER, search_path fixado,
-- service-role-only). Filtra so por code: o resgate ja aconteceu (assinatura
-- ativou com desconto aplicado), entao conta mesmo se o cupom foi pausado ou
-- expirou entre o checkout e a ativacao.
CREATE OR REPLACE FUNCTION public.increment_coupon_redemption(p_code text)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  UPDATE public.coupons
  SET times_redeemed = times_redeemed + 1
  WHERE code = p_code;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_redemption(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_redemption(text)
  TO service_role;

-- Espelha subscriptions.affiliate_code: registra qual cupom deu o desconto.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS coupon_code text;

CREATE INDEX IF NOT EXISTS subscriptions_coupon_code_idx
  ON public.subscriptions(coupon_code);

COMMIT;
